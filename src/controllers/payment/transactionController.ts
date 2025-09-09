import { Request, Response } from 'express';
import { Transaction, Merchant, PaymentMethod } from '../../models';
import { logger } from '../../utils/helpers/logger';
import { redisClient } from '../../config/redis';
import { ENV } from '../../config/environment';

// Request interfaces
interface InitializeTransactionRequest {
  amount: number;
  currency: string;
  email: string;
  reference?: string;
  callback_url?: string;
  payment_method?: string;
  metadata?: Record<string, any>;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
}

interface VerifyTransactionRequest {
  reference: string;
}

interface ListTransactionsRequest {
  page?: number;
  perPage?: number;
  status?: string;
  payment_method?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

// Response interfaces
interface TransactionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class TransactionController {
  /**
   * Initialize a new transaction
   * POST /api/v1/transactions/initialize
   */
  static async initializeTransaction(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        amount,
        currency,
        email,
        reference,
        callback_url,
        payment_method,
        metadata,
        customer_name,
        customer_phone,
        customer_address
      }: InitializeTransactionRequest = req.body;

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

      // Validate amount
      if (amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid amount',
          message: 'Amount must be greater than 0'
        });
        return;
      }

      // Validate currency
      if (!merchant.currencies.includes(currency)) {
        res.status(400).json({
          success: false,
          error: 'Unsupported currency',
          message: `Currency ${currency} is not supported by this merchant`
        });
        return;
      }

      // Check transaction limits
      try {
        (merchant as any).checkTransactionLimits(amount);
      } catch (error) {
        res.status(400).json({
          success: false,
          error: 'Transaction limit exceeded',
          message: error instanceof Error ? error.message : 'Transaction limit exceeded'
        });
        return;
      }

      // Get payment method configuration
      let paymentMethodConfig = null;
      if (payment_method) {
        paymentMethodConfig = await PaymentMethod.findOne({
          merchantId,
          type: payment_method,
          isActive: true
        });
      } else {
        // Get default payment method
        paymentMethodConfig = await (PaymentMethod as any).findDefaultByMerchant(merchantId);
      }

      if (!paymentMethodConfig) {
        res.status(400).json({
          success: false,
          error: 'No payment method available',
          message: 'No active payment method found for this merchant'
        });
        return;
      }

      // Calculate fees
      const feeCalculation = paymentMethodConfig.calculateFees(amount, currency);

      // Create transaction
      const transaction = new Transaction({
        amount,
        currency,
        paymentMethod: payment_method || paymentMethodConfig.type,
        merchantId,
        customerEmail: email,
        customerName: customer_name,
        customerPhone: customer_phone,
        customerAddress: customer_address,
        callbackUrl: callback_url,
        fees: feeCalculation.fee,
        metadata,
        reference: reference || undefined // Will be auto-generated if not provided
      });

      await transaction.save();

      // Update merchant transaction stats
      await (merchant as any).updateTransactionStats(amount, true);

      // Cache transaction for quick access
      await redisClient.set(
        `transaction:${transaction.reference}`,
        JSON.stringify(transaction),
        24 * 60 * 60 // 24 hours
      );

      logger.info(`Transaction initialized: ${transaction.reference} for merchant: ${merchantId}`);

      res.status(201).json({
        success: true,
        message: 'Transaction initialized successfully',
        data: {
          transaction: {
            id: transaction._id,
            reference: transaction.reference,
            amount: transaction.amount,
            currency: transaction.currency,
            fees: transaction.fees,
            totalAmount: (transaction as any).totalAmount,
            status: transaction.status,
            paymentMethod: transaction.paymentMethod,
            customerEmail: transaction.customerEmail,
            expiresAt: transaction.expiresAt,
            callbackUrl: transaction.callbackUrl
          },
          paymentUrl: `${ENV.NODE_ENV === 'production' ? 'https://' : 'http://'}${req.get('host')}/pay/${transaction.reference}`,
          authorizationUrl: `${ENV.NODE_ENV === 'production' ? 'https://' : 'http://'}${req.get('host')}/api/v1/transactions/${transaction.reference}/authorize`
        }
      });
    } catch (error) {
      logger.error('Initialize transaction error:', error);
      res.status(500).json({
        success: false,
        error: 'Transaction initialization failed',
        message: 'An error occurred while initializing the transaction'
      });
    }
  }

  /**
   * Verify transaction
   * GET /api/v1/transactions/verify/:reference
   */
  static async verifyTransaction(req: Request, res: Response): Promise<void> {
    try {
      const reference = req.params.reference as string;

      if (!reference) {
        res.status(400).json({
          success: false,
          error: 'Missing transaction reference',
          message: 'Transaction reference is required'
        });
        return;
      }

      // Try to get from cache first
      let transaction = null;
      const cachedTransaction = await redisClient.get(`transaction:${reference}`);
      
      if (cachedTransaction) {
        transaction = JSON.parse(cachedTransaction);
      } else {
        // Get from database
        transaction = await (Transaction as any).findByReference(reference);
        if (transaction) {
          // Cache the transaction
          await redisClient.set(
            `transaction:${reference}`,
            JSON.stringify(transaction),
            24 * 60 * 60 // 24 hours
          );
        }
      }

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: 'Transaction not found',
          message: 'Transaction not found'
        });
        return;
      }

      // Get merchant info
      const merchant = await Merchant.findById(transaction.merchantId);

      res.status(200).json({
        success: true,
        message: 'Transaction verified successfully',
        data: {
          transaction: {
            id: transaction._id,
            reference: transaction.reference,
            amount: transaction.amount,
            currency: transaction.currency,
            fees: transaction.fees,
            totalAmount: (transaction as any).totalAmount,
            status: transaction.status,
            paymentMethod: transaction.paymentMethod,
            customerEmail: transaction.customerEmail,
            customerName: transaction.customerName,
            customerPhone: transaction.customerPhone,
            processedAt: transaction.processedAt,
            createdAt: transaction.createdAt,
            expiresAt: transaction.expiresAt,
            gatewayResponse: transaction.gatewayResponse,
            metadata: transaction.metadata
          },
          merchant: merchant ? {
            id: merchant._id,
            businessName: merchant.businessName,
            businessEmail: merchant.businessEmail,
            logo: merchant.logo
          } : null
        }
      });
    } catch (error) {
      logger.error('Verify transaction error:', error);
      res.status(500).json({
        success: false,
        error: 'Transaction verification failed',
        message: 'An error occurred while verifying the transaction'
      });
    }
  }

  /**
   * List transactions
   * GET /api/v1/transactions
   */
  static async listTransactions(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        page = 1,
        perPage = 20,
        status,
        payment_method,
        start_date,
        end_date,
        search
      }: ListTransactionsRequest = req.query;

      // Build query
      const query: any = { merchantId };
      
      if (status) query.status = status;
      if (payment_method) query.paymentMethod = payment_method;
      
      if (start_date || end_date) {
        query.createdAt = {};
        if (start_date) query.createdAt.$gte = new Date(start_date as string);
        if (end_date) query.createdAt.$lte = new Date(end_date as string);
      }

      if (search) {
        query.$or = [
          { reference: { $regex: search, $options: 'i' } },
          { customerEmail: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(perPage);
      const limit = Number(perPage);

      // Get transactions
      const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const total = await Transaction.countDocuments(query);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.info(`Transactions listed for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: {
          transactions: transactions.map(t => ({
            id: t._id,
            reference: t.reference,
            amount: t.amount,
            currency: t.currency,
            fees: t.fees,
            totalAmount: (t as any).totalAmount,
            status: t.status,
            paymentMethod: t.paymentMethod,
            customerEmail: t.customerEmail,
            customerName: t.customerName,
            processedAt: t.processedAt,
            createdAt: t.createdAt
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
      logger.error('List transactions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transactions',
        message: 'An error occurred while retrieving transactions'
      });
    }
  }

  /**
   * Get transaction by ID
   * GET /api/v1/transactions/:id
   */
  static async getTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const transaction = await Transaction.findOne({
        _id: id,
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

      res.status(200).json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: {
          transaction: {
            id: transaction._id,
            reference: transaction.reference,
            amount: transaction.amount,
            currency: transaction.currency,
            fees: transaction.fees,
            totalAmount: (transaction as any).totalAmount,
            status: transaction.status,
            paymentMethod: transaction.paymentMethod,
            customerEmail: transaction.customerEmail,
            customerName: transaction.customerName,
            customerPhone: transaction.customerPhone,
            customerAddress: transaction.customerAddress,
            processedAt: transaction.processedAt,
            createdAt: transaction.createdAt,
            expiresAt: transaction.expiresAt,
            gatewayResponse: transaction.gatewayResponse,
            metadata: transaction.metadata,
            failureReason: transaction.failureReason,
            refundedAmount: transaction.refundedAmount,
            chargebackAmount: transaction.chargebackAmount,
            remainingAmount: (transaction as any).remainingAmount
          }
        }
      });
    } catch (error) {
      logger.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transaction',
        message: 'An error occurred while retrieving the transaction'
      });
    }
  }

  /**
   * Cancel transaction
   * POST /api/v1/transactions/:id/cancel
   */
  static async cancelTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const transaction = await Transaction.findOne({
        _id: id,
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

      if (transaction.status !== 'pending') {
        res.status(400).json({
          success: false,
          error: 'Cannot cancel transaction',
          message: 'Only pending transactions can be cancelled'
        });
        return;
      }

      // Cancel transaction
      transaction.status = 'cancelled';
      transaction.failureReason = 'Cancelled by merchant';
      await transaction.save();

      // Remove from cache
      await redisClient.del(`transaction:${transaction.reference}`);

      logger.info(`Transaction cancelled: ${transaction.reference}`);

      res.status(200).json({
        success: true,
        message: 'Transaction cancelled successfully',
        data: {
          transaction: {
            id: transaction._id,
            reference: transaction.reference,
            status: transaction.status,
            failureReason: transaction.failureReason
          }
        }
      });
    } catch (error) {
      logger.error('Cancel transaction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel transaction',
        message: 'An error occurred while cancelling the transaction'
      });
    }
  }

  /**
   * Get transaction statistics
   * GET /api/v1/transactions/stats
   */
  static async getTransactionStats(req: Request, res: Response): Promise<void> {
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

      // Get transaction statistics
      const stats = await Transaction.aggregate([
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

      // Calculate totals
      const totalTransactions = stats.reduce((sum, stat) => sum + stat.count, 0);
      const totalAmount = stats.reduce((sum, stat) => sum + stat.totalAmount, 0);
      const successCount = stats.find(s => s._id === 'success')?.count || 0;
      const successRate = totalTransactions > 0 ? (successCount / totalTransactions) * 100 : 0;

      logger.info(`Transaction stats retrieved for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Transaction statistics retrieved successfully',
        data: {
          period,
          summary: {
            totalTransactions,
            totalAmount,
            successCount,
            successRate: Math.round(successRate * 100) / 100,
            avgTransactionValue: totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0
          },
          byStatus: stats,
          byPaymentMethod: paymentMethodStats
        }
      });
    } catch (error) {
      logger.error('Get transaction stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transaction statistics',
        message: 'An error occurred while retrieving transaction statistics'
      });
    }
  }
}

export default TransactionController; 