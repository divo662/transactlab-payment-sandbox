import crypto from 'crypto';
import { Types } from 'mongoose';
import Webhook from '../../models/Webhook';
import Merchant from '../../models/Merchant';
import { logger } from '../../utils/helpers/logger';

export interface WebhookConfigData {
  name: string;
  url: string;
  events: string[];
  description?: string;
  isActive?: boolean;
  secret?: string;
  headers?: Record<string, string>;
}

export interface WebhookResult {
  success: boolean;
  webhook?: any;
  message?: string;
  error?: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  response?: string;
  message?: string;
  error?: string;
}

/**
 * Webhook Configuration Service
 * Handles webhook setup, management, and delivery
 */
export class WebhookConfigService {
  /**
   * Generate webhook secret
   */
  static generateWebhookSecret(): string {
    try {
      const secret = crypto.randomBytes(32).toString('hex');
      
      logger.debug('Webhook secret generated');
      
      return secret;
    } catch (error) {
      logger.error('Failed to generate webhook secret', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create webhook configuration
   */
  static async createWebhookConfig(
    merchantId: Types.ObjectId,
    data: WebhookConfigData
  ): Promise<WebhookResult> {
    try {
      // Verify merchant exists and is active
      const merchant = await Merchant.findById(merchantId);
      if (!merchant) {
        return {
          success: false,
          message: 'Merchant not found'
        };
      }

      if (!merchant.isActive) {
        return {
          success: false,
          message: 'Merchant account is not active'
        };
      }

      // Generate webhook secret if not provided
      const secret = data.secret || this.generateWebhookSecret();

      // Create webhook configuration
      const webhook = new Webhook({
        merchantId,
        name: data.name,
        url: data.url,
        events: data.events,
        description: data.description,
        secret,
        headers: data.headers || {},
        isActive: data.isActive !== false, // Default to true
        status: 'active'
      });

      await webhook.save();

      logger.info('Webhook configuration created successfully', {
        webhookId: webhook._id,
        merchantId,
        name: data.name,
        url: data.url
      });

      return {
        success: true,
        webhook: webhook.toObject(),
        message: 'Webhook configuration created successfully'
      };

    } catch (error) {
      logger.error('Failed to create webhook configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        success: false,
        message: 'Failed to create webhook configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get webhook configuration by ID
   */
  static async getWebhookConfig(webhookId: Types.ObjectId): Promise<WebhookResult> {
    try {
      const webhook = await Webhook.findById(webhookId);
      if (!webhook) {
        return {
          success: false,
          message: 'Webhook configuration not found'
        };
      }

      return {
        success: true,
        webhook: webhook.toObject(),
        message: 'Webhook configuration retrieved successfully'
      };

    } catch (error) {
      logger.error('Failed to get webhook configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId
      });

      return {
        success: false,
        message: 'Failed to get webhook configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get webhook configurations for merchant
   */
  static async getMerchantWebhooks(
    merchantId: Types.ObjectId,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    webhooks: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [webhooks, total] = await Promise.all([
        Webhook.find({ merchantId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Webhook.countDocuments({ merchantId })
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.debug('Webhook configurations retrieved for merchant', {
        merchantId,
        page,
        limit,
        total,
        totalPages
      });

      return {
        webhooks,
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('Failed to get merchant webhooks', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });

      return {
        webhooks: [],
        total: 0,
        page,
        totalPages: 0
      };
    }
  }

  /**
   * Update webhook configuration
   */
  static async updateWebhookConfig(
    webhookId: Types.ObjectId,
    updateData: Partial<WebhookConfigData>
  ): Promise<WebhookResult> {
    try {
      const webhook = await Webhook.findByIdAndUpdate(
        webhookId,
        {
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!webhook) {
        return {
          success: false,
          message: 'Webhook configuration not found'
        };
      }

      logger.info('Webhook configuration updated successfully', {
        webhookId: webhook._id,
        merchantId: webhook.merchantId
      });

      return {
        success: true,
        webhook: webhook.toObject(),
        message: 'Webhook configuration updated successfully'
      };

    } catch (error) {
      logger.error('Failed to update webhook configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId
      });

      return {
        success: false,
        message: 'Failed to update webhook configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Deactivate webhook configuration
   */
  static async deactivateWebhook(webhookId: Types.ObjectId): Promise<WebhookResult> {
    try {
      const webhook = await Webhook.findByIdAndUpdate(
        webhookId,
        {
          isActive: false,
          status: 'inactive',
          deactivatedAt: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!webhook) {
        return {
          success: false,
          message: 'Webhook configuration not found'
        };
      }

      logger.info('Webhook configuration deactivated', {
        webhookId: webhook._id,
        merchantId: webhook.merchantId
      });

      return {
        success: true,
        webhook: webhook.toObject(),
        message: 'Webhook configuration deactivated successfully'
      };

    } catch (error) {
      logger.error('Failed to deactivate webhook configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId
      });

      return {
        success: false,
        message: 'Failed to deactivate webhook configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reactivate webhook configuration
   */
  static async reactivateWebhook(webhookId: Types.ObjectId): Promise<WebhookResult> {
    try {
      const webhook = await Webhook.findByIdAndUpdate(
        webhookId,
        {
          isActive: true,
          status: 'active',
          deactivatedAt: undefined,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!webhook) {
        return {
          success: false,
          message: 'Webhook configuration not found'
        };
      }

      logger.info('Webhook configuration reactivated', {
        webhookId: webhook._id,
        merchantId: webhook.merchantId
      });

      return {
        success: true,
        webhook: webhook.toObject(),
        message: 'Webhook configuration reactivated successfully'
      };

    } catch (error) {
      logger.error('Failed to reactivate webhook configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId
      });

      return {
        success: false,
        message: 'Failed to reactivate webhook configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete webhook configuration
   */
  static async deleteWebhookConfig(webhookId: Types.ObjectId): Promise<WebhookResult> {
    try {
      const webhook = await Webhook.findByIdAndDelete(webhookId);
      if (!webhook) {
        return {
          success: false,
          message: 'Webhook configuration not found'
        };
      }

      logger.info('Webhook configuration deleted', {
        webhookId: webhook._id,
        merchantId: webhook.merchantId
      });

      return {
        success: true,
        message: 'Webhook configuration deleted successfully'
      };

    } catch (error) {
      logger.error('Failed to delete webhook configuration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId
      });

      return {
        success: false,
        message: 'Failed to delete webhook configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Regenerate webhook secret
   */
  static async regenerateWebhookSecret(webhookId: Types.ObjectId): Promise<WebhookResult> {
    try {
      const webhook = await Webhook.findById(webhookId);
      if (!webhook) {
        return {
          success: false,
          message: 'Webhook configuration not found'
        };
      }

      // Generate new secret
      const newSecret = this.generateWebhookSecret();

      // Update webhook with new secret
      webhook.secret = newSecret;
      webhook.updatedAt = new Date();
      await webhook.save();

      logger.info('Webhook secret regenerated', {
        webhookId: webhook._id,
        merchantId: webhook.merchantId
      });

      return {
        success: true,
        webhook: webhook.toObject(),
        message: 'Webhook secret regenerated successfully'
      };

    } catch (error) {
      logger.error('Failed to regenerate webhook secret', {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId
      });

      return {
        success: false,
        message: 'Failed to regenerate webhook secret',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test webhook delivery
   */
  static async testWebhookDelivery(webhookId: Types.ObjectId): Promise<WebhookDeliveryResult> {
    try {
      const webhook = await Webhook.findById(webhookId);
      if (!webhook) {
        return {
          success: false,
          message: 'Webhook configuration not found'
        };
      }

      if (!webhook.isActive) {
        return {
          success: false,
          message: 'Webhook configuration is not active'
        };
      }

      // Create test payload
      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook delivery',
          webhookId: webhook._id.toString(),
          merchantId: webhook.merchantId.toString()
        }
      };

      // Generate signature
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(testPayload))
        .digest('hex');

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-TransactLab-Signature': signature,
        'X-TransactLab-Timestamp': new Date().toISOString()
      };

      // Send test webhook
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload)
      });

      const responseText = await response.text();

      logger.info('Webhook test delivery completed', {
        webhookId: webhook._id,
        statusCode: response.status,
        url: webhook.url
      });

      return {
        success: response.ok,
        statusCode: response.status,
        response: responseText,
        message: response.ok ? 'Test webhook delivered successfully' : 'Test webhook delivery failed'
      };

    } catch (error) {
      logger.error('Failed to test webhook delivery', {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId
      });

      return {
        success: false,
        message: 'Failed to test webhook delivery',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get webhook delivery history
   */
  static async getWebhookDeliveryHistory(
    webhookId: Types.ObjectId,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    deliveries: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      // This would typically query a separate webhook delivery history collection
      // For now, we'll return a placeholder structure
      const deliveries: any[] = [];
      const total = 0;

      const totalPages = Math.ceil(total / limit);

      logger.debug('Webhook delivery history retrieved', {
        webhookId,
        page,
        limit,
        total,
        totalPages
      });

      return {
        deliveries,
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('Failed to get webhook delivery history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId
      });

      return {
        deliveries: [],
        total: 0,
        page,
        totalPages: 0
      };
    }
  }

  /**
   * Get webhook statistics
   */
  static async getWebhookStats(webhookId: Types.ObjectId): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
    averageResponseTime: number;
  }> {
    try {
      // This would typically query webhook delivery statistics
      // For now, we'll return placeholder data
      const stats = {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        successRate: 0,
        averageResponseTime: 0
      };

      logger.debug('Webhook statistics retrieved', {
        webhookId,
        stats
      });

      return stats;

    } catch (error) {
      logger.error('Failed to get webhook statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        webhookId
      });

      return {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        successRate: 0,
        averageResponseTime: 0
      };
    }
  }

  /**
   * Validate webhook URL
   */
  static validateWebhookUrl(url: string): {
    isValid: boolean;
    message?: string;
  } {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a valid HTTP/HTTPS URL
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          isValid: false,
          message: 'Webhook URL must use HTTP or HTTPS protocol'
        };
      }

      // Check if it's not a localhost URL (for security)
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        return {
          isValid: false,
          message: 'Webhook URL cannot be localhost'
        };
      }

      return {
        isValid: true
      };

    } catch (error) {
      return {
        isValid: false,
        message: 'Invalid webhook URL format'
      };
    }
  }
}

export default WebhookConfigService; 