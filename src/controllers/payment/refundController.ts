import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { logger } from '../../utils/helpers/logger';
import { redisClient } from '../../config/redis';
import Transaction from '../../models/Transaction';
import Refund from '../../models/Refund';
import Merchant from '../../models/Merchant';
import '../../utils/types/express'; // Import express type extensions

// Request interfaces
interface CreateRefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
  refundMethod?: 'original_payment_method' | 'bank_transfer' | 'wallet';
  metadata?: Record<string, any>;
}

interface ListRefundsRequest {
  page?: number;
  perPage?: number;
  status?: string;
  transactionId?: string;
  start_date?: string;
  end_date?: string;
}

interface UpdateRefundRequest {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
}

// Response interfaces
interface RefundResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class RefundController {
  /**
   * Create a new refund
   * POST /api/v1/refunds
   */
  static async createRefund(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        transactionId,
        amount,
        reason,
        refundMethod = 'original_payment_method',
        metadata
      }: CreateRefundRequest = req.body;

      // Validate merchant
      const merchant = await Merchant.findById(merchantId);
      if (!merchant || !merchant.isActive) {
        res.status(400).json({
          success: false,
          error: 'Invalid merchant',
          message: 'Invalid or inactive merchant account'
        });
        return;
      }

      // Get transaction
      const transaction = await Transaction.findOne({
        _id: transactionId,
        merchantId
      });

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: 'Transaction not found',
          message: 'Transaction not found'
        });
        return;
      }

      // Check if transaction is refundable
      if (!(transaction as any).isRefundable) {
        res.status(400).json({
          success: false,
          error: 'Transaction not refundable',
          message: 'Transaction is not eligible for refund'
        });
        return;
      }

      // Check refund amount
      if (amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid refund amount',
          message: 'Refund amount must be greater than 0'
        });
        return;
      }

      if (amount > (transaction as any).remainingAmount) {
        res.status(400).json({
          success: false,
          error: 'Refund amount too high',
          message: `Refund amount cannot exceed ${(transaction as any).remainingAmount}`
        });
        return;
      }

      // Check if refund already exists for this amount
      const existingRefund = await Refund.findOne({
        transactionId,
        amount,
        status: { $in: ['pending', 'processing', 'completed'] }
      });

      if (existingRefund) {
        res.status(400).json({
          success: false,
          error: 'Refund already exists',
          message: 'A refund for this amount already exists'
        });
        return;
      }

      // Create refund
      const refund = new Refund({
        transactionId,
        merchantId,
        amount,
        currency: transaction.currency,
        reason,
        type: amount === transaction.amount ? 'full' : 'partial',
        refundMethod,
        metadata,
        initiatedBy: {
          userId: req.user?._id || new Types.ObjectId(),
          userType: req.user?.role || 'user',
          ipAddress: req.ip
        }
      });

      await refund.save();

      logger.info(`Refund created: ${refund.reference} for transaction: ${transactionId}`);

      res.status(201).json({
        success: true,
        message: 'Refund created successfully',
        data: {
          refund: {
            id: refund._id,
            reference: refund.reference,
            amount: refund.amount,
            currency: refund.currency,
            reason: refund.reason,
            status: refund.status,
            type: refund.type,
            refundMethod: refund.refundMethod,
            createdAt: refund.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Create refund error:', error);
      res.status(500).json({
        success: false,
        error: 'Refund creation failed',
        message: 'An error occurred while creating the refund'
      });
    }
  }

  /**
   * Get refund by reference
   * GET /api/v1/refunds/:reference
   */
  static async getRefund(req: Request, res: Response): Promise<void> {
    try {
      const { reference } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const refund = await Refund.findOne({
        reference: reference.toUpperCase(),
        merchantId
      }).populate('transactionId');

      if (!refund) {
        res.status(404).json({
          success: false,
          error: 'Refund not found',
          message: 'Refund not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Refund retrieved successfully',
        data: {
          refund: {
            id: refund._id,
            reference: refund.reference,
            amount: refund.amount,
            currency: refund.currency,
            reason: refund.reason,
            status: refund.status,
            type: refund.type,
            refundMethod: refund.refundMethod,
            processedAt: refund.processedAt,
            createdAt: refund.createdAt,
            failureReason: refund.failureReason,
            gatewayResponse: refund.gatewayResponse,
            metadata: refund.metadata,
            transaction: refund.transactionId ? {
              id: (refund.transactionId as any)._id,
              reference: (refund.transactionId as any).reference,
              amount: (refund.transactionId as any).amount,
              status: (refund.transactionId as any).status
            } : null
          }
        }
      });
    } catch (error) {
      logger.error('Get refund error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve refund',
        message: 'An error occurred while retrieving the refund'
      });
    }
  }

  /**
   * List refunds
   * GET /api/v1/refunds
   */
  static async listRefunds(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        page = 1,
        perPage = 20,
        status,
        transactionId,
        start_date,
        end_date
      }: ListRefundsRequest = req.query;

      // Build query
      const query: any = { merchantId };
      
      if (status) query.status = status;
      if (transactionId) query.transactionId = transactionId;
      
      if (start_date || end_date) {
        query.createdAt = {};
        if (start_date) query.createdAt.$gte = new Date(start_date as string);
        if (end_date) query.createdAt.$lte = new Date(end_date as string);
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(perPage);
      const limit = Number(perPage);

      // Get refunds
      const refunds = await Refund.find(query)
        .populate('transactionId', 'reference amount status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const total = await Refund.countDocuments(query);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.info(`Refunds listed for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Refunds retrieved successfully',
        data: {
          refunds: refunds.map(r => ({
            id: r._id,
            reference: r.reference,
            amount: r.amount,
            currency: r.currency,
            reason: r.reason,
            status: r.status,
            type: r.type,
            refundMethod: r.refundMethod,
            processedAt: r.processedAt,
            createdAt: r.createdAt,
            transaction: r.transactionId ? {
              id: (r.transactionId as any)._id,
              reference: (r.transactionId as any).reference,
              amount: (r.transactionId as any).amount,
              status: (r.transactionId as any).status
            } : null
          })),
          pagination: {
            page: Number(page),
            perPage: Number(perPage),
            total,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        }
      });
    } catch (error) {
      logger.error('List refunds error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve refunds',
        message: 'An error occurred while retrieving refunds'
      });
    }
  }

  /**
   * Update refund status
   * PUT /api/v1/refunds/:id
   */
  static async updateRefund(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { status, notes }: UpdateRefundRequest = req.body;

      const refund = await Refund.findOne({
        _id: id,
        merchantId
      });

      if (!refund) {
        res.status(404).json({
          success: false,
          error: 'Refund not found',
          message: 'Refund not found'
        });
        return;
      }

      // Update status if provided
      if (status && status !== refund.status) {
        refund.status = status;
        
        if (status === 'completed') {
          refund.processedAt = new Date();
          
          // Update transaction refund amount
          const transaction = await Transaction.findById(refund.transactionId);
          if (transaction) {
            await (transaction as any).addRefund(refund.amount);
          }
        }
      }

      // Update approval info if status is being changed to completed
      if (status === 'completed' && !refund.approvalInfo) {
        refund.approvalInfo = {
          approvedBy: req.user?._id || new Types.ObjectId(),
          approvedAt: new Date(),
          notes
        };
      }

      await refund.save();

      logger.info(`Refund updated: ${refund.reference} - Status: ${refund.status}`);

      res.status(200).json({
        success: true,
        message: 'Refund updated successfully',
        data: {
          refund: {
            id: refund._id,
            reference: refund.reference,
            status: refund.status,
            processedAt: refund.processedAt,
            approvalInfo: refund.approvalInfo
          }
        }
      });
    } catch (error) {
      logger.error('Update refund error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update refund',
        message: 'An error occurred while updating the refund'
      });
    }
  }

  /**
   * Cancel refund
   * POST /api/v1/refunds/:id/cancel
   */
  static async cancelRefund(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { reason } = req.body;

      const refund = await Refund.findOne({
        _id: id,
        merchantId
      });

      if (!refund) {
        res.status(404).json({
          success: false,
          error: 'Refund not found',
          message: 'Refund not found'
        });
        return;
      }

      if (refund.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: 'Cannot cancel refund',
          message: 'Only pending refunds can be cancelled'
        });
        return;
      }

      await (refund as any).cancel(reason);

      logger.info(`Refund cancelled: ${refund.reference}`);

      res.status(200).json({
        success: true,
        message: 'Refund cancelled successfully',
        data: {
          refund: {
            id: refund._id,
            reference: refund.reference,
            status: refund.status,
            failureReason: refund.failureReason
          }
        }
      });
    } catch (error) {
      logger.error('Cancel refund error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel refund',
        message: 'An error occurred while cancelling the refund'
      });
    }
  }

  /**
   * Get refund statistics
   * GET /api/v1/refunds/stats
   */
  static async getRefundStats(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { period = '30d' } = req.query;

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

      // Get refund statistics
      const stats = await Refund.aggregate([
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

      // Get refund type distribution
      const typeStats = await Refund.aggregate([
        {
          $match: {
            merchantId: merchantId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      // Calculate totals
      const totalRefunds = stats.reduce((sum, stat) => sum + stat.count, 0);
      const totalAmount = stats.reduce((sum, stat) => sum + stat.totalAmount, 0);
      const completedCount = stats.find(s => s._id === 'completed')?.count || 0;
      const successRate = totalRefunds > 0 ? (completedCount / totalRefunds) * 100 : 0;

      logger.info(`Refund stats retrieved for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Refund statistics retrieved successfully',
        data: {
          period,
          summary: {
            totalRefunds,
            totalAmount,
            completedCount,
            successRate: Math.round(successRate * 100) / 100,
            avgRefundAmount: totalRefunds > 0 ? Math.round(totalAmount / totalRefunds) : 0
          },
          byStatus: stats,
          byType: typeStats
        }
      });
    } catch (error) {
      logger.error('Get refund stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve refund statistics',
        message: 'An error occurred while retrieving refund statistics'
      });
    }
  }
}

export default RefundController; 