import { Router } from 'express';
import { WebhookConfigController } from '../../controllers/merchant/webhookConfigController';
import { rateLimiters } from '../../config/rateLimit';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = Router();

/**
 * @route   POST /api/v1/merchant/webhooks
 * @desc    Create new webhook
 * @access  Private (Merchant)
 */
router.post('/', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  validateRequest('createWebhook'),
  WebhookConfigController.createWebhook
);

/**
 * @route   GET /api/v1/merchant/webhooks
 * @desc    List webhooks
 * @access  Private (Merchant)
 */
router.get('/', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  WebhookConfigController.listWebhooks
);

/**
 * @route   GET /api/v1/merchant/webhooks/:id
 * @desc    Get webhook by ID
 * @access  Private (Merchant)
 */
router.get('/:id', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  WebhookConfigController.getWebhook
);

/**
 * @route   PUT /api/v1/merchant/webhooks/:id
 * @desc    Update webhook
 * @access  Private (Merchant)
 */
router.put('/:id', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  validateRequest('updateWebhook'),
  WebhookConfigController.updateWebhook
);

/**
 * @route   DELETE /api/v1/merchant/webhooks/:id
 * @desc    Delete webhook
 * @access  Private (Merchant)
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  WebhookConfigController.deleteWebhook
);

/**
 * @route   POST /api/v1/merchant/webhooks/:id/toggle
 * @desc    Toggle webhook active status
 * @access  Private (Merchant)
 */
router.post('/:id/toggle', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  WebhookConfigController.toggleWebhook
);

/**
 * @route   POST /api/v1/merchant/webhooks/:id/events
 * @desc    Add event to webhook
 * @access  Private (Merchant)
 */
router.post('/:id/events', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  validateRequest('addWebhookEvent'),
  WebhookConfigController.addWebhookEvent
);

/**
 * @route   DELETE /api/v1/merchant/webhooks/:id/events/:event
 * @desc    Remove event from webhook
 * @access  Private (Merchant)
 */
router.delete('/:id/events/:event', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  WebhookConfigController.removeWebhookEvent
);

/**
 * @route   GET /api/v1/merchant/webhooks/stats
 * @desc    Get webhook statistics
 * @access  Private (Merchant)
 */
router.get('/stats', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.analytics, 
  WebhookConfigController.getWebhookStats
);

export default router; 