import { Types } from 'mongoose';
import Subscription from '../../models/Subscription';
import Transaction from '../../models/Transaction';
import Merchant from '../../models/Merchant';
import User from '../../models/User';
import { logger } from '../../utils/helpers/logger';
import { redisClient } from '../../config/redis';

// Helper function to generate reference
function generateReference(prefix: string = 'SUB'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Subscription status constants
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CANCELLED: 'cancelled',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
  TRIALING: 'trialing',
  PAUSED: 'paused'
} as const;

// Billing intervals constants
const BILLING_INTERVALS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
} as const;

export interface CreateSubscriptionData {
  merchantId: string;
  customerId: string;
  planId: string;
  amount: number;
  currency: string;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  intervalCount?: number;
  trialDays?: number;
  metadata?: any;
}

export interface SubscriptionResult {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}

export class SubscriptionService {
  private webhookService: any; // Placeholder, will be replaced
  private transactionService: any; // Placeholder, will be replaced

  constructor() {
    // Initialize services - these will be replaced with actual service instances
    this.webhookService = {
      sendWebhook: async (event: string, data: any, merchantId: string) => {
        logger.info(`Simulating webhook for event: ${event}`, { merchantId });
        return { success: true, data: { event, data, merchantId } };
      }
    };
    this.transactionService = {
      initializeTransaction: async (data: any, merchantId: string) => {
        logger.info('Simulating transaction initialization', { merchantId });
        return { success: true, data: { reference: generateReference('TXN') } };
      },
      processPayment: async (reference: string, data: any) => {
        logger.info('Simulating transaction payment processing', { reference });
        return { success: true, data: { status: 'success' } };
      }
    };
  }

  /**
   * Create a new subscription
   */
  async createSubscription(data: CreateSubscriptionData): Promise<SubscriptionResult> {
    try {
      // Validate merchant
      const merchant = await Merchant.findById(data.merchantId);
      if (!merchant || !merchant.isActive) {
        return {
          success: false,
          error: 'Merchant not found or inactive',
          code: 'MERCHANT_NOT_FOUND'
        };
      }

      // Validate customer
      const customer = await User.findById(data.customerId);
      if (!customer || !customer.isActive) {
        return {
          success: false,
          error: 'Customer not found or inactive',
          code: 'CUSTOMER_NOT_FOUND'
        };
      }

      // Validate interval
      if (!Object.values(BILLING_INTERVALS).includes(data.interval)) {
        return {
          success: false,
          error: 'Invalid billing interval',
          code: 'INVALID_INTERVAL'
        };
      }

      // Calculate billing dates
      const now = new Date();
      const trialEnd = data.trialDays ? new Date(now.getTime() + data.trialDays * 24 * 60 * 60 * 1000) : null;
      const nextBillingDate = this.calculateNextBillingDate(now, data.interval, data.intervalCount || 1);

      // Create subscription
      const subscription = new Subscription({
        merchantId: data.merchantId,
        customerId: data.customerId,
        planId: data.planId,
        amount: data.amount,
        currency: data.currency,
        interval: data.interval,
        intervalCount: data.intervalCount || 1,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        trialEnd,
        nextBillingDate,
        metadata: data.metadata,
        currentPeriodStart: now,
        currentPeriodEnd: nextBillingDate,
        billingCyclesCompleted: 0
      });

      await subscription.save();

      // Cache subscription
      await redisClient.set(`subscription:${subscription._id}`, JSON.stringify(subscription), 3600);

      // Send webhook notification
      await this.webhookService.sendWebhook('subscription.created', {
        subscription_id: subscription._id,
        merchant_id: data.merchantId,
        customer_id: data.customerId,
        plan_id: data.planId,
        amount: subscription.amount,
        currency: subscription.currency,
        interval: subscription.interval,
        status: subscription.status,
        trial_end: subscription.trialEnd,
        next_billing_date: subscription.nextBillingDate
      }, data.merchantId);

      logger.info('Subscription created', {
        subscriptionId: subscription._id,
        merchantId: data.merchantId,
        customerId: data.customerId,
        amount: subscription.amount,
        interval: subscription.interval
      });

      return {
        success: true,
        data: {
          id: subscription._id,
          merchant_id: subscription.merchantId,
          customer_id: subscription.customerId,
          plan_id: subscription.planId,
          amount: subscription.amount,
          currency: subscription.currency,
          interval: subscription.interval,
          status: subscription.status,
          trial_end: subscription.trialEnd,
          next_billing_date: subscription.nextBillingDate,
          created_at: subscription.createdAt
        }
      };
    } catch (error) {
      logger.error('Subscription creation error:', error);
      return {
        success: false,
        error: 'Failed to create subscription',
        code: 'CREATION_ERROR'
      };
    }
  }

  /**
   * Process subscription billing
   */
  async processBilling(subscriptionId: string): Promise<SubscriptionResult> {
    try {
      const subscription = await Subscription.findById(subscriptionId).populate('customerId');
      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        };
      }

      if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
        return {
          success: false,
          error: 'Subscription is not active',
          code: 'SUBSCRIPTION_NOT_ACTIVE'
        };
      }

      // Check if it's time to bill
      const now = new Date();
      if (subscription.nextBillingDate > now) {
        return {
          success: false,
          error: 'Billing date not reached',
          code: 'BILLING_DATE_NOT_REACHED'
        };
      }

      // Check if in trial period
      if (subscription.trialEnd && subscription.trialEnd > now) {
        // Update next billing date without charging
        subscription.nextBillingDate = this.calculateNextBillingDate(
          subscription.nextBillingDate,
          subscription.interval,
          subscription.intervalCount
        );
        await subscription.save();
        return {
          success: true,
          data: {
            message: 'Subscription in trial period - no charge',
            next_billing_date: subscription.nextBillingDate
          }
        };
      }

      // Create transaction for billing
      const transactionResult = await this.transactionService.initializeTransaction({
        amount: subscription.amount,
        currency: subscription.currency,
        email: (subscription.customerId as any)?.email || 'customer@example.com',
        reference: generateReference('SUB'),
        metadata: {
          subscription_id: subscription._id,
          billing_cycle: subscription.billingCyclesCompleted + 1
        }
      }, subscription.merchantId.toString());

      if (!transactionResult.success) {
        // Handle failed transaction
        subscription.status = SUBSCRIPTION_STATUS.PAST_DUE;
        (subscription as any).lastBillingAttempt = now;
        await subscription.save();

        // Send webhook notification
        await this.webhookService.sendWebhook('subscription.billing_failed', {
          subscription_id: subscription._id,
          transaction_error: transactionResult.error,
          next_billing_date: subscription.nextBillingDate
        }, subscription.merchantId.toString());

        return {
          success: false,
          error: 'Failed to process billing transaction',
          code: 'BILLING_FAILED'
        };
      }

      // Process the transaction
      const processResult = await this.transactionService.processPayment(
        transactionResult.data.reference,
        {}
      );

      if (processResult.success && processResult.data.status === 'success') {
        // Update subscription
        subscription.billingCyclesCompleted += 1;
        (subscription as any).lastBilledAt = now;
        subscription.nextBillingDate = this.calculateNextBillingDate(
          now,
          subscription.interval,
          subscription.intervalCount
        );
        await subscription.save();

        // Send webhook notification
        await this.webhookService.sendWebhook('subscription.billed', {
          subscription_id: subscription._id,
          merchant_id: subscription.merchantId,
          customer_id: subscription.customerId,
          amount: subscription.amount,
          currency: subscription.currency,
          billing_cycle: subscription.billingCyclesCompleted,
          next_billing_date: subscription.nextBillingDate
        }, subscription.merchantId.toString());

        // Send subscription billing success email to customer
        try {
          const EmailService = (await import('../notification/emailService')).default;
          const merchant = await Merchant.findById(subscription.merchantId);
          
          await EmailService.sendSubscriptionBilledEmail((subscription.customerId as any)?.email || '', {
            customerName: (subscription.customerId as any)?.firstName || 'Valued Customer',
            amount: subscription.amount,
            currency: subscription.currency,
            subscriptionId: subscription._id.toString(),
            billingCycle: subscription.billingCyclesCompleted,
            nextBillingDate: subscription.nextBillingDate.toLocaleDateString(),
            businessName: merchant?.businessName || 'TransactLab'
          });
          
          logger.info('Subscription billing email sent', {
            subscriptionId: subscription._id,
            customerEmail: (subscription.customerId as any)?.email
          });
        } catch (emailError) {
          logger.error('Failed to send subscription billing email:', emailError);
          // Don't fail billing if email fails
        }

        logger.info('Subscription billing successful', {
          subscriptionId: subscription._id,
          transactionReference: transactionResult.data.reference,
          amount: subscription.amount,
          billingCycle: subscription.billingCyclesCompleted
        });
      } else {
        // Billing failed
        (subscription as any).lastBillingAttempt = now;
        await subscription.save();

        // Send webhook notification
        await this.webhookService.sendWebhook('subscription.billing_failed', {
          subscription_id: subscription._id,
          merchant_id: subscription.merchantId,
          customer_id: subscription.customerId,
          amount: subscription.amount,
          currency: subscription.currency,
          error: processResult.error,
          billing_cycle: subscription.billingCyclesCompleted
        }, subscription.merchantId.toString());

        logger.warn('Subscription billing failed', {
          subscriptionId: subscription._id,
          transactionReference: transactionResult.data.reference,
          error: processResult.error
        });
      }

      return {
        success: true,
        data: {
          subscription_id: subscription._id,
          transaction_reference: transactionResult.data.reference,
          status: subscription.status,
          next_billing_date: subscription.nextBillingDate,
          billing_cycle: subscription.billingCyclesCompleted
        }
      };
    } catch (error) {
      logger.error('Subscription billing error:', error);
      return {
        success: false,
        error: 'Failed to process subscription billing',
        code: 'BILLING_ERROR'
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<SubscriptionResult> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        };
      }

      if (subscription.status === SUBSCRIPTION_STATUS.CANCELLED) {
        return {
          success: false,
          error: 'Subscription already cancelled',
          code: 'ALREADY_CANCELLED'
        };
      }

      subscription.status = SUBSCRIPTION_STATUS.CANCELLED;
      subscription.cancelledAt = new Date();
      (subscription as any).cancellationReason = reason || 'Cancelled by customer';

      await subscription.save();

      // Clear cache
      await redisClient.del(`subscription:${subscriptionId}`);

      // Send cancellation webhook
      await this.webhookService.sendWebhook('subscription.cancelled', {
        subscription_id: subscription._id,
        merchant_id: subscription.merchantId,
        customer_id: subscription.customerId,
        reason: (subscription as any).cancellationReason,
        cancelled_at: subscription.cancelledAt
      }, subscription.merchantId.toString());

      // Send subscription cancellation email to customer
      try {
        const EmailService = (await import('../notification/emailService')).default;
        const merchant = await Merchant.findById(subscription.merchantId);
        const customer = await User.findById(subscription.customerId);
        
        await EmailService.sendSubscriptionCancelledEmail(customer?.email || '', {
          customerName: customer?.firstName || 'Valued Customer',
          subscriptionId: subscription._id.toString(),
          cancelledAt: subscription.cancelledAt?.toLocaleDateString() || new Date().toLocaleDateString(),
          reason: (subscription as any).cancellationReason || 'Cancelled by customer',
          businessName: merchant?.businessName || 'TransactLab'
        });
        
        logger.info('Subscription cancellation email sent', {
          subscriptionId: subscription._id,
          customerEmail: customer?.email
        });
      } catch (emailError) {
        logger.error('Failed to send subscription cancellation email:', emailError);
        // Don't fail cancellation if email fails
      }

      logger.info('Subscription cancelled', {
        subscriptionId: subscription._id,
        reason: (subscription as any).cancellationReason
      });

      return {
        success: true,
        data: {
          subscription_id: subscription._id,
          status: subscription.status,
          cancelled_at: subscription.cancelledAt,
          reason: (subscription as any).cancellationReason
        }
      };
    } catch (error) {
      logger.error('Subscription cancellation error:', error);
      return {
        success: false,
        error: 'Failed to cancel subscription',
        code: 'CANCELLATION_ERROR'
      };
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        };
      }

      if (subscription.status !== SUBSCRIPTION_STATUS.CANCELLED) {
        return {
          success: false,
          error: 'Subscription is not cancelled',
          code: 'NOT_CANCELLED'
        };
      }

      subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
      (subscription as any).reactivatedAt = new Date();
      subscription.cancelledAt = null;
      (subscription as any).cancellationReason = null;

      await subscription.save();

      // Send reactivation webhook
      await this.webhookService.sendWebhook('subscription.reactivated', {
        subscription_id: subscription._id,
        merchant_id: subscription.merchantId,
        customer_id: subscription.customerId,
        reactivated_at: (subscription as any).reactivatedAt
      }, subscription.merchantId.toString());

      logger.info('Subscription reactivated', {
        subscriptionId: subscription._id
      });

      return {
        success: true,
        data: {
          subscription_id: subscription._id,
          status: subscription.status,
          reactivated_at: (subscription as any).reactivatedAt
        }
      };
    } catch (error) {
      logger.error('Subscription reactivation error:', error);
      return {
        success: false,
        error: 'Failed to reactivate subscription',
        code: 'REACTIVATION_ERROR'
      };
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId: string, reason?: string): Promise<SubscriptionResult> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        };
      }

      if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
        return {
          success: false,
          error: 'Subscription is not active',
          code: 'NOT_ACTIVE'
        };
      }

      subscription.status = SUBSCRIPTION_STATUS.PAUSED;
      subscription.pausedAt = new Date();
      subscription.pauseReason = reason || 'Paused by customer';

      await subscription.save();

      // Send pause webhook
      await this.webhookService.sendWebhook('subscription.paused', {
        subscription_id: subscription._id,
        merchant_id: subscription.merchantId,
        customer_id: subscription.customerId,
        reason: subscription.pauseReason,
        paused_at: subscription.pausedAt
      }, subscription.merchantId.toString());

      logger.info('Subscription paused', {
        subscriptionId: subscription._id,
        reason: subscription.pauseReason
      });

      return {
        success: true,
        data: {
          subscription_id: subscription._id,
          status: subscription.status,
          paused_at: subscription.pausedAt,
          reason: subscription.pauseReason
        }
      };
    } catch (error) {
      logger.error('Subscription pause error:', error);
      return {
        success: false,
        error: 'Failed to pause subscription',
        code: 'PAUSE_ERROR'
      };
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<SubscriptionResult> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        };
      }

      if (subscription.status !== SUBSCRIPTION_STATUS.PAUSED) {
        return {
          success: false,
          error: 'Subscription is not paused',
          code: 'NOT_PAUSED'
        };
      }

      subscription.status = SUBSCRIPTION_STATUS.ACTIVE;
      subscription.resumedAt = new Date();
      subscription.pausedAt = null;
      subscription.pauseReason = null;

      await subscription.save();

      // Send resume webhook
      await this.webhookService.sendWebhook('subscription.resumed', {
        subscription_id: subscription._id,
        merchant_id: subscription.merchantId,
        customer_id: subscription.customerId,
        resumed_at: subscription.resumedAt
      }, subscription.merchantId.toString());

      logger.info('Subscription resumed', {
        subscriptionId: subscription._id
      });

      return {
        success: true,
        data: {
          subscription_id: subscription._id,
          status: subscription.status,
          resumed_at: subscription.resumedAt
        }
      };
    } catch (error) {
      logger.error('Subscription resume error:', error);
      return {
        success: false,
        error: 'Failed to resume subscription',
        code: 'RESUME_ERROR'
      };
    }
  }

  /**
   * Update subscription amount
   */
  async updateSubscriptionAmount(subscriptionId: string, newAmount: number): Promise<SubscriptionResult> {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        };
      }

      if (subscription.status !== SUBSCRIPTION_STATUS.ACTIVE) {
        return {
          success: false,
          error: 'Subscription is not active',
          code: 'NOT_ACTIVE'
        };
      }

      const oldAmount = subscription.amount;
      subscription.amount = newAmount;
      subscription.updatedAt = new Date();

      await subscription.save();

      // Send update webhook
      await this.webhookService.sendWebhook('subscription.updated', {
        subscription_id: subscription._id,
        merchant_id: subscription.merchantId,
        customer_id: subscription.customerId,
        old_amount: oldAmount,
        new_amount: newAmount,
        currency: subscription.currency,
        updated_at: subscription.updatedAt
      }, subscription.merchantId.toString());

      logger.info('Subscription amount updated', {
        subscriptionId: subscription._id,
        oldAmount,
        newAmount
      });

      return {
        success: true,
        data: {
          subscription_id: subscription._id,
          old_amount: oldAmount,
          new_amount: newAmount,
          updated_at: subscription.updatedAt
        }
      };
    } catch (error) {
      logger.error('Subscription amount update error:', error);
      return {
        success: false,
        error: 'Failed to update subscription amount',
        code: 'UPDATE_ERROR'
      };
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(subscriptionId: string): Promise<SubscriptionResult> {
    try {
      const subscription = await Subscription.findById(subscriptionId)
        .populate('customerId')
        .populate('merchantId');

      if (!subscription) {
        return {
          success: false,
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        };
      }

      return {
        success: true,
        data: subscription
      };
    } catch (error) {
      logger.error('Get subscription error:', error);
      return {
        success: false,
        error: 'Failed to get subscription',
        code: 'GET_ERROR'
      };
    }
  }

  /**
   * List subscriptions with pagination and filters
   */
  async listSubscriptions(merchantId: string, filters: any = {}): Promise<SubscriptionResult> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        interval,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const query: any = { merchantId };

      if (status) query.status = status;
      if (interval) query.interval = interval;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [subscriptions, total] = await Promise.all([
        Subscription.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('customerId')
          .populate('merchantId'),
        Subscription.countDocuments(query)
      ]);

      return {
        success: true,
        data: {
          subscriptions,
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
      logger.error('List subscriptions error:', error);
      return {
        success: false,
        error: 'Failed to list subscriptions',
        code: 'LIST_ERROR'
      };
    }
  }

  /**
   * Calculate next billing date
   */
  private calculateNextBillingDate(currentDate: Date, interval: 'daily' | 'weekly' | 'monthly' | 'yearly', intervalCount: number): Date {
    const nextDate = new Date(currentDate);
    
    switch (interval) {
      case BILLING_INTERVALS.DAILY:
        nextDate.setDate(nextDate.getDate() + intervalCount);
        break;
      case BILLING_INTERVALS.WEEKLY:
        nextDate.setDate(nextDate.getDate() + (intervalCount * 7));
        break;
      case BILLING_INTERVALS.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + intervalCount);
        break;
      case BILLING_INTERVALS.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + intervalCount);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + intervalCount);
    }
    
    return nextDate;
  }
}

export default SubscriptionService; 