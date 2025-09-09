import { Types } from 'mongoose';
import Transaction from '../../models/Transaction';
import Refund from '../../models/Refund';
import Subscription from '../../models/Subscription';
import Merchant from '../../models/Merchant';
import { logger } from '../../utils/helpers/logger';

export interface AnalyticsResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export interface TransactionMetrics {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  successRate: number;
  averageTransactionValue: number;
  totalFees: number;
  netRevenue: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  revenueGrowth: number;
  averageOrderValue: number;
  revenueByCurrency: Record<string, number>;
  revenueByPaymentMethod: Record<string, number>;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  customerRetentionRate: number;
  averageCustomerValue: number;
  topCustomers: Array<{
    customerEmail: string;
    totalSpent: number;
    transactionCount: number;
  }>;
}

export interface PaymentMethodMetrics {
  totalByMethod: Record<string, number>;
  amountByMethod: Record<string, number>;
  successRateByMethod: Record<string, number>;
  averageValueByMethod: Record<string, number>;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  count?: number;
}

/**
 * Analytics Service
 * Handles data analysis and metrics calculation
 */
export class AnalyticsService {
  /**
   * Get transaction metrics for merchant
   */
  static async getTransactionMetrics(
    merchantId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsResult> {
    try {
      const matchStage: any = { merchantId };

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            successfulTransactions: {
              $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] }
            },
            failedTransactions: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            pendingTransactions: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            totalFees: { $sum: '$fee' },
            averageTransactionValue: { $avg: '$amount' }
          }
        }
      ];

      const result = await Transaction.aggregate(pipeline);
      const metrics = result[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
        totalFees: 0,
        averageTransactionValue: 0
      };

      const successRate = metrics.totalTransactions > 0 
        ? (metrics.successfulTransactions / metrics.totalTransactions) * 100 
        : 0;

      const transactionMetrics: TransactionMetrics = {
        totalTransactions: metrics.totalTransactions,
        totalAmount: metrics.totalAmount,
        successfulTransactions: metrics.successfulTransactions,
        failedTransactions: metrics.failedTransactions,
        pendingTransactions: metrics.pendingTransactions,
        successRate: Math.round(successRate * 100) / 100,
        averageTransactionValue: Math.round(metrics.averageTransactionValue * 100) / 100,
        totalFees: metrics.totalFees,
        netRevenue: metrics.totalAmount - metrics.totalFees
      };

      logger.debug('Transaction metrics calculated', {
        merchantId,
        metrics: transactionMetrics
      });

      return {
        success: true,
        data: transactionMetrics,
        message: 'Transaction metrics retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get transaction metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to get transaction metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get revenue metrics for merchant
   */
  static async getRevenueMetrics(
    merchantId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsResult> {
    try {
      const matchStage: any = { 
        merchantId,
        status: { $in: ['successful', 'completed'] }
      };

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      // Get total revenue
      const totalRevenueResult = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            averageOrderValue: { $avg: '$amount' }
          }
        }
      ]);

      // Get revenue by currency
      const revenueByCurrencyResult = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$currency',
            revenue: { $sum: '$amount' }
          }
        }
      ]);

      // Get revenue by payment method
      const revenueByPaymentMethodResult = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentMethod',
            revenue: { $sum: '$amount' }
          }
        }
      ]);

      // Calculate time-based revenue
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [monthlyRevenue, weeklyRevenue, dailyRevenue] = await Promise.all([
        Transaction.aggregate([
          { $match: { ...matchStage, createdAt: { $gte: oneMonthAgo } } },
          { $group: { _id: null, revenue: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { ...matchStage, createdAt: { $gte: oneWeekAgo } } },
          { $group: { _id: null, revenue: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { ...matchStage, createdAt: { $gte: oneDayAgo } } },
          { $group: { _id: null, revenue: { $sum: '$amount' } } }
        ])
      ]);

      const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
      const averageOrderValue = totalRevenueResult[0]?.averageOrderValue || 0;
      const monthlyRev = monthlyRevenue[0]?.revenue || 0;
      const weeklyRev = weeklyRevenue[0]?.revenue || 0;
      const dailyRev = dailyRevenue[0]?.revenue || 0;

      // Calculate revenue growth (month over month)
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
      const previousMonthRevenue = await Transaction.aggregate([
        { $match: { ...matchStage, createdAt: { $gte: twoMonthsAgo, $lt: oneMonthAgo } } },
        { $group: { _id: null, revenue: { $sum: '$amount' } } }
      ]);

      const prevMonthRev = previousMonthRevenue[0]?.revenue || 0;
      const revenueGrowth = prevMonthRev > 0 
        ? ((monthlyRev - prevMonthRev) / prevMonthRev) * 100 
        : 0;

      // Convert arrays to objects
      const revenueByCurrency: Record<string, number> = {};
      revenueByCurrencyResult.forEach(item => {
        revenueByCurrency[item._id] = item.revenue;
      });

      const revenueByPaymentMethod: Record<string, number> = {};
      revenueByPaymentMethodResult.forEach(item => {
        revenueByPaymentMethod[item._id] = item.revenue;
      });

      const revenueMetrics: RevenueMetrics = {
        totalRevenue,
        monthlyRevenue: monthlyRev,
        weeklyRevenue: weeklyRev,
        dailyRevenue: dailyRev,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        revenueByCurrency,
        revenueByPaymentMethod
      };

      logger.debug('Revenue metrics calculated', {
        merchantId,
        metrics: revenueMetrics
      });

      return {
        success: true,
        data: revenueMetrics,
        message: 'Revenue metrics retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get revenue metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to get revenue metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get customer metrics for merchant
   */
  static async getCustomerMetrics(
    merchantId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsResult> {
    try {
      const matchStage: any = { merchantId };

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      // Get unique customers
      const uniqueCustomers = await Transaction.distinct('customerEmail', matchStage);
      const totalCustomers = uniqueCustomers.length;

      // Get new customers (first transaction in date range)
      const newCustomersResult = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$customerEmail',
            firstTransaction: { $min: '$createdAt' }
          }
        },
        {
          $match: {
            firstTransaction: {
              $gte: startDate || new Date(0),
              $lte: endDate || new Date()
            }
          }
        }
      ]);

      const newCustomers = newCustomersResult.length;

      // Get repeat customers
      const repeatCustomersResult = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$customerEmail',
            transactionCount: { $sum: 1 },
            totalSpent: { $sum: '$amount' }
          }
        },
        {
          $match: {
            transactionCount: { $gt: 1 }
          }
        }
      ]);

      const repeatCustomers = repeatCustomersResult.length;

      // Get top customers
      const topCustomersResult = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$customerEmail',
            totalSpent: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        {
          $sort: { totalSpent: -1 }
        },
        {
          $limit: 10
        }
      ]);

      const topCustomers = topCustomersResult.map(customer => ({
        customerEmail: customer._id,
        totalSpent: customer.totalSpent,
        transactionCount: customer.transactionCount
      }));

      // Calculate average customer value
      const totalRevenueResult = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' }
          }
        }
      ]);

      const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
      const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      // Calculate retention rate
      const customerRetentionRate = totalCustomers > 0 
        ? (repeatCustomers / totalCustomers) * 100 
        : 0;

      const customerMetrics: CustomerMetrics = {
        totalCustomers,
        newCustomers,
        repeatCustomers,
        customerRetentionRate: Math.round(customerRetentionRate * 100) / 100,
        averageCustomerValue: Math.round(averageCustomerValue * 100) / 100,
        topCustomers
      };

      logger.debug('Customer metrics calculated', {
        merchantId,
        metrics: customerMetrics
      });

      return {
        success: true,
        data: customerMetrics,
        message: 'Customer metrics retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get customer metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to get customer metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get payment method metrics for merchant
   */
  static async getPaymentMethodMetrics(
    merchantId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsResult> {
    try {
      const matchStage: any = { merchantId };

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      const paymentMethodMetrics = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentMethod',
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            successfulTransactions: {
              $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] }
            },
            averageValue: { $avg: '$amount' }
          }
        }
      ]);

      const totalByMethod: Record<string, number> = {};
      const amountByMethod: Record<string, number> = {};
      const successRateByMethod: Record<string, number> = {};
      const averageValueByMethod: Record<string, number> = {};

      paymentMethodMetrics.forEach(method => {
        const methodName = method._id;
        totalByMethod[methodName] = method.totalTransactions;
        amountByMethod[methodName] = method.totalAmount;
        successRateByMethod[methodName] = method.totalTransactions > 0 
          ? (method.successfulTransactions / method.totalTransactions) * 100 
          : 0;
        averageValueByMethod[methodName] = method.averageValue;
      });

      const paymentMethodMetricsData: PaymentMethodMetrics = {
        totalByMethod,
        amountByMethod,
        successRateByMethod,
        averageValueByMethod
      };

      logger.debug('Payment method metrics calculated', {
        merchantId,
        metrics: paymentMethodMetricsData
      });

      return {
        success: true,
        data: paymentMethodMetricsData,
        message: 'Payment method metrics retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get payment method metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to get payment method metrics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get time series data for transactions
   */
  static async getTransactionTimeSeries(
    merchantId: Types.ObjectId,
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsResult> {
    try {
      const matchStage: any = { merchantId };

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      let dateFormat: string;
      let dateField: string;

      switch (period) {
        case 'daily':
          dateFormat = '%Y-%m-%d';
          dateField = '$day';
          break;
        case 'weekly':
          dateFormat = '%Y-%U';
          dateField = '$week';
          break;
        case 'monthly':
          dateFormat = '%Y-%m';
          dateField = '$month';
          break;
        default:
          dateFormat = '%Y-%m-%d';
          dateField = '$day';
      }

      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            week: { $dateToString: { format: '%Y-%U', date: '$createdAt' } },
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
          }
        },
        {
          $group: {
            _id: dateField,
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            successfulTransactions: {
              $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] }
            }
          }
        },
        {
          $sort: { _id: 1 as 1 }
        }
      ];

      const result = await Transaction.aggregate(pipeline);

      const timeSeriesData: TimeSeriesData[] = result.map(item => ({
        date: item._id,
        value: item.totalAmount,
        count: item.transactionCount
      }));

      logger.debug('Transaction time series data calculated', {
        merchantId,
        period,
        dataPoints: timeSeriesData.length
      });

      return {
        success: true,
        data: timeSeriesData,
        message: 'Time series data retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get transaction time series', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to get time series data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  static async getDashboardAnalytics(
    merchantId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsResult> {
    try {
      const [
        transactionMetrics,
        revenueMetrics,
        customerMetrics,
        paymentMethodMetrics
      ] = await Promise.all([
        this.getTransactionMetrics(merchantId, startDate, endDate),
        this.getRevenueMetrics(merchantId, startDate, endDate),
        this.getCustomerMetrics(merchantId, startDate, endDate),
        this.getPaymentMethodMetrics(merchantId, startDate, endDate)
      ]);

      const dashboardData = {
        transactionMetrics: transactionMetrics.data,
        revenueMetrics: revenueMetrics.data,
        customerMetrics: customerMetrics.data,
        paymentMethodMetrics: paymentMethodMetrics.data
      };

      logger.info('Dashboard analytics calculated', {
        merchantId
      });

      return {
        success: true,
        data: dashboardData,
        message: 'Dashboard analytics retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get dashboard analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to get dashboard analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default AnalyticsService; 