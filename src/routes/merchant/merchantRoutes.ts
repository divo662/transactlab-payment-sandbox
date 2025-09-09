import { Router } from 'express';
import { MerchantController } from '../../controllers/merchant/merchantController';
import { rateLimiters } from '../../config/rateLimit';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { upload } from '../../middleware/upload';

const router = Router();

/**
 * @route   POST /api/v1/merchant/profile
 * @desc    Create merchant profile
 * @access  Private (Authenticated User)
 */
router.post('/profile', 
  authenticateToken, 
  requireRole(['user', 'merchant']),
  rateLimiters.general, 
  validateRequest('createMerchant'),
  MerchantController.createMerchant
);

/**
 * @route   GET /api/v1/merchant/profile
 * @desc    Get merchant profile
 * @access  Private (Merchant)
 */
router.get('/profile', 
  authenticateToken, 
  requireRole(['user', 'merchant', 'admin']),
  MerchantController.getMerchantProfile
);

/**
 * @route   PUT /api/v1/merchant/profile
 * @desc    Update merchant profile
 * @access  Private (Merchant)
 */
router.put('/profile', 
  authenticateToken, 
  requireRole(['user', 'merchant', 'admin']),
  rateLimiters.general, 
  validateRequest('updateMerchant'),
  MerchantController.updateMerchantProfile
);

/**
 * @route   POST /api/v1/merchant/logo
 * @desc    Upload merchant logo
 * @access  Private (Merchant)
 */
router.post('/logo', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.upload, 
  upload.single('logo'),
  MerchantController.uploadLogo
);

/**
 * @route   GET /api/v1/merchant/stats
 * @desc    Get merchant statistics
 * @access  Private (Merchant)
 */
router.get('/stats', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.analytics, 
  MerchantController.getMerchantStats
);

/**
 * @route   PUT /api/v1/merchant/limits
 * @desc    Update merchant limits
 * @access  Private (Merchant)
 */
router.put('/limits', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  validateRequest('updateMerchantLimits'),
  MerchantController.updateMerchantLimits
);

/**
 * @route   POST /api/v1/merchant/deactivate
 * @desc    Deactivate merchant account
 * @access  Private (Merchant)
 */
router.post('/deactivate', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  validateRequest('deactivateMerchant'),
  MerchantController.deactivateMerchant
);

/**
 * @route   POST /api/v1/merchant/reactivate
 * @desc    Reactivate merchant account
 * @access  Private (Merchant)
 */
router.post('/reactivate', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  MerchantController.reactivateMerchant
);

/**
 * @route   POST /api/v1/merchant/verify
 * @desc    Submit merchant verification documents
 * @access  Private (Merchant)
 */
router.post('/verify', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  MerchantController.submitVerification
);

/**
 * @route   GET /api/v1/merchant/onboarding-status
 * @desc    Get merchant onboarding status
 * @access  Private (Merchant)
 */
router.get('/onboarding-status', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  MerchantController.getOnboardingStatus
);

/**
 * @route   GET /api/v1/merchant/payment-methods
 * @desc    Get merchant payment methods
 * @access  Private (Merchant)
 */
router.get('/payment-methods', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  MerchantController.getPaymentMethods
);

/**
 * @route   POST /api/v1/merchant/payment-methods
 * @desc    Add payment method to merchant
 * @access  Private (Merchant)
 */
router.post('/payment-methods', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  MerchantController.addPaymentMethod
);

/**
 * @route   PUT /api/v1/merchant/payment-methods/:id
 * @desc    Update merchant payment method
 * @access  Private (Merchant)
 */
router.put('/payment-methods/:id', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  MerchantController.updatePaymentMethod
);

/**
 * @route   DELETE /api/v1/merchant/payment-methods/:id
 * @desc    Delete merchant payment method
 * @access  Private (Merchant)
 */
router.delete('/payment-methods/:id', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  MerchantController.deletePaymentMethod
);

/**
 * @route   GET /api/v1/merchant/analytics
 * @desc    Get merchant analytics
 * @access  Private (Merchant)
 */
router.get('/analytics', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.analytics, 
  MerchantController.getMerchantAnalytics
);

/**
 * @route   GET /api/v1/merchant/transaction-stats
 * @desc    Get merchant transaction statistics
 * @access  Private (Merchant)
 */
router.get('/transaction-stats', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.analytics, 
  MerchantController.getTransactionStats
);

export default router; 