import { Router } from 'express';
import { ReportController } from '../../controllers/analytics/reportController';
import { rateLimiters } from '../../config/rateLimit';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = Router();

/**
 * @route   POST /api/v1/reports/generate
 * @desc    Generate report
 * @access  Private (Merchant)
 */
router.post('/generate', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  validateRequest('generateReport'),
  ReportController.generateReport
);

/**
 * @route   POST /api/v1/reports/export
 * @desc    Export report
 * @access  Private (Merchant)
 */
router.post('/export', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  validateRequest('exportReport'),
  ReportController.exportReport
);

/**
 * @route   GET /api/v1/reports/types
 * @desc    Get available report types
 * @access  Private (Merchant)
 */
router.get('/types', 
  authenticateToken, 
  requireRole(['merchant', 'admin']),
  rateLimiters.general, 
  ReportController.getReportTypes
);

export default router; 