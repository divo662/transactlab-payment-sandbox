import { Router } from 'express';
import { SubscriptionController } from '../../../controllers/payment/subscriptionController';
import { rateLimiters } from '../../../config/rateLimit';
import { authenticateToken, requireRole, authenticateApiKey } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validation';

const router = Router();

/**
 * @route   POST /api/v1/subscriptions
 * @desc    Create a new subscription
 * @access  Private (Merchant/API Key)
 */
router.post('/', 
  authenticateApiKey, 
  rateLimiters.payment, 
  validateRequest('createSubscription'),
  SubscriptionController.createSubscription
);

/**
 * @route   GET /api/v1/subscriptions/:id
 * @desc    Get subscription by ID
 * @access  Private (Merchant/API Key)
 */
router.get('/:id', 
  authenticateApiKey, 
  SubscriptionController.getSubscription
);

/**
 * @route   GET /api/v1/subscriptions
 * @desc    List subscriptions
 * @access  Private (Merchant/API Key)
 */
router.get('/', 
  authenticateApiKey, 
  rateLimiters.general, 
  SubscriptionController.listSubscriptions
);

/**
 * @route   PUT /api/v1/subscriptions/:id
 * @desc    Update subscription
 * @access  Private (Merchant/API Key)
 */
router.put('/:id', 
  authenticateApiKey, 
  rateLimiters.payment, 
  validateRequest('updateSubscription'),
  SubscriptionController.updateSubscription
);

/**
 * @route   POST /api/v1/subscriptions/:id/cancel
 * @desc    Cancel subscription
 * @access  Private (Merchant/API Key)
 */
router.post('/:id/cancel', 
  authenticateApiKey, 
  rateLimiters.payment, 
  validateRequest('cancelSubscription'),
  SubscriptionController.cancelSubscription
);

/**
 * @route   POST /api/v1/subscriptions/:id/reactivate
 * @desc    Reactivate subscription
 * @access  Private (Merchant/API Key)
 */
router.post('/:id/reactivate', 
  authenticateApiKey, 
  rateLimiters.payment, 
  SubscriptionController.reactivateSubscription
);

/**
 * @route   POST /api/v1/subscriptions/:id/bill
 * @desc    Process subscription billing
 * @access  Private (Merchant/API Key)
 */
router.post('/:id/bill', 
  authenticateApiKey, 
  rateLimiters.payment, 
  SubscriptionController.processBilling
);

/**
 * @route   GET /api/v1/subscriptions/stats
 * @desc    Get subscription statistics
 * @access  Private (Merchant/API Key)
 */
router.get('/stats', 
  authenticateApiKey, 
  rateLimiters.analytics, 
  SubscriptionController.getSubscriptionStats
);

export default router; 