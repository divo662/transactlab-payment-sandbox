import express from 'express';
import { authenticateToken } from '../../middleware/auth/authMiddleware';
import {
  getAnalyticsOverview,
  getTransactionAnalytics,
  getCustomerAnalytics,
  exportAnalytics
} from '../../controllers/analytics/analyticsController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get analytics overview
router.get('/overview', getAnalyticsOverview);

// Get transaction analytics
router.get('/transactions', getTransactionAnalytics);

// Get customer analytics
router.get('/customers', getCustomerAnalytics);

// Export analytics data
router.get('/export', exportAnalytics);

export default router;