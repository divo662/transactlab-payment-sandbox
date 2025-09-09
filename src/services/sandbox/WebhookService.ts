import { logger } from '../../utils/helpers/logger';
import SandboxWebhook from '../../models/SandboxWebhook';
import crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
  id: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
  attemptNumber: number;
}

export class WebhookService {
  /**
   * Send webhooks to all registered endpoints for a specific event
   */
  async sendWebhooks(userId: string, event: string, data: any): Promise<void> {
    try {
      // Find all webhooks for this user that support this event
      const webhooks = await SandboxWebhook.find({
        userId,
        events: event,
        isActive: true
      });

      if (webhooks.length === 0) {
        logger.info(`No webhooks found for user ${userId} and event ${event}`);
        return;
      }

      // Create webhook payload
      const payload: WebhookPayload = {
        event,
        data,
        timestamp: Date.now(),
        id: this.generateWebhookId()
      };

      // Send webhooks in parallel
      const deliveryPromises = webhooks.map(webhook => 
        this.deliverWebhook(webhook, payload)
      );

      await Promise.allSettled(deliveryPromises);
      
      logger.info(`Sent ${webhooks.length} webhooks for event ${event} to user ${userId}`);
    } catch (error) {
      logger.error(`Error sending webhooks for user ${userId} and event ${event}:`, error);
    }
  }

  /**
   * Deliver a single webhook with retry logic
   */
  private async deliverWebhook(webhook: any, payload: WebhookPayload): Promise<void> {
    let attemptNumber = 1;
    const maxRetries = webhook.retryConfig.maxRetries;

    while (attemptNumber <= maxRetries) {
      try {
        const result = await this.makeWebhookRequest(webhook, payload);
        
        if (result.success) {
          // Record successful delivery
          webhook.recordSuccessfulDelivery();
          await webhook.save();
          
          logger.info(`Webhook delivered successfully to ${webhook.url} on attempt ${attemptNumber}`);
          return;
        } else {
          // Record failed delivery
          webhook.recordFailedDelivery();
          await webhook.save();
          
          logger.warn(`Webhook delivery failed to ${webhook.url} on attempt ${attemptNumber}: ${result.error}`);
        }
      } catch (error) {
        // Record failed delivery
        webhook.recordFailedDelivery();
        await webhook.save();
        
        logger.error(`Webhook delivery error to ${webhook.url} on attempt ${attemptNumber}:`, error);
      }

      // If this wasn't the last attempt, wait before retrying
      if (attemptNumber < maxRetries) {
        const delay = webhook.calculateRetryDelay(attemptNumber);
        await this.sleep(delay);
      }

      attemptNumber++;
    }

    // All retries exhausted
    logger.error(`Webhook delivery failed after ${maxRetries} attempts to ${webhook.url}`);
  }

  /**
   * Make the actual HTTP request to the webhook endpoint
   */
  private async makeWebhookRequest(webhook: any, payload: WebhookPayload): Promise<WebhookDeliveryResult> {
    try {
      // Generate webhook signature
      const signature = this.generateWebhookSignature(webhook.secret, JSON.stringify(payload));
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'TransactLab-Sandbox/1.0',
        'X-TransactLab-Signature': signature,
        'X-TransactLab-Event': payload.event,
        'X-TransactLab-Id': payload.id,
        'X-TransactLab-Timestamp': payload.timestamp.toString()
      };

      // Make the request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      const responseText = await response.text();

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          response: responseText,
          attemptNumber: 1
        };
      } else {
        return {
          success: false,
          statusCode: response.status,
          response: responseText,
          error: `HTTP ${response.status}: ${response.statusText}`,
          attemptNumber: 1
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        attemptNumber: 1
      };
    }
  }

  /**
   * Generate webhook signature for security
   */
  private generateWebhookSignature(secret: string, payload: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Generate unique webhook ID
   */
  private generateWebhookId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `evt_${timestamp}_${random}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test webhook delivery (for testing purposes)
   */
  async testWebhook(webhookId: string): Promise<WebhookDeliveryResult> {
    try {
      const webhook = await SandboxWebhook.findById(webhookId);
      
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      if (!webhook.isActive) {
        throw new Error('Webhook is not active');
      }

      // Create test payload
      const testPayload: WebhookPayload = {
        event: 'webhook.test',
        data: {
          message: 'This is a test webhook from TransactLab Sandbox',
          timestamp: new Date().toISOString(),
          sandbox: true
        },
        timestamp: Date.now(),
        id: this.generateWebhookId()
      };

      // Send test webhook
      await this.deliverWebhook(webhook, testPayload);

      return {
        success: true,
        statusCode: 200,
        response: 'Test webhook sent successfully',
        attemptNumber: 1
      };
    } catch (error) {
      logger.error(`Error testing webhook ${webhookId}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        attemptNumber: 1
      };
    }
  }

  /**
   * Get webhook delivery statistics for a user
   */
  async getWebhookStats(userId: string): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    deliveryRate: number;
  }> {
    try {
      const webhooks = await SandboxWebhook.findByUserId(userId);
      
      const stats = {
        totalWebhooks: webhooks.length,
        activeWebhooks: webhooks.filter(w => w.isActive).length,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        deliveryRate: 0
      };

      webhooks.forEach(webhook => {
        stats.totalDeliveries += webhook.deliveryStats.totalAttempts;
        stats.successfulDeliveries += webhook.deliveryStats.successfulDeliveries;
        stats.failedDeliveries += webhook.deliveryStats.failedDeliveries;
      });

      if (stats.totalDeliveries > 0) {
        stats.deliveryRate = (stats.successfulDeliveries / stats.totalDeliveries) * 100;
      }

      return stats;
    } catch (error) {
      logger.error(`Error getting webhook stats for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Validate webhook signature (for webhook receivers)
   */
  validateWebhookSignature(signature: string, secret: string, payload: string): boolean {
    try {
      const expectedSignature = this.generateWebhookSignature(secret, payload);
      return signature === expectedSignature;
    } catch (error) {
      logger.error('Error validating webhook signature:', error);
      return false;
    }
  }
}

export default WebhookService;
