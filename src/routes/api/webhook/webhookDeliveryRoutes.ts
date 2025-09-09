import { Router } from 'express';
import { WebhookController } from '../../../controllers/payment/webhookController';
import { rateLimiters } from '../../../config/rateLimit';
import { verifyWebhookSignature } from '../../../middleware/validation';

const router = Router();

/**
 * @route   POST /api/webhook/delivery
 * @desc    Receive webhook delivery from external services
 * @access  Public (with signature validation)
 */
router.post('/delivery', 
  rateLimiters.webhook, 
  verifyWebhookSignature,
  WebhookController.deliverWebhook
);

/**
 * @route   POST /api/webhook/test
 * @desc    Test webhook delivery endpoint
 * @access  Public
 */
router.post('/test', 
  rateLimiters.webhook, 
  WebhookController.testWebhook
);

/**
 * @route   GET /api/webhook/health
 * @desc    Webhook health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Webhook delivery service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router; 