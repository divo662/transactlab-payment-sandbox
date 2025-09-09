import { Types } from 'mongoose';
import Transaction from '../../models/Transaction';
import Refund from '../../models/Refund';
import Subscription from '../../models/Subscription';
import Merchant from '../../models/Merchant';
import { logger } from '../../utils/helpers/logger';

export interface ReportOptions {
  format: 'csv' | 'json' | 'pdf' | 'xlsx';
  startDate?: Date;
  endDate?: Date;
  merchantId?: Types.ObjectId;
  includeDetails?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'payment_method' | 'status';
}

export interface ReportResult {
  success: boolean;
  data?: any;
  downloadUrl?: string;
  message?: string;
  error?: string;
}

export interface TransactionReport {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  averageTransactionValue: number;
  totalFees: number;
  netRevenue: number;
  transactionsByStatus: Record<string, number>;
  transactionsByPaymentMethod: Record<string, number>;
  transactionsByCurrency: Record<string, number>;
  dailyTransactions: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

export interface RefundReport {
  totalRefunds: number;
  totalRefundAmount: number;
  averageRefundAmount: number;
  refundsByStatus: Record<string, number>;
  refundsByReason: Record<string, number>;
  dailyRefunds: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

export interface RevenueReport {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  revenueGrowth: number;
  revenueByCurrency: Record<string, number>;
  revenueByPaymentMethod: Record<string, number>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    transactions: number;
  }>;
}

/**
 * Report Service
 * Handles report generation and export functionality
 */
export class ReportService {
  /**
   * Generate transaction report
   */
  static async generateTransactionReport(
    merchantId: Types.ObjectId,
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      const { startDate, endDate, groupBy = 'day' } = options;

      const matchStage: any = { merchantId };

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      // Get basic transaction statistics
      const basicStats = await Transaction.aggregate([
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
            totalFees: { $sum: '$fee' },
            averageTransactionValue: { $avg: '$amount' }
          }
        }
      ]);

      const stats = basicStats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        totalFees: 0,
        averageTransactionValue: 0
      };

      // Get transactions by status
      const transactionsByStatus = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get transactions by payment method
      const transactionsByPaymentMethod = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get transactions by currency
      const transactionsByCurrency = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$currency',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get daily transactions
      const dailyTransactions = await Transaction.aggregate([
        { $match: matchStage },
        {
          $addFields: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          }
        },
        {
          $group: {
            _id: '$date',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Convert arrays to objects
      const statusMap: Record<string, number> = {};
      transactionsByStatus.forEach(item => {
        statusMap[item._id] = item.count;
      });

      const paymentMethodMap: Record<string, number> = {};
      transactionsByPaymentMethod.forEach(item => {
        paymentMethodMap[item._id] = item.count;
      });

      const currencyMap: Record<string, number> = {};
      transactionsByCurrency.forEach(item => {
        currencyMap[item._id] = item.count;
      });

      const successRate = stats.totalTransactions > 0 
        ? (stats.successfulTransactions / stats.totalTransactions) * 100 
        : 0;

      const transactionReport: TransactionReport = {
        totalTransactions: stats.totalTransactions,
        totalAmount: stats.totalAmount,
        successfulTransactions: stats.successfulTransactions,
        failedTransactions: stats.failedTransactions,
        successRate: Math.round(successRate * 100) / 100,
        averageTransactionValue: Math.round(stats.averageTransactionValue * 100) / 100,
        totalFees: stats.totalFees,
        netRevenue: stats.totalAmount - stats.totalFees,
        transactionsByStatus: statusMap,
        transactionsByPaymentMethod: paymentMethodMap,
        transactionsByCurrency: currencyMap,
        dailyTransactions: dailyTransactions.map(item => ({
          date: item._id,
          count: item.count,
          amount: item.amount
        }))
      };

      logger.info('Transaction report generated successfully', {
        merchantId,
        reportType: 'transaction',
        format: options.format
      });

      return {
        success: true,
        data: transactionReport,
        message: 'Transaction report generated successfully'
      };

    } catch (error) {
      logger.error('Failed to generate transaction report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to generate transaction report',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate refund report
   */
  static async generateRefundReport(
    merchantId: Types.ObjectId,
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      const { startDate, endDate } = options;

      const matchStage: any = { merchantId };

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = startDate;
        if (endDate) matchStage.createdAt.$lte = endDate;
      }

      // Get basic refund statistics
      const basicStats = await Refund.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRefunds: { $sum: 1 },
            totalRefundAmount: { $sum: '$amount' },
            averageRefundAmount: { $avg: '$amount' }
          }
        }
      ]);

      const stats = basicStats[0] || {
        totalRefunds: 0,
        totalRefundAmount: 0,
        averageRefundAmount: 0
      };

      // Get refunds by status
      const refundsByStatus = await Refund.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get refunds by reason
      const refundsByReason = await Refund.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$reason',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get daily refunds
      const dailyRefunds = await Refund.aggregate([
        { $match: matchStage },
        {
          $addFields: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          }
        },
        {
          $group: {
            _id: '$date',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Convert arrays to objects
      const statusMap: Record<string, number> = {};
      refundsByStatus.forEach(item => {
        statusMap[item._id] = item.count;
      });

      const reasonMap: Record<string, number> = {};
      refundsByReason.forEach(item => {
        reasonMap[item._id] = item.count;
      });

      const refundReport: RefundReport = {
        totalRefunds: stats.totalRefunds,
        totalRefundAmount: stats.totalRefundAmount,
        averageRefundAmount: Math.round(stats.averageRefundAmount * 100) / 100,
        refundsByStatus: statusMap,
        refundsByReason: reasonMap,
        dailyRefunds: dailyRefunds.map(item => ({
          date: item._id,
          count: item.count,
          amount: item.amount
        }))
      };

      logger.info('Refund report generated successfully', {
        merchantId,
        reportType: 'refund',
        format: options.format
      });

      return {
        success: true,
        data: refundReport,
        message: 'Refund report generated successfully'
      };

    } catch (error) {
      logger.error('Failed to generate refund report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to generate refund report',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate revenue report
   */
  static async generateRevenueReport(
    merchantId: Types.ObjectId,
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      const { startDate, endDate } = options;

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
            totalRevenue: { $sum: '$amount' }
          }
        }
      ]);

      const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

      // Get revenue by currency
      const revenueByCurrency = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$currency',
            revenue: { $sum: '$amount' }
          }
        }
      ]);

      // Get revenue by payment method
      const revenueByPaymentMethod = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentMethod',
            revenue: { $sum: '$amount' }
          }
        }
      ]);

      // Get monthly revenue
      const monthlyRevenue = await Transaction.aggregate([
        { $match: matchStage },
        {
          $addFields: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
          }
        },
        {
          $group: {
            _id: '$month',
            revenue: { $sum: '$amount' },
            transactions: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Calculate time-based revenue
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [monthlyRev, weeklyRev, dailyRev] = await Promise.all([
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

      const monthlyRevAmount = monthlyRev[0]?.revenue || 0;
      const weeklyRevAmount = weeklyRev[0]?.revenue || 0;
      const dailyRevAmount = dailyRev[0]?.revenue || 0;

      // Calculate revenue growth
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
      const previousMonthRevenue = await Transaction.aggregate([
        { $match: { ...matchStage, createdAt: { $gte: twoMonthsAgo, $lt: oneMonthAgo } } },
        { $group: { _id: null, revenue: { $sum: '$amount' } } }
      ]);

      const prevMonthRev = previousMonthRevenue[0]?.revenue || 0;
      const revenueGrowth = prevMonthRev > 0 
        ? ((monthlyRevAmount - prevMonthRev) / prevMonthRev) * 100 
        : 0;

      // Convert arrays to objects
      const currencyMap: Record<string, number> = {};
      revenueByCurrency.forEach(item => {
        currencyMap[item._id] = item.revenue;
      });

      const paymentMethodMap: Record<string, number> = {};
      revenueByPaymentMethod.forEach(item => {
        paymentMethodMap[item._id] = item.revenue;
      });

      const revenueReport: RevenueReport = {
        totalRevenue,
        monthlyRevenue: monthlyRevAmount,
        weeklyRevenue: weeklyRevAmount,
        dailyRevenue: dailyRevAmount,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        revenueByCurrency: currencyMap,
        revenueByPaymentMethod: paymentMethodMap,
        revenueByMonth: monthlyRevenue.map(item => ({
          month: item._id,
          revenue: item.revenue,
          transactions: item.transactions
        }))
      };

      logger.info('Revenue report generated successfully', {
        merchantId,
        reportType: 'revenue',
        format: options.format
      });

      return {
        success: true,
        data: revenueReport,
        message: 'Revenue report generated successfully'
      };

    } catch (error) {
      logger.error('Failed to generate revenue report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to generate revenue report',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Export report to file
   */
  static async exportReport(
    reportData: any,
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      const { format } = options;

      // In a real implementation, this would generate actual files
      // For now, we'll simulate file generation
      
      let fileContent: string;
      let fileName: string;
      let mimeType: string;

      switch (format) {
        case 'csv':
          fileContent = this.convertToCSV(reportData);
          fileName = `report_${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;

        case 'json':
          fileContent = JSON.stringify(reportData, null, 2);
          fileName = `report_${Date.now()}.json`;
          mimeType = 'application/json';
          break;

        case 'pdf':
          // Simulate PDF generation
          fileContent = 'PDF content would be generated here';
          fileName = `report_${Date.now()}.pdf`;
          mimeType = 'application/pdf';
          break;

        case 'xlsx':
          // Simulate Excel generation
          fileContent = 'Excel content would be generated here';
          fileName = `report_${Date.now()}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Simulate file upload to cloud storage
      const downloadUrl = `https://storage.transactlab.com/reports/${fileName}`;

      logger.info('Report exported successfully', {
        format,
        fileName,
        downloadUrl
      });

      return {
        success: true,
        downloadUrl,
        message: 'Report exported successfully'
      };

    } catch (error) {
      logger.error('Failed to export report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        format: options.format
      });

      return {
        success: false,
        message: 'Failed to export report',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert data to CSV format
   */
  static convertToCSV(data: any): string {
    try {
      if (Array.isArray(data)) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        for (const row of data) {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
          });
          csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
      } else {
        // For single objects, convert to array format
        const rows = [];
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'object' && value !== null) {
            rows.push([key, JSON.stringify(value)]);
          } else {
            rows.push([key, value]);
          }
        }
        
        return rows.map(row => row.join(',')).join('\n');
      }
    } catch (error) {
      logger.error('Failed to convert to CSV', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return '';
    }
  }

  /**
   * Generate comprehensive report
   */
  static async generateComprehensiveReport(
    merchantId: Types.ObjectId,
    options: ReportOptions
  ): Promise<ReportResult> {
    try {
      const [transactionReport, refundReport, revenueReport] = await Promise.all([
        this.generateTransactionReport(merchantId, options),
        this.generateRefundReport(merchantId, options),
        this.generateRevenueReport(merchantId, options)
      ]);

      const comprehensiveReport = {
        generatedAt: new Date().toISOString(),
        merchantId: merchantId.toString(),
        transactionReport: transactionReport.data,
        refundReport: refundReport.data,
        revenueReport: revenueReport.data
      };

      logger.info('Comprehensive report generated successfully', {
        merchantId,
        reportType: 'comprehensive',
        format: options.format
      });

      return {
        success: true,
        data: comprehensiveReport,
        message: 'Comprehensive report generated successfully'
      };

    } catch (error) {
      logger.error('Failed to generate comprehensive report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to generate comprehensive report',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default ReportService; 