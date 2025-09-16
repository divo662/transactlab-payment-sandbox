import { Router } from 'express';
import { AnalyticsController } from '../../../controllers/analytics/analyticsController';
import { rateLimiters } from '../../../config/rateLimit';
import { authenticateToken, requireRole, authenticateApiKey } from '../../../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/analytics/overview
 * @desc    Get analytics overview
 * @access  Private (Merchant/API Key)
 */
router.get('/overview', 
  authenticateApiKey, 
  rateLimiters.analytics, 
  AnalyticsController.getAnalyticsOverview
);

/**
 * @route   GET /api/v1/analytics/transactions
 * @desc    Get transaction analytics
 * @access  Private (Merchant/API Key)
 */
router.get('/transactions', 
  authenticateApiKey, 
  rateLimiters.analytics, 
  AnalyticsController.getTransactionAnalytics
);

/**
 * @route   GET /api/v1/analytics/customers
 * @desc    Get customer analytics
 * @access  Private (Merchant/API Key)
 */
router.get('/customers', 
  authenticateApiKey, 
  rateLimiters.analytics, 
  AnalyticsController.getCustomerAnalytics
);

/**
 * @route   GET /api/v1/analytics/export
 * @desc    Export analytics data
 * @access  Private (User Token)
 */
router.get('/export', 
  authenticateToken, 
  rateLimiters.analytics, 
  AnalyticsController.exportAnalytics
);

export default router;
