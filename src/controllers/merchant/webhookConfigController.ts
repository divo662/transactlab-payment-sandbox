import { Request, Response } from 'express';
import { Webhook, Merchant } from '../../models';
import { logger } from '../../utils/helpers/logger';

// Request interfaces
interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
  retryConfig?: {
    maxRetries?: number;
    retryDelay?: number;
    backoffMultiplier?: number;
  };
  settings?: {
    includeHeaders?: boolean;
    includeBody?: boolean;
    timeout?: number;
    followRedirects?: boolean;
    verifySsl?: boolean;
  };
}

interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
  retryConfig?: {
    maxRetries?: number;
    retryDelay?: number;
    backoffMultiplier?: number;
  };
  settings?: {
    includeHeaders?: boolean;
    includeBody?: boolean;
    timeout?: number;
    followRedirects?: boolean;
    verifySsl?: boolean;
  };
}

// Response interfaces
interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class WebhookConfigController {
  /**
   * Create new webhook
   * POST /api/v1/merchant/webhooks
   */
  static async createWebhook(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        name,
        url,
        events,
        retryConfig,
        settings
      }: CreateWebhookRequest = req.body;

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

      // Validate URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        res.status(400).json({
          success: false,
          error: 'Invalid URL',
          message: 'Webhook URL must start with http:// or https://'
        });
        return;
      }

      // Validate events
      const validEvents = [
        'transaction.initialized',
        'transaction.successful',
        'transaction.failed',
        'transaction.cancelled',
        'transaction.expired',
        'refund.processed',
        'refund.failed',
        'chargeback.received',
        'chargeback.resolved',
        'subscription.created',
        'subscription.updated',
        'subscription.cancelled',
        'subscription.payment_successful',
        'subscription.payment_failed'
      ];

      const invalidEvents = events.filter(e => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid events',
          message: `Invalid events: ${invalidEvents.join(', ')}`
        });
        return;
      }

      // Create webhook
      const webhook = new Webhook({
        merchantId,
        name,
        url,
        events,
        retryConfig,
        settings
      });

      await webhook.save();

      logger.info(`Webhook created: ${webhook.name} for merchant: ${merchantId}`);

      res.status(201).json({
        success: true,
        message: 'Webhook created successfully',
        data: {
          webhook: {
            id: webhook._id,
            name: webhook.name,
            url: webhook.url,
            events: webhook.events,
            isActive: webhook.isActive,
            isVerified: webhook.isVerified,
            retryConfig: webhook.retryConfig,
            settings: webhook.settings,
            deliveryStats: webhook.deliveryStats,
            createdAt: webhook.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Create webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Webhook creation failed',
        message: 'An error occurred while creating the webhook'
      });
    }
  }

  /**
   * List webhooks
   * GET /api/v1/merchant/webhooks
   */
  static async listWebhooks(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { isActive, isVerified } = req.query;

      // Build query
      const query: any = { merchantId };
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (isVerified !== undefined) query.isVerified = isVerified === 'true';

      const webhooks = await Webhook.find(query).sort({ createdAt: -1 });

      logger.info(`Webhooks listed for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Webhooks retrieved successfully',
        data: {
          webhooks: webhooks.map(w => ({
            id: w._id,
            name: w.name,
            url: w.url,
            events: w.events,
            isActive: w.isActive,
            isVerified: w.isVerified,
            successRate: (w as any).successRate,
            isHealthy: (w as any).isHealthy,
            deliveryStats: w.deliveryStats,
            createdAt: w.createdAt
          }))
        }
      });
    } catch (error) {
      logger.error('List webhooks error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve webhooks',
        message: 'An error occurred while retrieving webhooks'
      });
    }
  }

  /**
   * Get webhook by ID
   * GET /api/v1/merchant/webhooks/:id
   */
  static async getWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const webhook = await Webhook.findOne({
        _id: id,
        merchantId
      });

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
          message: 'Webhook not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Webhook retrieved successfully',
        data: {
          webhook: {
            id: webhook._id,
            name: webhook.name,
            url: webhook.url,
            events: webhook.events,
            isActive: webhook.isActive,
            isVerified: webhook.isVerified,
            retryConfig: webhook.retryConfig,
            settings: webhook.settings,
            deliveryStats: webhook.deliveryStats,
            successRate: (webhook as any).successRate,
            isHealthy: (webhook as any).isHealthy,
            createdAt: webhook.createdAt
          }
        }
      });
    } catch (error) {
      logger.error('Get webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve webhook',
        message: 'An error occurred while retrieving the webhook'
      });
    }
  }

  /**
   * Update webhook
   * PUT /api/v1/merchant/webhooks/:id
   */
  static async updateWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const {
        name,
        url,
        events,
        isActive,
        retryConfig,
        settings
      }: UpdateWebhookRequest = req.body;

      const webhook = await Webhook.findOne({
        _id: id,
        merchantId
      });

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
          message: 'Webhook not found'
        });
        return;
      }

      // Update fields
      if (name) webhook.name = name;
      if (url) webhook.url = url;
      if (events) webhook.events = events;
      if (isActive !== undefined) webhook.isActive = isActive;
      if (retryConfig) {
        if (retryConfig.maxRetries !== undefined) webhook.retryConfig.maxRetries = retryConfig.maxRetries;
        if (retryConfig.retryDelay !== undefined) webhook.retryConfig.retryDelay = retryConfig.retryDelay;
        if (retryConfig.backoffMultiplier !== undefined) webhook.retryConfig.backoffMultiplier = retryConfig.backoffMultiplier;
      }
      if (settings) {
        if (settings.includeHeaders !== undefined) webhook.settings.includeHeaders = settings.includeHeaders;
        if (settings.includeBody !== undefined) webhook.settings.includeBody = settings.includeBody;
        if (settings.timeout !== undefined) webhook.settings.timeout = settings.timeout;
        if (settings.followRedirects !== undefined) webhook.settings.followRedirects = settings.followRedirects;
        if (settings.verifySsl !== undefined) webhook.settings.verifySsl = settings.verifySsl;
      }

      await webhook.save();

      logger.info(`Webhook updated: ${webhook.name}`);

      res.status(200).json({
        success: true,
        message: 'Webhook updated successfully',
        data: {
          webhook: {
            id: webhook._id,
            name: webhook.name,
            url: webhook.url,
            events: webhook.events,
            isActive: webhook.isActive,
            retryConfig: webhook.retryConfig,
            settings: webhook.settings
          }
        }
      });
    } catch (error) {
      logger.error('Update webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update webhook',
        message: 'An error occurred while updating the webhook'
      });
    }
  }

  /**
   * Delete webhook
   * DELETE /api/v1/merchant/webhooks/:id
   */
  static async deleteWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const webhook = await Webhook.findOne({
        _id: id,
        merchantId
      });

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
          message: 'Webhook not found'
        });
        return;
      }

      await webhook.deleteOne();

      logger.info(`Webhook deleted: ${webhook.name}`);

      res.status(200).json({
        success: true,
        message: 'Webhook deleted successfully'
      });
    } catch (error) {
      logger.error('Delete webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete webhook',
        message: 'An error occurred while deleting the webhook'
      });
    }
  }

  /**
   * Toggle webhook active status
   * POST /api/v1/merchant/webhooks/:id/toggle
   */
  static async toggleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const webhook = await Webhook.findOne({
        _id: id,
        merchantId
      });

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
          message: 'Webhook not found'
        });
        return;
      }

      await (webhook as any).toggleActive();

      logger.info(`Webhook toggled: ${webhook.name} - Active: ${webhook.isActive}`);

      res.status(200).json({
        success: true,
        message: 'Webhook status updated successfully',
        data: {
          webhook: {
            id: webhook._id,
            name: webhook.name,
            isActive: webhook.isActive
          }
        }
      });
    } catch (error) {
      logger.error('Toggle webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle webhook',
        message: 'An error occurred while toggling the webhook'
      });
    }
  }

  /**
   * Add event to webhook
   * POST /api/v1/merchant/webhooks/:id/events
   */
  static async addWebhookEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];
      const { event } = req.body;

      const webhook = await Webhook.findOne({
        _id: id,
        merchantId
      });

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
          message: 'Webhook not found'
        });
        return;
      }

      await (webhook as any).addEvent(event);

      logger.info(`Event added to webhook: ${webhook.name} - Event: ${event}`);

      res.status(200).json({
        success: true,
        message: 'Event added to webhook successfully',
        data: {
          webhook: {
            id: webhook._id,
            name: webhook.name,
            events: webhook.events
          }
        }
      });
    } catch (error) {
      logger.error('Add webhook event error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add event to webhook',
        message: 'An error occurred while adding the event to the webhook'
      });
    }
  }

  /**
   * Remove event from webhook
   * DELETE /api/v1/merchant/webhooks/:id/events/:event
   */
  static async removeWebhookEvent(req: Request, res: Response): Promise<void> {
    try {
      const { id, event } = req.params;
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const webhook = await Webhook.findOne({
        _id: id,
        merchantId
      });

      if (!webhook) {
        res.status(404).json({
          success: false,
          error: 'Webhook not found',
          message: 'Webhook not found'
        });
        return;
      }

      await (webhook as any).removeEvent(event);

      logger.info(`Event removed from webhook: ${webhook.name} - Event: ${event}`);

      res.status(200).json({
        success: true,
        message: 'Event removed from webhook successfully',
        data: {
          webhook: {
            id: webhook._id,
            name: webhook.name,
            events: webhook.events
          }
        }
      });
    } catch (error) {
      logger.error('Remove webhook event error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove event from webhook',
        message: 'An error occurred while removing the event from the webhook'
      });
    }
  }

  /**
   * Get webhook statistics
   * GET /api/v1/merchant/webhooks/stats
   */
  static async getWebhookStats(req: Request, res: Response): Promise<void> {
    try {
      const merchantId = req.user?.merchantId || req.headers['x-merchant-id'];

      const stats = await (Webhook as any).getStats(merchantId);

      logger.info(`Webhook stats retrieved for merchant: ${merchantId}`);

      res.status(200).json({
        success: true,
        message: 'Webhook statistics retrieved successfully',
        data: {
          stats: stats[0] || {
            totalWebhooks: 0,
            activeWebhooks: 0,
            verifiedWebhooks: 0,
            totalAttempts: 0,
            totalSuccess: 0,
            totalFailures: 0
          }
        }
      });
    } catch (error) {
      logger.error('Get webhook stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve webhook statistics',
        message: 'An error occurred while retrieving webhook statistics'
      });
    }
  }
}

export default WebhookConfigController; 