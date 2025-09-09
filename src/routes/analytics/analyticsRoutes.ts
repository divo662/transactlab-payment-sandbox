import { Router } from 'express';
import { AnalyticsController } from '../../controllers/analytics/analyticsController';
import { rateLimiters } from '../../config/rateLimit';
import { authenticateToken, requireRole } from '../../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/analytics/overview
 * @desc    Get analytics overview
 * @access  Private (Merchant)
 */
router.get('/overview', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.analytics, 
  AnalyticsController.getAnalyticsOverview
);

/**
 * @route   GET /api/v1/analytics/transactions
 * @desc    Get transaction analytics
 * @access  Private (Merchant)
 */
router.get('/transactions', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.analytics, 
  AnalyticsController.getTransactionAnalytics
);

/**
 * @route   GET /api/v1/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Private (Merchant)
 */
router.get('/revenue', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.analytics, 
  AnalyticsController.getRevenueAnalytics
);

/**
 * @route   GET /api/v1/analytics/payment-methods
 * @desc    Get payment method analytics
 * @access  Private (Merchant)
 */
router.get('/payment-methods', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.analytics, 
  AnalyticsController.getPaymentMethodAnalytics
);

/**
 * @route   GET /api/v1/analytics/geographic
 * @desc    Get geographic analytics
 * @access  Private (Merchant)
 */
router.get('/geographic', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.analytics, 
  AnalyticsController.getGeographicAnalytics
);

export default router; 