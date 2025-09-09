import { Request, Response } from 'express';
import crypto from 'crypto';
import { Webhook, Transaction, Refund, Subscription } from '../../models';
import { logger } from '../../utils/helpers/logger';
import { ENV } from '../../config/environment';

// Request interfaces
interface WebhookDeliveryRequest {
  webhookId: string;
  event: string;
  data: any;
}

interface WebhookTestRequest {
  webhookId: string;
  event: string;
  testData?: any;
}

// Response interfaces
interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class WebhookController {
  /**
   * Deliver webhook event
   * POST /api/v1/webhooks/deliver
   */
  static async deliverWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { webhookId, event, data }: WebhookDeliveryRequest = req.body;

      const webhook = await Webhook.findById(webhookId);
      if (!webhook || !webhook.isActive) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
          message: 'Webhook not found or inactive'
        });
        return;
      }

      // Check if webhook is subscribed to this event
      if (!webhook.events.includes(event)) {
        res.status(400).json({
          success: false,
          error: 'Event not subscribed',
          message: `Webhook is not subscribed to event: ${event}`
        });
        return;
      }

      // Prepare webhook payload
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        webhook_id: webhook._id
      };

      // Generate signature
      const signature = (webhook as any).generateSignature(JSON.stringify(payload), Date.now());

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-TransactLab-Signature': signature,
        'X-TransactLab-Timestamp': Date.now().toString(),
        'User-Agent': 'TransactLab-Webhook/1.0'
      };

      // Send webhook
      const success = await this.sendWebhook(webhook, payload, headers);

      // Update webhook statistics
      await (webhook as any).updateDeliveryStats(success);

      if (success) {
        logger.info(`Webhook delivered successfully: ${webhook.name} - Event: ${event}`);
        res.status(200).json({
          success: true,
          message: 'Webhook delivered successfully'
        });
      } else {
        logger.error(`Webhook delivery failed: ${webhook.name} - Event: ${event}`);
        res.status(500).json({
          success: false,
          error: 'Webhook delivery failed',
          message: 'Failed to deliver webhook'
        });
      }
    } catch (error) {
      logger.error('Deliver webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Webhook delivery failed',
        message: 'An error occurred while delivering the webhook'
      });
    }
  }

  /**
   * Test webhook
   * POST /api/v1/webhooks/test
   */
  static async testWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { webhookId, event, testData }: WebhookTestRequest = req.body;

      const webhook = await Webhook.findById(webhookId);
      if (!webhook || !webhook.isActive) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
          message: 'Webhook not found or inactive'
        });
        return;
      }

      // Generate test data if not provided
      const data = testData || this.generateTestData(event);

      // Prepare webhook payload
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        webhook_id: webhook._id,
        test: true
      };

      // Generate signature
      const signature = (webhook as any).generateSignature(JSON.stringify(payload), Date.now());

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-TransactLab-Signature': signature,
        'X-TransactLab-Timestamp': Date.now().toString(),
        'User-Agent': 'TransactLab-Webhook/1.0'
      };

      // Send test webhook
      const success = await this.sendWebhook(webhook, payload, headers);

      logger.info(`Webhook test completed: ${webhook.name} - Event: ${event} - Success: ${success}`);

      res.status(200).json({
        success: true,
        message: 'Webhook test completed',
        data: {
          success,
          payload,
          headers,
          webhook: {
            id: webhook._id,
            name: webhook.name,
            url: webhook.url,
            successRate: (webhook as any).successRate,
            isHealthy: (webhook as any).isHealthy
          }
        }
      });
    } catch (error) {
      logger.error('Test webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Webhook test failed',
        message: 'An error occurred while testing the webhook'
      });
    }
  }

  /**
   * Get webhook logs
   * GET /api/v1/webhooks/logs
   */
  static async getWebhookLogs(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { webhookId, page = 1, perPage = 20 } = req.query;

      const query: any = { merchantId };
      if (webhookId) query._id = webhookId;

      const webhooks = await Webhook.find(query);
      
      // Get webhook statistics
      const logs = webhooks.map(webhook => ({
        id: webhook._id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        isVerified: webhook.isVerified,
        successRate: (webhook as any).successRate,
        totalAttempts: webhook.deliveryStats.totalAttempts,
        successfulDeliveries: webhook.deliveryStats.successfulDeliveries,
        failedDeliveries: webhook.deliveryStats.failedDeliveries,
        lastDeliveryAt: webhook.deliveryStats.lastDeliveryAt,
        lastFailureAt: webhook.deliveryStats.lastFailureAt,
        isHealthy: (webhook as any).isHealthy
      }));

      res.status(200).json({
        success: true,
        message: 'Webhook logs retrieved successfully',
        data: {
          logs,
          summary: {
            totalWebhooks: webhooks.length,
            activeWebhooks: webhooks.filter(w => w.isActive).length,
            verifiedWebhooks: webhooks.filter(w => w.isVerified).length,
            healthyWebhooks: webhooks.filter(w => (w as any).isHealthy).length
          }
        }
      });
    } catch (error) {
      logger.error('Get webhook logs error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve webhook logs',
        message: 'An error occurred while retrieving webhook logs'
      });
    }
  }

  /**
   * Retry failed webhook
   * POST /api/v1/webhooks/:id/retry
   */
  static async retryWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { event, data } = req.body;

      const webhook = await Webhook.findById(id);
      if (!webhook || !webhook.isActive) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
          message: 'Webhook not found or inactive'
        });
        return;
      }

      // Prepare webhook payload
      const payload = {
        event,
        data,
        timestamp: new Date().toISOString(),
        webhook_id: webhook._id,
        retry: true
      };

      // Generate signature
      const signature = (webhook as any).generateSignature(JSON.stringify(payload), Date.now());

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-TransactLab-Signature': signature,
        'X-TransactLab-Timestamp': Date.now().toString(),
        'User-Agent': 'TransactLab-Webhook/1.0'
      };

      // Send webhook
      const success = await this.sendWebhook(webhook, payload, headers);

      // Update webhook statistics
      await (webhook as any).updateDeliveryStats(success);

      logger.info(`Webhook retry completed: ${webhook.name} - Event: ${event} - Success: ${success}`);

      res.status(200).json({
        success: true,
        message: 'Webhook retry completed',
        data: {
          success,
          webhook: {
            id: webhook._id,
            name: webhook.name,
            url: webhook.url
          }
        }
      });
    } catch (error) {
      logger.error('Retry webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Webhook retry failed',
        message: 'An error occurred while retrying the webhook'
      });
    }
  }

  /**
   * Verify webhook signature
   * POST /api/v1/webhooks/verify
   */
  static async verifyWebhookSignature(req: Request, res: Response): Promise<void> {
    try {
      const { payload, signature, timestamp, webhookId } = req.body;

      const webhook = await Webhook.findById(webhookId);
      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
          message: 'Webhook not found'
        });
        return;
      }

      // Generate expected signature
      const expectedSignature = (webhook as any).generateSignature(JSON.stringify(payload), timestamp);

      // Compare signatures
      const isValid = signature === expectedSignature;

      res.status(200).json({
        success: true,
        message: 'Signature verification completed',
        data: {
          isValid,
          expectedSignature,
          providedSignature: signature
        }
      });
    } catch (error) {
      logger.error('Verify webhook signature error:', error);
      res.status(500).json({
        success: false,
        error: 'Signature verification failed',
        message: 'An error occurred while verifying the signature'
      });
    }
  }

  /**
   * Send webhook to external URL
   */
  private static async sendWebhook(webhook: any, payload: any, headers: any): Promise<boolean> {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(webhook.settings.timeout || ENV.WEBHOOK_TIMEOUT)
      });

      return response.ok;
    } catch (error) {
      logger.error(`Webhook delivery error for ${webhook.name}:`, error);
      return false;
    }
  }

  /**
   * Generate test data for webhook events
   */
  private static generateTestData(event: string): any {
    const baseData = {
      id: `test_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    switch (event) {
      case 'transaction.initialized':
        return {
          ...baseData,
          reference: `TXN_TEST_${Date.now()}`,
          amount: 5000,
          currency: 'NGN',
          customer_email: 'test@example.com',
          status: 'pending',
          payment_method: 'card'
        };

      case 'transaction.successful':
        return {
          ...baseData,
          reference: `TXN_TEST_${Date.now()}`,
          amount: 5000,
          currency: 'NGN',
          customer_email: 'test@example.com',
          status: 'success',
          payment_method: 'card',
          processed_at: new Date().toISOString()
        };

      case 'transaction.failed':
        return {
          ...baseData,
          reference: `TXN_TEST_${Date.now()}`,
          amount: 5000,
          currency: 'NGN',
          customer_email: 'test@example.com',
          status: 'failed',
          payment_method: 'card',
          failure_reason: 'Card declined'
        };

      case 'refund.processed':
        return {
          ...baseData,
          reference: `REF_TEST_${Date.now()}`,
          transaction_reference: `TXN_TEST_${Date.now()}`,
          amount: 2500,
          currency: 'NGN',
          status: 'completed',
          reason: 'Customer request',
          processed_at: new Date().toISOString()
        };

      case 'subscription.created':
        return {
          ...baseData,
          plan_id: 'test_plan',
          plan_name: 'Test Plan',
          amount: 5000,
          currency: 'NGN',
          interval: 'monthly',
          status: 'active',
          customer_email: 'test@example.com'
        };

      default:
        return baseData;
    }
  }
}

export default WebhookController; 