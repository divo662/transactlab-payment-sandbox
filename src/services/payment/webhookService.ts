import crypto from 'crypto';
import { Types, Document } from 'mongoose';
import Webhook, { IWebhook } from '../../models/Webhook';
import Transaction, { ITransaction } from '../../models/Transaction';
import { logger } from '../../utils/helpers/logger';

// Define proper types for webhook objects
type WebhookDocument = IWebhook & Document;
type TransactionDocument = ITransaction & Document;

interface RefundDocument {
  _id: Types.ObjectId;
  merchantId: Types.ObjectId;
  transactionId: Types.ObjectId;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  reason?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface SubscriptionDocument {
  _id: Types.ObjectId;
  merchantId: Types.ObjectId;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  interval: string;
  nextBillingDate: Date;
  customerEmail: string;
  customerName: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  webhookId: string;
  merchantId: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  message?: string;
  error?: string;
  retryCount?: number;
}

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: any;
}

/**
 * Webhook Service
 * Handles webhook delivery for payment events
 */
export class WebhookService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 5000, 15000]; // Delays in milliseconds

  /**
   * Generate webhook signature
   */
  static generateWebhookSignature(payload: string, secret: string): string {
    try {
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      logger.debug('Webhook signature generated');
      
      return signature;
    } catch (error) {
      logger.error('Failed to generate webhook signature', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    signature: string,
    payload: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = this.generateWebhookSignature(payload, secret);
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
      
      logger.debug('Webhook signature verified', { isValid });
      
      return isValid;
    } catch (error) {
      logger.error('Failed to verify webhook signature', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Create webhook payload
   */
  static createWebhookPayload(
    event: string,
    data: any,
    webhookId: Types.ObjectId,
    merchantId: Types.ObjectId
  ): WebhookPayload {
    return {
      event,
      timestamp: new Date().toISOString(),
      data,
      webhookId: webhookId.toString(),
      merchantId: merchantId.toString()
    };
  }

  /**
   * Send webhook delivery
   */
  static async sendWebhookDelivery(
    webhook: WebhookDocument,
    payload: WebhookPayload
  ): Promise<WebhookDeliveryResult> {
    try {
      const payloadString = JSON.stringify(payload);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString).toString(),
        'User-Agent': 'TransactLab-Webhook/1.0'
      };

      // Send webhook
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      logger.info('Webhook delivery completed', {
        webhookId: webhook._id,
        event: payload.event,
        statusCode: response.status,
        url: webhook.url
      });

      return {
        success: response.ok,
        statusCode: response.status,
        response: responseText,
        message: response.ok ? 'Webhook delivered successfully' : 'Webhook delivery failed'
      };

    } catch (error) {
      logger.error('Webhook delivery failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId: webhook._id,
        event: payload.event
      });

      return {
        success: false,
        message: 'Webhook delivery failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send webhook with retry logic
   */
  static async sendWebhookWithRetry(
    webhook: WebhookDocument,
    payload: WebhookPayload
  ): Promise<WebhookDeliveryResult> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.sendWebhookDelivery(webhook, payload);
        
        if (result.success) {
          return result;
        }

        lastError = result.error || result.message;

        // If this is not the last attempt, wait before retrying
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS[attempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        // If this is not the last attempt, wait before retrying
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS[attempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('Webhook delivery failed after all retries', {
      webhookId: webhook._id,
      event: payload.event,
      retryCount: this.MAX_RETRIES
    });

    return {
      success: false,
      message: 'Webhook delivery failed after all retries',
      error: lastError,
      retryCount: this.MAX_RETRIES
    };
  }

  /**
   * Send transaction webhook
   */
  static async sendTransactionWebhook(
    transaction: TransactionDocument,
    event: string
  ): Promise<void> {
    try {
      // Get active webhooks for this merchant
      const webhooks = await Webhook.find({
        merchantId: transaction.merchantId,
        isActive: true,
        events: event
      }).lean();

      if (webhooks.length === 0) {
        logger.debug('No active webhooks found for transaction event', {
          event,
          merchantId: transaction.merchantId
        });
        return;
      }

      // Prepare transaction data for webhook
      const webhookData = {
        id: transaction._id.toString(),
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        metadata: transaction.metadata,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };

      // Send webhook to all matching webhooks
      const deliveryPromises = webhooks.map(async (webhook: any) => {
        const payload = this.createWebhookPayload(
          event,
          webhookData,
          webhook._id,
          transaction.merchantId
        );

        return this.sendWebhookWithRetry(webhook as WebhookDocument, payload);
      });

      const results = await Promise.allSettled(deliveryPromises);

      // Log results
      results.forEach((result, index) => {
        const webhook = webhooks[index];
        if (result.status === 'fulfilled') {
          const deliveryResult = result.value;
          if (deliveryResult.success) {
            logger.info('Transaction webhook delivered successfully', {
              webhookId: webhook._id,
              event,
              transactionId: transaction._id
            });
          } else {
            logger.error('Transaction webhook delivery failed', {
              webhookId: webhook._id,
              event,
              transactionId: transaction._id,
              error: deliveryResult.error
            });
          }
        } else {
          logger.error('Transaction webhook delivery failed with exception', {
            webhookId: webhook._id,
            event,
            transactionId: transaction._id,
            error: result.reason
          });
        }
      });

    } catch (error) {
      logger.error('Failed to send transaction webhook', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: transaction._id,
        event
      });
    }
  }

  /**
   * Send refund webhook
   */
  static async sendRefundWebhook(
    refund: RefundDocument,
    event: string
  ): Promise<void> {
    try {
      // Get active webhooks for this merchant
      const webhooks = await Webhook.find({
        merchantId: refund.merchantId,
        isActive: true,
        events: event
      }).lean();

      if (webhooks.length === 0) {
        logger.debug('No active webhooks found for refund event', {
          event,
          merchantId: refund.merchantId
        });
        return;
      }

      // Prepare refund data for webhook
      const webhookData = {
        id: refund._id.toString(),
        transactionId: refund.transactionId.toString(),
        reference: refund.reference,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        metadata: refund.metadata,
        createdAt: refund.createdAt,
        updatedAt: refund.updatedAt
      };

      // Send webhook to all matching webhooks
      const deliveryPromises = webhooks.map(async (webhook: any) => {
        const payload = this.createWebhookPayload(
          event,
          webhookData,
          webhook._id,
          refund.merchantId
        );

        return this.sendWebhookWithRetry(webhook as WebhookDocument, payload);
      });

      const results = await Promise.allSettled(deliveryPromises);

      // Log results
      results.forEach((result, index) => {
        const webhook = webhooks[index];
        if (result.status === 'fulfilled') {
          const deliveryResult = result.value;
          if (deliveryResult.success) {
            logger.info('Refund webhook delivered successfully', {
              webhookId: webhook._id,
              event,
              refundId: refund._id
            });
          } else {
            logger.error('Refund webhook delivery failed', {
              webhookId: webhook._id,
              event,
              refundId: refund._id,
              error: deliveryResult.error
            });
          }
        } else {
          logger.error('Refund webhook delivery failed with exception', {
            webhookId: webhook._id,
            event,
            refundId: refund._id,
            error: result.reason
          });
        }
      });

    } catch (error) {
      logger.error('Failed to send refund webhook', {
        error: error instanceof Error ? error.message : 'Unknown error',
        refundId: refund._id,
        event
      });
    }
  }

  /**
   * Send subscription webhook
   */
  static async sendSubscriptionWebhook(
    subscription: SubscriptionDocument,
    event: string
  ): Promise<void> {
    try {
      // Get active webhooks for this merchant
      const webhooks = await Webhook.find({
        merchantId: subscription.merchantId,
        isActive: true,
        events: event
      }).lean();

      if (webhooks.length === 0) {
        logger.debug('No active webhooks found for subscription event', {
          event,
          merchantId: subscription.merchantId
        });
        return;
      }

      // Prepare subscription data for webhook
      const webhookData = {
        id: subscription._id.toString(),
        reference: subscription.reference,
        amount: subscription.amount,
        currency: subscription.currency,
        status: subscription.status,
        interval: subscription.interval,
        nextBillingDate: subscription.nextBillingDate,
        customer: {
          email: subscription.customerEmail,
          name: subscription.customerName
        },
        metadata: subscription.metadata,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt
      };

      // Send webhook to all matching webhooks
      const deliveryPromises = webhooks.map(async (webhook: any) => {
        const payload = this.createWebhookPayload(
          event,
          webhookData,
          webhook._id,
          subscription.merchantId
        );

        return this.sendWebhookWithRetry(webhook as WebhookDocument, payload);
      });

      const results = await Promise.allSettled(deliveryPromises);

      // Log results
      results.forEach((result, index) => {
        const webhook = webhooks[index];
        if (result.status === 'fulfilled') {
          const deliveryResult = result.value;
          if (deliveryResult.success) {
            logger.info('Subscription webhook delivered successfully', {
              webhookId: webhook._id,
              event,
              subscriptionId: subscription._id
            });
          } else {
            logger.error('Subscription webhook delivery failed', {
              webhookId: webhook._id,
              event,
              subscriptionId: subscription._id,
              error: deliveryResult.error
            });
          }
        } else {
          logger.error('Subscription webhook delivery failed with exception', {
            webhookId: webhook._id,
            event,
            subscriptionId: subscription._id,
            error: result.reason
          });
        }
      });

    } catch (error) {
      logger.error('Failed to send subscription webhook', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptionId: subscription._id,
        event
      });
    }
  }

  /**
   * Process webhook delivery queue
   */
  static async processWebhookQueue(): Promise<void> {
    try {
      // This would typically process a queue of webhook deliveries
      // For now, we'll just log that the queue processor is running
      logger.debug('Webhook queue processor running');

    } catch (error) {
      logger.error('Failed to process webhook queue', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get webhook delivery statistics
   */
  static async getWebhookDeliveryStats(merchantId: Types.ObjectId): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
  }> {
    try {
      const [totalWebhooks, activeWebhooks] = await Promise.all([
        Webhook.countDocuments({ merchantId }),
        Webhook.countDocuments({ merchantId, isActive: true })
      ]);

      // This would typically query webhook delivery statistics from a separate collection
      // For now, we'll return placeholder data
      const stats = {
        totalWebhooks,
        activeWebhooks,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        successRate: 0
      };

      logger.debug('Webhook delivery statistics retrieved', {
        merchantId,
        stats
      });

      return stats;

    } catch (error) {
      logger.error('Failed to get webhook delivery statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        totalWebhooks: 0,
        activeWebhooks: 0,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        successRate: 0
      };
    }
  }
}

export default WebhookService; 