import { Router } from 'express';
import { RefundController } from '../../../controllers/payment/refundController';
import { rateLimiters } from '../../../config/rateLimit';
import { authenticateToken, requireRole, authenticateApiKey } from '../../../middleware/auth';
import { validateRequest } from '../../../middleware/validation';

const router = Router();

/**
 * @route   POST /api/v1/refunds
 * @desc    Create a new refund
 * @access  Private (Merchant/API Key)
 */
router.post('/', 
  authenticateApiKey, 
  rateLimiters.payment, 
  validateRequest('createRefund'),
  RefundController.createRefund
);

/**
 * @route   GET /api/v1/refunds/:reference
 * @desc    Get refund by reference
 * @access  Private (Merchant/API Key)
 */
router.get('/:reference', 
  authenticateApiKey, 
  RefundController.getRefund
);

/**
 * @route   GET /api/v1/refunds
 * @desc    List refunds
 * @access  Private (Merchant/API Key)
 */
router.get('/', 
  authenticateApiKey, 
  rateLimiters.general, 
  RefundController.listRefunds
);

/**
 * @route   PUT /api/v1/refunds/:id
 * @desc    Update refund status
 * @access  Private (Merchant/API Key)
 */
router.put('/:id', 
  authenticateApiKey, 
  rateLimiters.payment, 
  validateRequest('updateRefund'),
  RefundController.updateRefund
);

/**
 * @route   POST /api/v1/refunds/:id/cancel
 * @desc    Cancel refund
 * @access  Private (Merchant/API Key)
 */
router.post('/:id/cancel', 
  authenticateApiKey, 
  rateLimiters.payment, 
  RefundController.cancelRefund
);

/**
 * @route   GET /api/v1/refunds/stats
 * @desc    Get refund statistics
 * @access  Private (Merchant/API Key)
 */
router.get('/stats', 
  authenticateApiKey, 
  rateLimiters.analytics, 
  RefundController.getRefundStats
);

export default router; 