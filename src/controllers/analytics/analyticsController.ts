import { Request, Response } from 'express';
import { Analytics, Transaction, Merchant } from '../../models';
import { logger } from '../../utils/helpers/logger';

// Request interfaces
interface AnalyticsRequest {
  period?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

// Response interfaces
interface AnalyticsResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class AnalyticsController {
  /**
   * Get analytics overview
   * GET /api/v1/analytics/overview
   */
  static async getAnalyticsOverview(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { period = '30d' }: AnalyticsRequest = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get transaction statistics
      const transactionStats = await Transaction.aggregate([
        {
          $match: {
            merchantId: merchantId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' }
          }
        }
      ]);

      // Get payment method distribution
      const paymentMethodStats = await Transaction.aggregate([
        {
          $match: {
            merchantId: merchantId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      // Get daily transaction trends
      const dailyTrends = await Transaction.aggregate([
        {
          $match: {
            merchantId: merchantId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            successCount: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Calculate summary metrics
      const totalTransactions = transactionStats.reduce((sum, stat) => sum + stat.count, 0);
      const totalAmount = transactionStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
      const successCount = transactionStats.find(s => s._id === 'success')?.count || 0;
      const successRate = totalTransactions > 0 ? (successCount / totalTransactions) * 100 : 0;
      const avgTransactionValue = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

      logger.info(`Analytics overview retrieved for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Analytics overview retrieved successfully',
        data: {
          period,
          summary: {
            totalTransactions,
            totalAmount,
            successCount,
            successRate: Math.round(successRate * 100) / 100,
            avgTransactionValue: Math.round(avgTransactionValue),
            totalFees: transactionStats.reduce((sum, stat) => sum + (stat.totalAmount * 0.025), 0) // 2.5% fee
          },
          byStatus: transactionStats,
          byPaymentMethod: paymentMethodStats,
          dailyTrends
        }
      });
    } catch (error) {
      logger.error('Get analytics overview error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analytics overview',
        message: 'An error occurred while retrieving analytics overview'
      });
    }
  }

  /**
   * Get transaction analytics
   * GET /api/v1/analytics/transactions
   */
  static async getTransactionAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { period = '30d', groupBy = 'day' }: AnalyticsRequest = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Determine date format based on groupBy
      let dateFormat = '%Y-%m-%d';
      switch (groupBy) {
        case 'hour':
          dateFormat = '%Y-%m-%d %H:00';
          break;
        case 'week':
          dateFormat = '%Y-W%U';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }

      // Get transaction analytics
      const analytics = await Transaction.aggregate([
        {
          $match: {
            merchantId: merchantId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormat, date: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            successCount: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            avgAmount: { $avg: '$amount' },
            minAmount: { $min: '$amount' },
            maxAmount: { $max: '$amount' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Calculate additional metrics
      const totalTransactions = analytics.reduce((sum, item) => sum + item.count, 0);
      const totalAmount = analytics.reduce((sum, item) => sum + item.totalAmount, 0);
      const totalSuccess = analytics.reduce((sum, item) => sum + item.successCount, 0);
      const totalFailed = analytics.reduce((sum, item) => sum + item.failedCount, 0);

      logger.info(`Transaction analytics retrieved for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Transaction analytics retrieved successfully',
        data: {
          period,
          groupBy,
          summary: {
            totalTransactions,
            totalAmount,
            totalSuccess,
            totalFailed,
            successRate: totalTransactions > 0 ? (totalSuccess / totalTransactions) * 100 : 0,
            avgTransactionValue: totalTransactions > 0 ? totalAmount / totalTransactions : 0
          },
          analytics
        }
      });
    } catch (error) {
      logger.error('Get transaction analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transaction analytics',
        message: 'An error occurred while retrieving transaction analytics'
      });
    }
  }

  /**
   * Get revenue analytics
   * GET /api/v1/analytics/revenue
   */
  static async getRevenueAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { period = '30d', groupBy = 'day' }: AnalyticsRequest = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Determine date format based on groupBy
      let dateFormat = '%Y-%m-%d';
      switch (groupBy) {
        case 'hour':
          dateFormat = '%Y-%m-%d %H:00';
          break;
        case 'week':
          dateFormat = '%Y-W%U';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        default:
          dateFormat = '%Y-%m-%d';
      }

      // Get revenue analytics
      const revenueAnalytics = await Transaction.aggregate([
        {
          $match: {
            merchantId: merchantId,
            status: 'success',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: dateFormat, date: '$createdAt' }
            },
            revenue: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            avgTransactionValue: { $avg: '$amount' },
            fees: { $sum: '$fees' },
            netRevenue: { $sum: { $subtract: ['$amount', '$fees'] } }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Calculate summary metrics
      const totalRevenue = revenueAnalytics.reduce((sum, item) => sum + item.revenue, 0);
      const totalFees = revenueAnalytics.reduce((sum, item) => sum + item.fees, 0);
      const netRevenue = revenueAnalytics.reduce((sum, item) => sum + item.netRevenue, 0);
      const totalTransactions = revenueAnalytics.reduce((sum, item) => sum + item.transactionCount, 0);

      logger.info(`Revenue analytics retrieved for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Revenue analytics retrieved successfully',
        data: {
          period,
          groupBy,
          summary: {
            totalRevenue,
            totalFees,
            netRevenue,
            totalTransactions,
            avgTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
            feePercentage: totalRevenue > 0 ? (totalFees / totalRevenue) * 100 : 0
          },
          analytics: revenueAnalytics
        }
      });
    } catch (error) {
      logger.error('Get revenue analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve revenue analytics',
        message: 'An error occurred while retrieving revenue analytics'
      });
    }
  }

  /**
   * Get payment method analytics
   * GET /api/v1/analytics/payment-methods
   */
  static async getPaymentMethodAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { period = '30d' }: AnalyticsRequest = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get payment method analytics
      const paymentMethodAnalytics = await Transaction.aggregate([
        {
          $match: {
            merchantId: merchantId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            successCount: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            avgAmount: { $avg: '$amount' }
          }
        },
        {
          $addFields: {
            successRate: {
              $cond: [
                { $gt: ['$count', 0] },
                { $multiply: [{ $divide: ['$successCount', '$count'] }, 100] },
                0
              ]
            }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Calculate summary metrics
      const totalTransactions = paymentMethodAnalytics.reduce((sum, item) => sum + item.count, 0);
      const totalAmount = paymentMethodAnalytics.reduce((sum, item) => sum + item.totalAmount, 0);

      logger.info(`Payment method analytics retrieved for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Payment method analytics retrieved successfully',
        data: {
          period,
          summary: {
            totalTransactions,
            totalAmount,
            avgTransactionValue: totalTransactions > 0 ? totalAmount / totalTransactions : 0
          },
          analytics: paymentMethodAnalytics
        }
      });
    } catch (error) {
      logger.error('Get payment method analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment method analytics',
        message: 'An error occurred while retrieving payment method analytics'
      });
    }
  }

  /**
   * Get geographic analytics
   * GET /api/v1/analytics/geographic
   */
  static async getGeographicAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { period = '30d' }: AnalyticsRequest = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get geographic analytics
      const geographicAnalytics = await Transaction.aggregate([
        {
          $match: {
            merchantId: merchantId,
            createdAt: { $gte: startDate },
            'customerAddress.country': { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$customerAddress.country',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            successCount: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            avgAmount: { $avg: '$amount' }
          }
        },
        {
          $addFields: {
            successRate: {
              $cond: [
                { $gt: ['$count', 0] },
                { $multiply: [{ $divide: ['$successCount', '$count'] }, 100] },
                0
              ]
            }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      logger.info(`Geographic analytics retrieved for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Geographic analytics retrieved successfully',
        data: {
          period,
          analytics: geographicAnalytics
        }
      });
    } catch (error) {
      logger.error('Get geographic analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve geographic analytics',
        message: 'An error occurred while retrieving geographic analytics'
      });
    }
  }
}

export default AnalyticsController; 