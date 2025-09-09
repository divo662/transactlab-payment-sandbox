import { Router } from 'express';
import { SystemController } from '../../controllers/admin/systemController';
import { rateLimiters } from '../../config/rateLimit';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = Router();

/**
 * @route   GET /api/v1/admin/system/health
 * @desc    Get system health status
 * @access  Private (Admin)
 */
router.get('/health', 
  authenticateToken, 
  requireRole(['admin']),
  rateLimiters.general, 
  SystemController.getSystemHealth
);

/**
 * @route   POST /api/v1/admin/system/maintenance
 * @desc    Perform system maintenance
 * @access  Private (Admin)
 */
router.post('/maintenance', 
  authenticateToken, 
  requireRole(['admin']),
  rateLimiters.general, 
  validateRequest('systemMaintenance'),
  SystemController.performMaintenance
);

/**
 * @route   GET /api/v1/admin/system/info
 * @desc    Get system information
 * @access  Private (Admin)
 */
router.get('/info', 
  authenticateToken, 
  requireRole(['admin']),
  rateLimiters.general, 
  SystemController.getSystemInfo
);

/**
 * @route   GET /api/v1/admin/system/metrics
 * @desc    Get system metrics
 * @access  Private (Admin)
 */
router.get('/metrics', 
  authenticateToken, 
  requireRole(['admin']),
  rateLimiters.analytics, 
  SystemController.getSystemMetrics
);

/**
 * @route   POST /api/v1/admin/system/cache/clear
 * @desc    Clear system cache
 * @access  Private (Admin)
 */
router.post('/cache/clear', 
  authenticateToken, 
  requireRole(['admin']),
  rateLimiters.general, 
  validateRequest('clearCache'),
  SystemController.clearCache
);

export default router; 