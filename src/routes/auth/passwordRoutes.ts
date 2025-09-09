import { Router } from 'express';
import { PasswordController } from '../../controllers/auth/passwordController';
import { rateLimiters } from '../../config/rateLimit';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', rateLimiters.auth, PasswordController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', rateLimiters.auth, PasswordController.resetPassword);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/change-password', authenticateToken, PasswordController.changePassword);

/**
 * @route   GET /api/v1/auth/verify-reset-token/:token
 * @desc    Verify password reset token
 * @access  Public
 */
router.get('/verify-reset-token/:token', PasswordController.verifyResetToken);

/**
 * @route   GET /api/v1/auth/password-requirements
 * @desc    Get password strength requirements
 * @access  Public
 */
router.get('/password-requirements', PasswordController.getPasswordRequirements);

/**
 * @route   POST /api/v1/auth/validate-password
 * @desc    Validate password strength
 * @access  Public
 */
router.post('/validate-password', PasswordController.validatePassword);

/**
 * @route   POST /api/v1/auth/2fa/toggle
 * @desc    Enable/disable two-factor authentication
 * @access  Private
 */
router.post('/2fa/toggle', authenticateToken, PasswordController.toggleTwoFactor);

/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify two-factor authentication code
 * @access  Public
 */
router.post('/2fa/verify', PasswordController.verifyTwoFactor);

export default router; 