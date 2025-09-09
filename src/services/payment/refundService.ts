import { Types } from 'mongoose';
import Refund from '../../models/Refund';
import Transaction from '../../models/Transaction';
import Merchant from '../../models/Merchant';
import { logger } from '../../utils/helpers/logger';
import { redisClient } from '../../config/redis';

// Helper function to generate reference
function generateReference(prefix: string = 'REF'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export interface CreateRefundData {
  transactionId: string;
  amount: number;
  reason: string;
  refundType?: 'full' | 'partial';
  metadata?: any;
}

export interface RefundResult {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}

export class RefundService {
  /**
   * Create a new refund
   */
  async createRefund(data: CreateRefundData, merchantId: string): Promise<RefundResult> {
    try {
      // Get the original transaction
      const transaction = await Transaction.findById(data.transactionId);
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
          code: 'TRANSACTION_NOT_FOUND'
        };
      }

      // Verify transaction belongs to merchant
      if (transaction.merchantId.toString() !== merchantId) {
        return {
          success: false,
          error: 'Transaction does not belong to merchant',
          code: 'UNAUTHORIZED'
        };
      }

      // Check if transaction is refundable
      if (transaction.status !== 'success') {
        return {
          success: false,
          error: 'Transaction is not successful and cannot be refunded',
          code: 'TRANSACTION_NOT_REFUNDABLE'
        };
      }

      // Check if refund amount is valid
      if (data.amount <= 0 || data.amount > transaction.amount) {
        return {
          success: false,
          error: 'Invalid refund amount',
          code: 'INVALID_REFUND_AMOUNT'
        };
      }

      // Check if refund type is valid
      const refundType = data.refundType || (data.amount === transaction.amount ? 'full' : 'partial');
      if (refundType === 'full' && data.amount !== transaction.amount) {
        return {
          success: false,
          error: 'Full refund amount must equal transaction amount',
          code: 'INVALID_FULL_REFUND'
        };
      }

      // Check if there are existing refunds
      const existingRefunds = await Refund.find({ transactionId: data.transactionId });
      const totalRefunded = existingRefunds.reduce((sum, refund) => sum + refund.amount, 0);
      const remainingAmount = transaction.amount - totalRefunded;

      if (data.amount > remainingAmount) {
        return {
          success: false,
          error: `Refund amount exceeds remaining amount (${remainingAmount})`,
          code: 'REFUND_AMOUNT_EXCEEDED'
        };
      }

      // Generate refund reference
      const reference = generateReference('REF');

      // Create refund
      const refund = new Refund({
        transactionId: data.transactionId,
        merchantId,
        reference,
        amount: data.amount,
        currency: transaction.currency,
        reason: data.reason,
        type: refundType,
        status: 'pending',
        metadata: data.metadata,
        gatewayResponse: {
          status: 'pending',
          message: 'Refund initiated successfully'
        }
      });

      await refund.save();

      // Cache refund for quick access
      await redisClient.set(`refund:${reference}`, JSON.stringify(refund), 3600);

      logger.info('Refund created', {
        reference: refund.reference,
        amount: refund.amount,
        transactionId: data.transactionId,
        merchantId
      });

      return {
        success: true,
        data: {
          id: refund._id,
          reference: refund.reference,
          amount: refund.amount,
          currency: refund.currency,
          reason: refund.reason,
          type: refund.type,
          status: refund.status,
          created_at: refund.createdAt
        }
      };
    } catch (error) {
      logger.error('Refund creation error:', error);
      return {
        success: false,
        error: 'Failed to create refund',
        code: 'CREATION_ERROR'
      };
    }
  }

  /**
   * Process refund simulation
   */
  async processRefund(refundId: string): Promise<RefundResult> {
    try {
      const refund = await Refund.findById(refundId).populate('transactionId');
      if (!refund) {
        return {
          success: false,
          error: 'Refund not found',
          code: 'REFUND_NOT_FOUND'
        };
      }

      if (refund.status !== 'pending') {
        return {
          success: false,
          error: 'Refund already processed',
          code: 'REFUND_ALREADY_PROCESSED'
        };
      }

      // Simulate refund processing
      const success = Math.random() > 0.05; // 95% success rate for simulation

      if (success) {
        // Update refund status
        refund.status = 'completed';
        refund.processedAt = new Date();
        refund.gatewayResponse = {
          status: 'success',
          message: 'Refund processed successfully',
          refund_id: `REF_${Date.now()}`,
          authorization_code: `REF_AUTH_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        };

        await refund.save();

        // Update transaction refund status
        await Transaction.findByIdAndUpdate(refund.transactionId, {
          $inc: { refundedAmount: refund.amount },
          $set: { 
            refundStatus: refund.type === 'full' ? 'fully_refunded' : 'partially_refunded',
            lastRefundedAt: new Date()
          }
        });

        // Send refund processed email to customer
        try {
          const EmailService = (await import('../notification/emailService')).default;
          const merchant = await Merchant.findById(refund.merchantId);
          const transaction = await Transaction.findById(refund.transactionId);
          
          await EmailService.sendRefundProcessedEmail(transaction?.customerEmail || '', {
            customerName: transaction?.customerName || 'Valued Customer',
            amount: refund.amount,
            currency: transaction?.currency || 'NGN',
            reference: refund.reference,
            date: refund.processedAt?.toLocaleDateString() || new Date().toLocaleDateString(),
            reason: refund.reason,
            businessName: merchant?.businessName || 'TransactLab'
          });
          
          logger.info('Refund processed email sent', {
            reference: refund.reference,
            customerEmail: transaction?.customerEmail
          });
        } catch (emailError) {
          logger.error('Failed to send refund processed email:', emailError);
          // Don't fail refund processing if email fails
        }

        logger.info('Refund processed successfully', {
          reference: refund.reference,
          amount: refund.amount,
          transactionId: refund.transactionId
        });
      } else {
        // Simulate failed refund
        refund.status = 'failed';
        refund.processedAt = new Date();
        refund.gatewayResponse = {
          status: 'failed',
          message: 'Refund failed - insufficient balance',
          error_code: 'INSUFFICIENT_BALANCE'
        };

        await refund.save();

        logger.warn('Refund processing failed', {
          reference: refund.reference,
          amount: refund.amount,
          transactionId: refund.transactionId
        });
      }

      // Clear cache
      await redisClient.del(`refund:${refund.reference}`);

      return {
        success: true,
        data: {
          reference: refund.reference,
          status: refund.status,
          gateway_response: refund.gatewayResponse
        }
      };
    } catch (error) {
      logger.error('Refund processing error:', error);
      return {
        success: false,
        error: 'Failed to process refund',
        code: 'PROCESSING_ERROR'
      };
    }
  }

  /**
   * Get refund by reference
   */
  async getRefundByReference(reference: string): Promise<RefundResult> {
    try {
      // Check cache first
      const cachedRefund = await redisClient.get(`refund:${reference}`);
      let refund;

      if (cachedRefund) {
        refund = JSON.parse(cachedRefund);
      } else {
        refund = await Refund.findOne({ reference }).populate('transactionId');
        if (refund) {
          await redisClient.set(`refund:${reference}`, JSON.stringify(refund), 3600);
        }
      }

      if (!refund) {
        return {
          success: false,
          error: 'Refund not found',
          code: 'REFUND_NOT_FOUND'
        };
      }

      return {
        success: true,
        data: {
          id: refund._id,
          reference: refund.reference,
          transaction_id: refund.transactionId,
          amount: refund.amount,
          currency: refund.currency,
          reason: refund.reason,
          type: refund.type,
          status: refund.status,
          metadata: refund.metadata,
          gateway_response: refund.gatewayResponse,
          created_at: refund.createdAt,
          processed_at: refund.processedAt
        }
      };
    } catch (error) {
      logger.error('Get refund error:', error);
      return {
        success: false,
        error: 'Failed to get refund',
        code: 'GET_ERROR'
      };
    }
  }

  /**
   * Update refund status
   */
  async updateRefundStatus(refundId: string, status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled', reason?: string): Promise<RefundResult> {
    try {
      const refund = await Refund.findById(refundId);
      if (!refund) {
        return {
          success: false,
          error: 'Refund not found',
          code: 'REFUND_NOT_FOUND'
        };
      }

      refund.status = status;
      if (reason) {
        refund.reason = reason;
      }
      refund.updatedAt = new Date();

      await refund.save();

      // Clear cache
      await redisClient.del(`refund:${refund.reference}`);

      logger.info('Refund status updated', {
        reference: refund.reference,
        status: refund.status,
        reason: refund.reason
      });

      return {
        success: true,
        data: {
          reference: refund.reference,
          status: refund.status,
          reason: refund.reason,
          updated_at: refund.updatedAt
        }
      };
    } catch (error) {
      logger.error('Refund status update error:', error);
      return {
        success: false,
        error: 'Failed to update refund status',
        code: 'UPDATE_ERROR'
      };
    }
  }

  /**
   * Cancel refund
   */
  async cancelRefund(refundId: string, reason?: string): Promise<RefundResult> {
    try {
      const refund = await Refund.findById(refundId);
      if (!refund) {
        return {
          success: false,
          error: 'Refund not found',
          code: 'REFUND_NOT_FOUND'
        };
      }

      if (refund.status !== 'pending') {
        return {
          success: false,
          error: 'Cannot cancel non-pending refund',
          code: 'INVALID_STATUS'
        };
      }

      // Update refund status
      refund.status = 'cancelled';
      if (reason) {
        refund.failureReason = reason;
      }
      refund.updatedAt = new Date();

      await refund.save();

      // Clear cache
      await redisClient.del(`refund:${refund.reference}`);

      logger.info('Refund cancelled', {
        reference: refund.reference,
        reason: reason || 'No reason provided'
      });

      return {
        success: true,
        data: {
          reference: refund.reference,
          status: refund.status,
          reason: refund.failureReason
        }
      };
    } catch (error) {
      logger.error('Refund cancellation error:', error);
      return {
        success: false,
        error: 'Failed to cancel refund',
        code: 'CANCELLATION_ERROR'
      };
    }
  }

  /**
   * Get refund statistics
   */
  async getRefundStats(merchantId: string, filters: any = {}): Promise<RefundResult> {
    try {
      const matchStage: any = { merchantId };
      
      if (filters.startDate) {
        matchStage.createdAt = { $gte: new Date(filters.startDate) };
      }
      if (filters.endDate) {
        matchStage.createdAt = { ...matchStage.createdAt, $lte: new Date(filters.endDate) };
      }
      if (filters.status) {
        matchStage.status = filters.status;
      }

      const stats = await Refund.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRefunds: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            processedRefunds: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failedRefunds: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            pendingRefunds: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            cancelledRefunds: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            fullRefunds: {
              $sum: { $cond: [{ $eq: ['$type', 'full'] }, 1, 0] }
            },
            partialRefunds: {
              $sum: { $cond: [{ $eq: ['$type', 'partial'] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalRefunds: 0,
        totalAmount: 0,
        processedRefunds: 0,
        failedRefunds: 0,
        pendingRefunds: 0,
        cancelledRefunds: 0,
        fullRefunds: 0,
        partialRefunds: 0
      };

      result.successRate = result.totalRefunds > 0 
        ? (result.processedRefunds / result.totalRefunds) * 100 
        : 0;

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Refund stats error:', error);
      return {
        success: false,
        error: 'Failed to get refund statistics',
        code: 'STATS_ERROR'
      };
    }
  }

  /**
   * List refunds with pagination and filters
   */
  async listRefunds(merchantId: string, filters: any = {}): Promise<RefundResult> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const query: any = { merchantId };

      if (status) query.status = status;
      if (type) query.type = type;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      if (minAmount || maxAmount) {
        query.amount = {};
        if (minAmount) query.amount.$gte = minAmount;
        if (maxAmount) query.amount.$lte = maxAmount;
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [refunds, total] = await Promise.all([
        Refund.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('transactionId'),
        Refund.countDocuments(query)
      ]);

      return {
        success: true,
        data: {
          refunds,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      logger.error('List refunds error:', error);
      return {
        success: false,
        error: 'Failed to list refunds',
        code: 'LIST_ERROR'
      };
    }
  }
}

export default RefundService; 