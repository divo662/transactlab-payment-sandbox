import { Request, Response } from 'express';
import { Subscription, Transaction, Merchant, User } from '../../models';
import { logger } from '../../utils/helpers/logger';

// Request interfaces
interface CreateSubscriptionRequest {
  planId: string;
  planName: string;
  planDescription?: string;
  amount: number;
  currency: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  intervalCount?: number;
  customerId: string;
  paymentMethod: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}

interface UpdateSubscriptionRequest {
  planName?: string;
  planDescription?: string;
  amount?: number;
  interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  intervalCount?: number;
  metadata?: Record<string, any>;
}

interface CancelSubscriptionRequest {
  cancelAtPeriodEnd?: boolean;
  reason?: string;
}

// Response interfaces
interface SubscriptionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class SubscriptionController {
  /**
   * Create a new subscription
   * POST /api/v1/subscriptions
   */
  static async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        planId,
        planName,
        planDescription,
        amount,
        currency,
        interval,
        intervalCount = 1,
        customerId,
        paymentMethod,
        trialDays,
        metadata
      }: CreateSubscriptionRequest = req.body;

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

      // Validate customer
      const customer = await User.findById(customerId);
      if (!customer) {
        res.status(400).json({
          success: false,
          error: 'Invalid customer',
          message: 'Customer not found'
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

      // Validate amount
      if (amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid amount',
          message: 'Amount must be greater than 0'
        });
        return;
      }

      // Calculate trial period
      let trialStart, trialEnd;
      if (trialDays && trialDays > 0) {
        trialStart = new Date();
        trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
      }

      // Calculate billing period
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date();
      
      switch (interval) {
        case 'daily':
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + intervalCount);
          break;
        case 'weekly':
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + (7 * intervalCount));
          break;
        case 'monthly':
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + intervalCount);
          break;
        case 'yearly':
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + intervalCount);
          break;
      }

      // Create subscription
      const subscription = new Subscription({
        merchantId,
        customerId,
        planId,
        planName,
        planDescription,
        amount,
        currency,
        interval,
        intervalCount,
        status: trialDays ? 'trialing' : 'active',
        currentPeriodStart,
        currentPeriodEnd,
        trialStart,
        trialEnd,
        nextBillingDate: currentPeriodEnd,
        paymentMethod,
        metadata
      });

      await subscription.save();

      logger.info(`Subscription created: ${subscription._id} for customer: ${customerId}`);

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: {
          subscription: {
            id: subscription._id,
            planId: subscription.planId,
            planName: subscription.planName,
            amount: subscription.amount,
            currency: subscription.currency,
            interval: subscription.interval,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            nextBillingDate: subscription.nextBillingDate,
            trialStart: subscription.trialStart,
            trialEnd: subscription.trialEnd,
            createdAt: subscription.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Create subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Subscription creation failed',
        message: 'An error occurred while creating the subscription'
      });
    }
  }

  /**
   * Get subscription by ID
   * GET /api/v1/subscriptions/:id
   */
  static async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const subscription = await Subscription.findOne({
        _id: id,
        merchantId
      }).populate('customerId', 'firstName lastName email');

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
          message: 'Subscription not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Subscription retrieved successfully',
        data: {
          subscription: {
            id: subscription._id,
            planId: subscription.planId,
            planName: subscription.planName,
            planDescription: subscription.planDescription,
            amount: subscription.amount,
            currency: subscription.currency,
            interval: subscription.interval,
            intervalCount: subscription.intervalCount,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            nextBillingDate: subscription.nextBillingDate,
            trialStart: subscription.trialStart,
            trialEnd: subscription.trialEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            cancelledAt: subscription.cancelledAt,
            endedAt: subscription.endedAt,
            billingCyclesCompleted: subscription.billingCyclesCompleted,
            totalBillingCycles: subscription.totalBillingCycles,
            paymentMethod: subscription.paymentMethod,
            metadata: subscription.metadata,
            createdAt: subscription.createdAt,
            customer: subscription.customerId ? {
              id: (subscription.customerId as any)._id,
              name: `${(subscription.customerId as any).firstName} ${(subscription.customerId as any).lastName}`,
              email: (subscription.customerId as any).email
            } : null
          }
        }
      });
    } catch (error) {
      logger.error('Get subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve subscription',
        message: 'An error occurred while retrieving the subscription'
      });
    }
  }

  /**
   * List subscriptions
   * GET /api/v1/subscriptions
   */
  static async listSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        page = 1,
        perPage = 20,
        status,
        customerId,
        planId
      } = req.query;

      // Build query
      const query: any = { merchantId };
      
      if (status) query.status = status;
      if (customerId) query.customerId = customerId;
      if (planId) query.planId = planId;

      // Calculate pagination
      const skip = (Number(page) - 1) * Number(perPage);
      const limit = Number(perPage);

      // Get subscriptions
      const subscriptions = await Subscription.find(query)
        .populate('customerId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get total count
      const total = await Subscription.countDocuments(query);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      logger.info(`Subscriptions listed for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Subscriptions retrieved successfully',
        data: {
          subscriptions: subscriptions.map(s => ({
            id: s._id,
            planId: s.planId,
            planName: s.planName,
            amount: s.amount,
            currency: s.currency,
            interval: s.interval,
            status: s.status,
            currentPeriodStart: s.currentPeriodStart,
            currentPeriodEnd: s.currentPeriodEnd,
            nextBillingDate: s.nextBillingDate,
            billingCyclesCompleted: s.billingCyclesCompleted,
            createdAt: s.createdAt,
            customer: s.customerId ? {
              id: (s.customerId as any)._id,
              name: `${(s.customerId as any).firstName} ${(s.customerId as any).lastName}`,
              email: (s.customerId as any).email
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
      logger.error('List subscriptions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve subscriptions',
        message: 'An error occurred while retrieving subscriptions'
      });
    }
  }

  /**
   * Update subscription
   * PUT /api/v1/subscriptions/:id
   */
  static async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        planName,
        planDescription,
        amount,
        interval,
        intervalCount,
        metadata
      }: UpdateSubscriptionRequest = req.body;

      const subscription = await Subscription.findOne({
        _id: id,
        merchantId
      });

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
          message: 'Subscription not found'
        });
        return;
      }

      // Update fields
      if (planName) subscription.planName = planName;
      if (planDescription) subscription.planDescription = planDescription;
      if (amount) subscription.amount = amount;
      if (interval) subscription.interval = interval;
      if (intervalCount) subscription.intervalCount = intervalCount;
      if (metadata) subscription.metadata = metadata;

      await subscription.save();

      logger.info(`Subscription updated: ${subscription._id}`);

      res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
        data: {
          subscription: {
            id: subscription._id,
            planName: subscription.planName,
            amount: subscription.amount,
            interval: subscription.interval,
            status: subscription.status,
            updatedAt: subscription.updatedAt
          }
        }
      });
    } catch (error) {
      logger.error('Update subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update subscription',
        message: 'An error occurred while updating the subscription'
      });
    }
  }

  /**
   * Cancel subscription
   * POST /api/v1/subscriptions/:id/cancel
   */
  static async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { cancelAtPeriodEnd = true, reason }: CancelSubscriptionRequest = req.body;

      const subscription = await Subscription.findOne({
        _id: id,
        merchantId
      });

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
          message: 'Subscription not found'
        });
        return;
      }

      if (subscription.status === 'cancelled') {
        res.status(400).json({
          success: false,
          error: 'Subscription already cancelled',
          message: 'Subscription is already cancelled'
        });
        return;
      }

      await (subscription as any).cancel(cancelAtPeriodEnd);

      logger.info(`Subscription cancelled: ${subscription._id} - Cancel at period end: ${cancelAtPeriodEnd}`);

      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: {
          subscription: {
            id: subscription._id,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            cancelledAt: subscription.cancelledAt
          }
        }
      });
    } catch (error) {
      logger.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription',
        message: 'An error occurred while cancelling the subscription'
      });
    }
  }

  /**
   * Reactivate subscription
   * POST /api/v1/subscriptions/:id/reactivate
   */
  static async reactivateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const subscription = await Subscription.findOne({
        _id: id,
        merchantId
      });

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
          message: 'Subscription not found'
        });
        return;
      }

      if (subscription.status !== 'cancelled') {
        res.status(400).json({
          success: false,
          error: 'Subscription not cancelled',
          message: 'Subscription is not cancelled'
        });
        return;
      }

      await (subscription as any).reactivate();

      logger.info(`Subscription reactivated: ${subscription._id}`);

      res.status(200).json({
        success: true,
        message: 'Subscription reactivated successfully',
        data: {
          subscription: {
            id: subscription._id,
            status: subscription.status
          }
        }
      });
    } catch (error) {
      logger.error('Reactivate subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reactivate subscription',
        message: 'An error occurred while reactivating the subscription'
      });
    }
  }

  /**
   * Process subscription billing
   * POST /api/v1/subscriptions/:id/bill
   */
  static async processBilling(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const subscription = await Subscription.findOne({
        _id: id,
        merchantId
      }).populate('customerId', 'firstName lastName email');

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
          message: 'Subscription not found'
        });
        return;
      }

      if (subscription.status !== 'active') {
        res.status(400).json({
          success: false,
          error: 'Subscription not active',
          message: 'Subscription is not active'
        });
        return;
      }

      // Process billing logic here
      // This would typically involve creating a transaction
      // and updating the subscription billing cycle

      await (subscription as any).updateBillingCycle();

      logger.info(`Subscription billing processed: ${subscription._id}`);

      res.status(200).json({
        success: true,
        message: 'Subscription billing processed successfully',
        data: {
          subscription: {
            id: subscription._id,
            status: subscription.status,
            nextBillingDate: subscription.nextBillingDate,
            billingCyclesCompleted: subscription.billingCyclesCompleted
          },
          customer: subscription.customerId ? {
            email: (subscription.customerId as any).email,
            name: `${(subscription.customerId as any).firstName} ${(subscription.customerId as any).lastName}`
          } : null
        }
      });
    } catch (error) {
      logger.error('Process billing error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process billing',
        message: 'An error occurred while processing subscription billing'
      });
    }
  }

  /**
   * Get subscription statistics
   * GET /api/v1/subscriptions/stats
   */
  static async getSubscriptionStats(req: Request, res: Response): Promise<void> {
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

      // Get subscription statistics
      const stats = await Subscription.aggregate([
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

      // Calculate totals
      const totalSubscriptions = stats.reduce((sum, stat) => sum + stat.count, 0);
      const totalAmount = stats.reduce((sum, stat) => sum + stat.totalAmount, 0);
      const activeCount = stats.find(s => s._id === 'active')?.count || 0;
      const trialingCount = stats.find(s => s._id === 'trialing')?.count || 0;
      const cancelledCount = stats.find(s => s._id === 'cancelled')?.count || 0;

      logger.info(`Subscription stats retrieved for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Subscription statistics retrieved successfully',
        data: {
          period,
          summary: {
            totalSubscriptions,
            totalAmount,
            activeSubscriptions: activeCount + trialingCount,
            cancelledSubscriptions: cancelledCount,
            avgSubscriptionValue: totalSubscriptions > 0 ? Math.round(totalAmount / totalSubscriptions) : 0
          },
          byStatus: stats
        }
      });
    } catch (error) {
      logger.error('Get subscription stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve subscription statistics',
        message: 'An error occurred while retrieving subscription statistics'
      });
    }
  }
}

export default SubscriptionController; 