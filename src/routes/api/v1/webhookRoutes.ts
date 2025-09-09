import { Router } from 'express';
import { WebhookController } from '../../../controllers/payment/webhookController';
import { rateLimiters } from '../../../config/rateLimit';
import { authenticateToken, requireRole, authenticateApiKey } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validation';

const router = Router();

/**
 * @route   POST /api/v1/webhooks/deliver
 * @desc    Deliver webhook event
 * @access  Private (Merchant/API Key)
 */
router.post('/deliver', 
  authenticateApiKey, 
  rateLimiters.webhook, 
  validateRequest('deliverWebhook'),
  WebhookController.deliverWebhook
);

/**
 * @route   POST /api/v1/webhooks/test
 * @desc    Test webhook
 * @access  Private (Merchant/API Key)
 */
router.post('/test', 
  authenticateApiKey, 
  rateLimiters.webhook, 
  validateRequest('testWebhook'),
  WebhookController.testWebhook
);

/**
 * @route   GET /api/v1/webhooks/logs
 * @desc    Get webhook logs
 * @access  Private (Merchant/API Key)
 */
router.get('/logs', 
  authenticateApiKey, 
  rateLimiters.general, 
  WebhookController.getWebhookLogs
);

/**
 * @route   POST /api/v1/webhooks/:id/retry
 * @desc    Retry failed webhook
 * @access  Private (Merchant/API Key)
 */
router.post('/:id/retry', 
  authenticateApiKey, 
  rateLimiters.webhook, 
  WebhookController.retryWebhook
);

/**
 * @route   POST /api/v1/webhooks/verify
 * @desc    Verify webhook signature
 * @access  Public
 */
router.post('/verify', 
  validateRequest('verifyWebhook'),
  WebhookController.verifyWebhookSignature
);

export default router; 