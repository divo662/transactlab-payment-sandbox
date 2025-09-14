import express from 'express';
import { authenticateToken } from '../../middleware/auth/authMiddleware';
import {
  getAnalyticsOverview,
  getTransactionAnalytics,
  getCustomerAnalytics,
  exportAnalytics
} from '../../controllers/analytics/analyticsController';
import cacheMiddleware, { cacheKeyGenerators } from '../../middleware/cache/cacheMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get analytics overview (with caching)
router.get('/overview', cacheMiddleware({ 
  ttl: 300, // 5 minutes
  keyGenerator: cacheKeyGenerators.analytics 
}), getAnalyticsOverview);

// Get transaction analytics (with caching)
router.get('/transactions', cacheMiddleware({ 
  ttl: 300, // 5 minutes
  keyGenerator: cacheKeyGenerators.analytics 
}), getTransactionAnalytics);

// Get customer analytics (with caching)
router.get('/customers', cacheMiddleware({ 
  ttl: 300, // 5 minutes
  keyGenerator: cacheKeyGenerators.analytics 
}), getCustomerAnalytics);

// Export analytics data
router.get('/export', exportAnalytics);

export default router;