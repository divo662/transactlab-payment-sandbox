import { Transaction, User, Merchant, PaymentMethod } from '../../models';
import { logger } from '../../utils/helpers/logger';
import { redisClient } from '../../config/redis';
import { generateReference, calculateFees, validateAmount } from '../../utils/helpers/paymentHelper';
import { TRANSACTION_STATUS, TRANSACTION_TYPES, CURRENCIES } from '../../utils/constants';
import { Currency } from '../../utils/constants/currencies';
import { WebhookService } from './webhookService';

export interface CreateTransactionData {
  amount: number;
  currency: Currency;
  email: string;
  reference?: string;
  callback_url?: string;
  payment_method?: string;
  metadata?: any;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  channels?: string[];
}

export interface TransactionResult {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}

export class TransactionService {

  /**
   * Initialize a new transaction
   */
  async initializeTransaction(data: CreateTransactionData, merchantId: string): Promise<TransactionResult> {
    try {
      // Validate amount and currency
      const amountValidation = validateAmount(data.amount, data.currency);
      if (!amountValidation.valid) {
        return {
          success: false,
          error: amountValidation.error,
          code: 'INVALID_AMOUNT'
        };
      }

      // Generate unique reference if not provided
      const reference = data.reference || generateReference();

      // Check if reference already exists
      const existingTransaction = await Transaction.findOne({ reference });
      if (existingTransaction) {
        return {
          success: false,
          error: 'Reference already exists',
          code: 'DUPLICATE_REFERENCE'
        };
      }

      // Get merchant details
      const merchant = await Merchant.findById(merchantId);
      if (!merchant || !merchant.isActive) {
        return {
          success: false,
          error: 'Merchant not found or inactive',
          code: 'MERCHANT_NOT_FOUND'
        };
      }

      // Calculate fees
      const fees = calculateFees(data.amount, data.currency, merchant.feeStructure);

      // Create transaction
      const transaction = new Transaction({
        merchantId,
        reference,
        amount: data.amount,
        currency: data.currency,
        customerEmail: data.email,
        customerName: data.customer?.name,
        customerPhone: data.customer?.phone,
        customerAddress: data.customer?.address,
        paymentMethod: data.payment_method || 'card',
        status: TRANSACTION_STATUS.PENDING,
        type: TRANSACTION_TYPES.PAYMENT,
        callbackUrl: data.callback_url,
        metadata: data.metadata,
        channels: data.channels,
        fees,
        gatewayResponse: {
          status: 'pending',
          message: 'Transaction initialized successfully'
        }
      });

      await transaction.save();

      // Cache transaction for quick access
      await redisClient.set(`transaction:${reference}`, JSON.stringify(transaction), 3600);

      // Send webhook notification
      await WebhookService.sendTransactionWebhook(transaction, 'transaction.initialized');

      logger.info('Transaction initialized', {
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        merchantId
      });

      return {
        success: true,
        data: {
          reference: transaction.reference,
          authorization_url: `${process.env.BASE_URL}/payment/authorize/${transaction.reference}`,
          access_code: transaction.accessCode,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status
        }
      };
    } catch (error) {
      logger.error('Transaction initialization error:', error);
      return {
        success: false,
        error: 'Failed to initialize transaction',
        code: 'INITIALIZATION_ERROR'
      };
    }
  }

  /**
   * Verify transaction status
   */
  async verifyTransaction(reference: string): Promise<TransactionResult> {
    try {
      // Check cache first
      const cachedTransaction = await redisClient.get(`transaction:${reference}`);
      let transaction;

      if (cachedTransaction) {
        transaction = JSON.parse(cachedTransaction);
      } else {
        transaction = await Transaction.findOne({ reference }).populate('merchantId');
        if (transaction) {
          await redisClient.set(`transaction:${reference}`, JSON.stringify(transaction), 3600);
        }
      }

      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
          code: 'TRANSACTION_NOT_FOUND'
        };
      }

      return {
        success: true,
        data: {
          id: transaction._id,
          reference: transaction.reference,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          payment_method: transaction.paymentMethod,
          customer: {
            email: transaction.customerEmail,
            name: transaction.customerName,
            phone: transaction.customerPhone
          },
          fees: transaction.fees,
          gateway_response: transaction.gatewayResponse,
          created_at: transaction.createdAt,
          updated_at: transaction.updatedAt
        }
      };
    } catch (error) {
      logger.error('Transaction verification error:', error);
      return {
        success: false,
        error: 'Failed to verify transaction',
        code: 'VERIFICATION_ERROR'
      };
    }
  }

  /**
   * Process payment simulation
   */
  async processPayment(reference: string, paymentData: any): Promise<TransactionResult> {
    try {
      const transaction = await Transaction.findOne({ reference });
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
          code: 'TRANSACTION_NOT_FOUND'
        };
      }

      if (transaction.status !== TRANSACTION_STATUS.PENDING) {
        return {
          success: false,
          error: 'Transaction already processed',
          code: 'TRANSACTION_ALREADY_PROCESSED'
        };
      }

      // Simulate payment processing
      const success = Math.random() > 0.1; // 90% success rate for simulation

      if (success) {
        // Update transaction status
        transaction.status = TRANSACTION_STATUS.SUCCESS;
        transaction.processedAt = new Date();
        transaction.gatewayResponse = {
          status: 'success',
          message: 'Payment processed successfully',
          transaction_id: `TXN_${Date.now()}`,
          authorization_code: `AUTH_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        };

        await transaction.save();

        // Update merchant stats
        await this.updateMerchantStats(transaction.merchantId, transaction.amount);

        // Send success webhook
        await WebhookService.sendTransactionWebhook(transaction, 'transaction.success');

        // Send payment success email to customer
        try {
          const EmailService = (await import('../notification/emailService')).default;
          const merchant = await Merchant.findById(transaction.merchantId);
          
          await EmailService.sendPaymentSuccessEmail(transaction.customerEmail, {
            customerName: transaction.customerName || 'Valued Customer',
            amount: transaction.amount,
            currency: transaction.currency,
            reference: transaction.reference,
            date: transaction.processedAt?.toLocaleDateString() || new Date().toLocaleDateString(),
            paymentMethod: transaction.paymentMethod || 'Card',
            businessName: merchant?.businessName || 'TransactLab'
          });
          
          logger.info('Payment success email sent', {
            reference: transaction.reference,
            customerEmail: transaction.customerEmail
          });
        } catch (emailError) {
          logger.error('Failed to send payment success email:', emailError);
          // Don't fail payment processing if email fails
        }

        logger.info('Payment processed successfully', {
          reference: transaction.reference,
          amount: transaction.amount,
          merchantId: transaction.merchantId
        });
      } else {
        // Simulate failed payment
        transaction.status = TRANSACTION_STATUS.FAILED;
        transaction.processedAt = new Date();
        transaction.gatewayResponse = {
          status: 'failed',
          message: 'Payment failed - insufficient funds',
          error_code: 'INSUFFICIENT_FUNDS'
        };

        await transaction.save();

        // Send failure webhook
        await WebhookService.sendTransactionWebhook(transaction, 'transaction.failed');

        // Send payment failure email to customer
        try {
          const EmailService = (await import('../notification/emailService')).default;
          const merchant = await Merchant.findById(transaction.merchantId);
          
          await EmailService.sendPaymentFailedEmail(transaction.customerEmail, {
            customerName: transaction.customerName || 'Valued Customer',
            amount: transaction.amount,
            currency: transaction.currency,
            reference: transaction.reference,
            date: transaction.processedAt?.toLocaleDateString() || new Date().toLocaleDateString(),
            reason: transaction.gatewayResponse?.message || 'Payment processing failed',
            businessName: merchant?.businessName || 'TransactLab'
          });
          
          logger.info('Payment failure email sent', {
            reference: transaction.reference,
            customerEmail: transaction.customerEmail
          });
        } catch (emailError) {
          logger.error('Failed to send payment failure email:', emailError);
          // Don't fail payment processing if email fails
        }

        logger.warn('Payment processing failed', {
          reference: transaction.reference,
          amount: transaction.amount,
          merchantId: transaction.merchantId
        });
      }

      // Clear cache
      await redisClient.del(`transaction:${reference}`);

      return {
        success: true,
        data: {
          reference: transaction.reference,
          status: transaction.status,
          gateway_response: transaction.gatewayResponse
        }
      };
    } catch (error) {
      logger.error('Payment processing error:', error);
      return {
        success: false,
        error: 'Failed to process payment',
        code: 'PROCESSING_ERROR'
      };
    }
  }

  /**
   * Cancel transaction
   */
  async cancelTransaction(reference: string, reason?: string): Promise<TransactionResult> {
    try {
      const transaction = await Transaction.findOne({ reference });
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
          code: 'TRANSACTION_NOT_FOUND'
        };
      }

      if (transaction.status !== TRANSACTION_STATUS.PENDING) {
        return {
          success: false,
          error: 'Cannot cancel non-pending transaction',
          code: 'INVALID_STATUS'
        };
      }

      transaction.status = TRANSACTION_STATUS.CANCELLED;
      transaction.cancelledAt = new Date();
      transaction.cancellationReason = reason || 'Cancelled by user';

      await transaction.save();

      // Clear cache
      await redisClient.del(`transaction:${reference}`);

      // Send cancellation webhook
      await WebhookService.sendTransactionWebhook(transaction, 'transaction.cancelled');

      logger.info('Transaction cancelled', {
        reference: transaction.reference,
        reason: transaction.cancellationReason
      });

      return {
        success: true,
        data: {
          reference: transaction.reference,
          status: transaction.status,
          cancelled_at: transaction.cancelledAt,
          reason: transaction.cancellationReason
        }
      };
    } catch (error) {
      logger.error('Transaction cancellation error:', error);
      return {
        success: false,
        error: 'Failed to cancel transaction',
        code: 'CANCELLATION_ERROR'
      };
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(merchantId: string, filters: any = {}): Promise<TransactionResult> {
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

      const stats = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            successfulTransactions: {
              $sum: { $cond: [{ $eq: ['$status', TRANSACTION_STATUS.SUCCESS] }, 1, 0] }
            },
            failedTransactions: {
              $sum: { $cond: [{ $eq: ['$status', TRANSACTION_STATUS.FAILED] }, 1, 0] }
            },
            pendingTransactions: {
              $sum: { $cond: [{ $eq: ['$status', TRANSACTION_STATUS.PENDING] }, 1, 0] }
            },
            totalFees: { $sum: '$fees.amount' }
          }
        }
      ]);

      const result = stats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
        totalFees: 0
      };

      result.successRate = result.totalTransactions > 0 
        ? (result.successfulTransactions / result.totalTransactions) * 100 
        : 0;

      return {
        success: true,
        data: result
      };
    } catch (error) {
      logger.error('Transaction stats error:', error);
      return {
        success: false,
        error: 'Failed to get transaction statistics',
        code: 'STATS_ERROR'
      };
    }
  }

  /**
   * Update merchant statistics
   */
  private async updateMerchantStats(merchantId: any, amount: number): Promise<void> {
    try {
      await Merchant.findByIdAndUpdate(merchantId, {
        $inc: {
          'stats.totalTransactions': 1,
          'stats.totalVolume': amount,
          'stats.successfulTransactions': 1
        },
        $set: {
          'stats.lastTransactionAt': new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to update merchant stats:', error);
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<TransactionResult> {
    try {
      const transaction = await Transaction.findById(transactionId).populate('merchantId');
      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found',
          code: 'TRANSACTION_NOT_FOUND'
        };
      }

      return {
        success: true,
        data: transaction
      };
    } catch (error) {
      logger.error('Get transaction error:', error);
      return {
        success: false,
        error: 'Failed to get transaction',
        code: 'GET_ERROR'
      };
    }
  }

  /**
   * List transactions with pagination and filters
   */
  async listTransactions(merchantId: string, filters: any = {}): Promise<TransactionResult> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        paymentMethod,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const query: any = { merchantId };

      if (status) query.status = status;
      if (paymentMethod) query.paymentMethod = paymentMethod;
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

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('merchantId'),
        Transaction.countDocuments(query)
      ]);

      return {
        success: true,
        data: {
          transactions,
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
      logger.error('List transactions error:', error);
      return {
        success: false,
        error: 'Failed to list transactions',
        code: 'LIST_ERROR'
      };
    }
  }
}

export default TransactionService; 