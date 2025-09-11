import { Request, Response } from 'express';
import { Transaction, Refund, Subscription, Merchant } from '../../models';
import SandboxFraudReview from '../../models/SandboxFraudReview';
import SandboxFraudDecision from '../../models/SandboxFraudDecision';
import { logger } from '../../utils/helpers/logger';

// Request interfaces
interface GenerateReportRequest {
  type: 'transaction' | 'revenue' | 'refund' | 'subscription' | 'comprehensive';
  format: 'json' | 'csv' | 'pdf';
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate?: string;
  endDate?: string;
  filters?: {
    status?: string[];
    paymentMethod?: string[];
    minAmount?: number;
    maxAmount?: number;
    currency?: string[];
  };
}

interface ExportReportRequest {
  reportId: string;
  format: 'json' | 'csv' | 'pdf';
}

// Response interfaces
interface ReportResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class ReportController {
  /**
   * Generate report
   * POST /api/v1/reports/generate
   */
  static async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        type,
        format,
        period,
        startDate,
        endDate,
        filters
      }: GenerateReportRequest = req.body;

      // Convert merchantId to string
      const merchantIdString = merchantId?.toString();

      if (!merchantIdString) {
        res.status(400).json({
          success: false,
          error: 'Missing merchant ID',
          message: 'Merchant ID is required'
        });
        return;
      }

      // Validate merchant
      const merchant = await Merchant.findById(merchantIdString);
      if (!merchant || !merchant.isActive) {
        res.status(400).json({
          success: false,
          error: 'Invalid merchant',
          message: 'Invalid or inactive merchant account'
        });
        return;
      }

      // Calculate date range
      const dateRange = this.calculateDateRange(period, startDate, endDate);

      // Generate report based on type
      let reportData;
      switch (type) {
        case 'transaction':
          reportData = await this.generateTransactionReport(merchantIdString, dateRange, filters);
          break;
        case 'revenue':
          reportData = await this.generateRevenueReport(merchantIdString, dateRange, filters);
          break;
        case 'refund':
          reportData = await this.generateRefundReport(merchantIdString, dateRange, filters);
          break;
        case 'subscription':
          reportData = await this.generateSubscriptionReport(merchantIdString, dateRange, filters);
          break;
        case 'comprehensive':
          reportData = await this.generateComprehensiveReport(merchantIdString, dateRange, filters);
          break;
        default:
          res.status(400).json({
            success: false,
            error: 'Invalid report type',
            message: 'Invalid report type specified'
          });
          return;
      }

      // Format report data
      const formattedReport = await this.formatReport(reportData, format);

      logger.info(`Report generated: ${type} for merchant: ${merchantIdString}`);

      res.status(200).json({
        success: true,
        message: 'Report generated successfully',
        data: {
          report: {
            id: `report_${Date.now()}`,
            type,
            format,
            period,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            generatedAt: new Date(),
            data: formattedReport
          }
        }
      });
    } catch (error) {
      logger.error('Generate report error:', error);
      res.status(500).json({
        success: false,
        error: 'Report generation failed',
        message: 'An error occurred while generating the report'
      });
    }
  }

  /**
   * Export report
   * POST /api/v1/reports/export
   */
  static async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const { reportId, format }: ExportReportRequest = req.body;

      // TODO: Retrieve report from storage/cache
      // For now, we'll return a mock response
      const reportData = {
        id: reportId,
        type: 'transaction',
        format,
        data: []
      };

      // Set appropriate headers for file download
      const filename = `report_${reportId}_${Date.now()}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      switch (format) {
        case 'csv':
          res.setHeader('Content-Type', 'text/csv');
          res.send(this.convertToCSV(reportData.data));
          break;
        case 'pdf':
          res.setHeader('Content-Type', 'application/pdf');
          // TODO: Generate PDF
          res.send('PDF generation not implemented yet');
          break;
        default:
          res.setHeader('Content-Type', 'application/json');
          res.json(reportData);
      }

      logger.info(`Report exported: ${reportId} in ${format} format`);
    } catch (error) {
      logger.error('Export report error:', error);
      res.status(500).json({
        success: false,
        error: 'Report export failed',
        message: 'An error occurred while exporting the report'
      });
    }
  }

  /**
   * Get available report types
   * GET /api/v1/reports/types
   */
  static async getReportTypes(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Report types retrieved successfully',
        data: {
          reportTypes: [
            {
              id: 'transaction',
              name: 'Transaction Report',
              description: 'Detailed transaction analysis and statistics',
              availableFormats: ['json', 'csv', 'pdf'],
              availablePeriods: ['daily', 'weekly', 'monthly', 'custom']
            },
            {
              id: 'revenue',
              name: 'Revenue Report',
              description: 'Revenue analysis and financial metrics',
              availableFormats: ['json', 'csv', 'pdf'],
              availablePeriods: ['daily', 'weekly', 'monthly', 'custom']
            },
            {
              id: 'refund',
              name: 'Refund Report',
              description: 'Refund analysis and processing statistics',
              availableFormats: ['json', 'csv', 'pdf'],
              availablePeriods: ['daily', 'weekly', 'monthly', 'custom']
            },
            {
              id: 'subscription',
              name: 'Subscription Report',
              description: 'Subscription billing and recurring payment analysis',
              availableFormats: ['json', 'csv', 'pdf'],
              availablePeriods: ['daily', 'weekly', 'monthly', 'custom']
            },
            {
              id: 'comprehensive',
              name: 'Comprehensive Report',
              description: 'Complete business overview with all metrics',
              availableFormats: ['json', 'csv', 'pdf'],
              availablePeriods: ['weekly', 'monthly', 'custom']
            }
          ]
        }
      });
    } catch (error) {
      logger.error('Get report types error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve report types',
        message: 'An error occurred while retrieving report types'
      });
    }
  }

  /**
   * Generate transaction report
   */
  private static async generateTransactionReport(merchantId: string, dateRange: any, filters: any): Promise<any> {
    const query: any = {
      merchantId,
      createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
    };

    // Apply filters
    if (filters?.status) query.status = { $in: filters.status };
    if (filters?.paymentMethod) query.paymentMethod = { $in: filters.paymentMethod };
    if (filters?.currency) query.currency = { $in: filters.currency };
    if (filters?.minAmount || filters?.maxAmount) {
      query.amount = {};
      if (filters.minAmount) query.amount.$gte = filters.minAmount;
      if (filters.maxAmount) query.amount.$lte = filters.maxAmount;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('merchantId', 'businessName');

    return {
      type: 'transaction',
      summary: {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        successCount: transactions.filter(t => t.status === 'success').length,
        failedCount: transactions.filter(t => t.status === 'failed').length,
        pendingCount: transactions.filter(t => t.status === 'pending').length
      },
      transactions: transactions.map(t => ({
        id: t._id,
        reference: t.reference,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        paymentMethod: t.paymentMethod,
        customerEmail: t.customerEmail,
        createdAt: t.createdAt,
        processedAt: t.processedAt
      }))
    };
  }

  /**
   * Generate revenue report
   */
  private static async generateRevenueReport(merchantId: string, dateRange: any, filters: any): Promise<any> {
    const query: any = {
      merchantId,
      status: 'success',
      createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
    };

    // Apply filters
    if (filters?.paymentMethod) query.paymentMethod = { $in: filters.paymentMethod };
    if (filters?.currency) query.currency = { $in: filters.currency };

    const transactions = await Transaction.find(query).sort({ createdAt: -1 });

    const revenueByDay = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          fees: { $sum: '$fees' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      type: 'revenue',
      summary: {
        totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
        totalFees: transactions.reduce((sum, t) => sum + t.fees, 0),
        netRevenue: transactions.reduce((sum, t) => sum + (t.amount - t.fees), 0),
        transactionCount: transactions.length,
        avgTransactionValue: transactions.length > 0 ? 
          transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0
      },
      revenueByDay
    };
  }

  /**
   * Generate refund report
   */
  private static async generateRefundReport(merchantId: string, dateRange: any, filters: any): Promise<any> {
    const query: any = {
      merchantId,
      createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
    };

    // Apply filters
    if (filters?.status) query.status = { $in: filters.status };

    const refunds = await Refund.find(query)
      .populate('transactionId', 'reference amount currency')
      .sort({ createdAt: -1 });

    return {
      type: 'refund',
      summary: {
        totalRefunds: refunds.length,
        totalAmount: refunds.reduce((sum, r) => sum + r.amount, 0),
        completedCount: refunds.filter(r => r.status === 'completed').length,
        pendingCount: refunds.filter(r => r.status === 'pending').length,
        failedCount: refunds.filter(r => r.status === 'failed').length
      },
      refunds: refunds.map(r => ({
        id: r._id,
        reference: r.reference,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        reason: r.reason,
        createdAt: r.createdAt,
        processedAt: r.processedAt,
        transaction: r.transactionId ? {
          reference: (r.transactionId as any).reference,
          amount: (r.transactionId as any).amount,
          currency: (r.transactionId as any).currency
        } : null
      }))
    };
  }

  /**
   * Generate subscription report
   */
  private static async generateSubscriptionReport(merchantId: string, dateRange: any, filters: any): Promise<any> {
    const query: any = {
      merchantId,
      createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
    };

    // Apply filters
    if (filters?.status) query.status = { $in: filters.status };

    const subscriptions = await Subscription.find(query)
      .populate('customerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return {
      type: 'subscription',
      summary: {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
        cancelledSubscriptions: subscriptions.filter(s => s.status === 'cancelled').length,
        totalRevenue: subscriptions.reduce((sum, s) => sum + s.amount, 0),
        avgSubscriptionValue: subscriptions.length > 0 ? 
          subscriptions.reduce((sum, s) => sum + s.amount, 0) / subscriptions.length : 0
      },
      subscriptions: subscriptions.map(s => ({
        id: s._id,
        planName: s.planName,
        amount: s.amount,
        currency: s.currency,
        status: s.status,
        interval: s.interval,
        billingCyclesCompleted: s.billingCyclesCompleted,
        createdAt: s.createdAt,
        customer: s.customerId ? {
          name: `${(s.customerId as any).firstName} ${(s.customerId as any).lastName}`,
          email: (s.customerId as any).email
        } : null
      }))
    };
  }

  /**
   * Generate comprehensive report
   */
  private static async generateComprehensiveReport(merchantId: string, dateRange: any, filters: any): Promise<any> {
    const [transactionReport, revenueReport, refundReport, subscriptionReport] = await Promise.all([
      this.generateTransactionReport(merchantId, dateRange, filters),
      this.generateRevenueReport(merchantId, dateRange, filters),
      this.generateRefundReport(merchantId, dateRange, filters),
      this.generateSubscriptionReport(merchantId, dateRange, filters)
    ]);

    return {
      type: 'comprehensive',
      period: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      },
      sections: {
        transactions: transactionReport,
        revenue: revenueReport,
        refunds: refundReport,
        subscriptions: subscriptionReport
      }
    };
  }

  /**
   * Calculate date range based on period
   */
  private static calculateDateRange(period: string, startDate?: string, endDate?: string): any {
    const now = new Date();
    let start, end;

    if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'daily':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'weekly':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = now;
          break;
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          end = now;
      }
    }

    return { startDate: start, endDate: end };
  }

  /**
   * Format report data
   */
  private static async formatReport(data: any, format: string): Promise<any> {
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'pdf':
        // TODO: Implement PDF generation
        return data;
      default:
        return data;
    }
  }

  /**
   * Convert data to CSV format
   */
  private static convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use a proper CSV library
    if (!data || typeof data !== 'object') return '';

    const rows = [];
    const headers = Object.keys(data);
    rows.push(headers.join(','));
    
    if (Array.isArray(data)) {
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        rows.push(values.join(','));
      });
    }

    return rows.join('\n');
  }
}

export default ReportController; 

// --- Minimal Fraud Review Handlers ---
export const listFraudReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?._id?.toString?.() || (req.user as any)?.id || (req.query.userId as string) || (req.headers['x-owner-id'] as string);
    const status = (req.query.status as string) || 'pending';
    if (!userId) {
      res.status(400).json({ success: false, error: 'Missing userId' });
      return;
    }
    const reviews = await SandboxFraudReview.find({ userId, status }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { reviews } });
  } catch (error) {
    logger.error('listFraudReviews error:', error);
    res.status(500).json({ success: false, error: 'Failed to list reviews' });
  }
};

export const approveFraudReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const reviewerId = (req.user as any)?._id?.toString?.() || (req.user as any)?.id || 'system';
    const review = await SandboxFraudReview.findByIdAndUpdate(
      id,
      { status: 'approved', reviewerId },
      { new: true }
    );
    if (!review) {
      res.status(404).json({ success: false, error: 'Review not found' });
      return;
    }
    res.status(200).json({ success: true, data: { review } });
  } catch (error) {
    logger.error('approveFraudReview error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve review' });
  }
};

export const denyFraudReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const reviewerId = (req.user as any)?._id?.toString?.() || (req.user as any)?.id || 'system';
    const review = await SandboxFraudReview.findByIdAndUpdate(
      id,
      { status: 'denied', reviewerId },
      { new: true }
    );
    if (!review) {
      res.status(404).json({ success: false, error: 'Review not found' });
      return;
    }
    res.status(200).json({ success: true, data: { review } });
  } catch (error) {
    logger.error('denyFraudReview error:', error);
    res.status(500).json({ success: false, error: 'Failed to deny review' });
  }
};

// --- Fraud risk summaries (sandbox/read-only) ---
export const getFraudSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id || (req.query.userId as string);
    if (!userId) {
      res.status(400).json({ success: false, error: 'Missing userId' });
      return;
    }
    const since = req.query.since ? new Date(String(req.query.since)) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const match = { userId, createdAt: { $gte: since } } as any;
    const totals = await SandboxFraudDecision.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        avgScore: { $avg: '$riskScore' },
        highCount: { $sum: { $cond: [{ $gte: ['$riskScore', 60] }, 1, 0] } },
        blocked: { $sum: { $cond: [{ $eq: ['$action', 'block'] }, 1, 0] } },
        reviewed: { $sum: { $cond: [{ $eq: ['$action', 'review'] }, 1, 0] } },
        flagged: { $sum: { $cond: [{ $eq: ['$action', 'flag'] }, 1, 0] } }
      } }
    ]);
    const topFactors = await SandboxFraudDecision.aggregate([
      { $match: match },
      { $unwind: '$factors' },
      { $group: { _id: '$factors', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.status(200).json({ success: true, data: { totals: totals[0] || null, topFactors } });
  } catch (error) {
    logger.error('getFraudSummary error:', error);
    res.status(500).json({ success: false, error: 'Failed to get fraud summary' });
  }
};

export const getRecentFraudDecisions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any)?.id || (req.query.userId as string);
    if (!userId) {
      res.status(400).json({ success: false, error: 'Missing userId' });
      return;
    }
    const limit = Math.min(parseInt(String(req.query.limit || '50')), 200);
    const decisions = await SandboxFraudDecision.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    res.status(200).json({ success: true, data: { decisions } });
  } catch (error) {
    logger.error('getRecentFraudDecisions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get fraud decisions' });
  }
};