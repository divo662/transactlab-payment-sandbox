import { Router } from 'express';
import { AuthController } from '../../controllers/auth/authController';
import KycController from '../../controllers/auth/kycController';
import { rateLimiters } from '../../config/rateLimit';
import { authenticateToken, requireRole } from '../../middleware/auth';
import { upload, handleUploadError } from '../../middleware/upload';
import securityRoutes from './security';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', rateLimiters.auth, AuthController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', rateLimiters.auth, AuthController.login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, AuthController.getProfile);

/**
 * @route   POST /api/v1/auth/upload-avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), handleUploadError, AuthController.uploadAvatar);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, AuthController.updateProfile);

/**
 * @route   GET /api/v1/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get('/verify-email/:token', AuthController.verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post('/resend-verification', rateLimiters.auth, AuthController.resendVerification);

/**
 * @route   POST /api/v1/auth/initiate-security-question-reset
 * @desc    Initiate security question reset via email
 * @access  Public
 */
router.post('/initiate-security-question-reset', rateLimiters.auth, AuthController.initiateSecurityQuestionReset);

/**
 * @route   POST /api/v1/auth/reset-security-question
 * @desc    Reset security question and answer with token
 * @access  Public
 */
router.post('/reset-security-question', rateLimiters.auth, AuthController.resetSecurityQuestion);

/**
 * @route   POST /api/v1/auth/reset-security-question-password
 * @desc    Reset security question and answer with password verification
 * @access  Public
 */
router.post('/reset-security-question-password', rateLimiters.auth, AuthController.resetSecurityQuestionWithPassword);

/**
 * @route   POST /api/v1/auth/unlock-account
 * @desc    Unlock account for development (TEMPORARY)
 * @access  Public
 */
router.post('/unlock-account', rateLimiters.auth, AuthController.unlockAccount);

/**
 * @route   DELETE /api/v1/auth/account
 * @desc    Delete user account permanently
 * @access  Private
 */
router.delete('/account', authenticateToken, AuthController.deleteAccount);

// KYC
router.post('/kyc/start', authenticateToken, KycController.startKyc);
router.get('/kyc/status/:sessionId', authenticateToken, KycController.getKycStatus);
router.post('/kyc/complete/:sessionId', authenticateToken, KycController.completeKyc);
router.post('/webhooks/kyc', KycController.webhook);

// Security routes
router.use('/security', securityRoutes);

export default router; 