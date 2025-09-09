import { Router } from 'express';
import { AdminController } from '../../controllers/admin/adminController';
import { rateLimiters } from '../../config/rateLimit';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = Router();

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get admin dashboard data
 * @access  Private (Admin)
 */
router.get('/dashboard', 
  authenticateToken, 
  requireRole(['admin']),
  rateLimiters.analytics, 
  AdminController.getDashboard
);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get('/users', 
  authenticateToken, 
  requireRole(['admin']),
  rateLimiters.general, 
  AdminController.getAllUsers
);

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put('/users/:id', 
  authenticateToken, 
  requireRole(['admin']),
  rateLimiters.general, 
  validateRequest('updateUser'),
  AdminController.updateUser
);

// Merchant routes removed as merchant functionality was dropped from User model

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get system statistics
 * @access  Private (Admin)
 */
router.get('/stats', 
  authenticateToken, 
  requireRole(['admin']),
  rateLimiters.analytics, 
  AdminController.getSystemStats
);

/**
 * @route   GET /api/v1/admin/logs
 * @desc    Get system logs
 * @access  Private (Admin)
 */
router.get('/logs', 
  authenticateToken, 
  requireRole(['admin']),
  rateLimiters.general, 
  AdminController.getSystemLogs
);

export default router; 