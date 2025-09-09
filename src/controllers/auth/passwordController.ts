import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../../models';
import { logger } from '../../utils/helpers/logger';
import { redisClient } from '../../config/redis';

// Request interfaces
interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface VerifyPasswordResetRequest {
  token: string;
}

export class PasswordController {
  /**
   * Forgot password - send reset email
   * POST /api/v1/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email }: ForgotPasswordRequest = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if user exists or not for security
        res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent'
        });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      logger.info(`Generated reset token: ${resetToken.substring(0, 8)}...`);
      logger.info(`Token hash: ${resetTokenHash.substring(0, 8)}...`);

      // Save hashed token to database
      user.passwordResetToken = resetTokenHash;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      logger.info(`Token saved to database for user: ${user.email}`);

      // Store token in Redis for additional security
      try {
        await redisClient.set(
          `password_reset:${resetTokenHash}`,
          user._id.toString(),
          60 * 60 // 1 hour
        );
        logger.info(`Token stored in Redis for user: ${user.email}`);
      } catch (redisError) {
        logger.warn(`Failed to store token in Redis: ${redisError}`);
        // Don't fail the request if Redis is down
      }

      // Send password reset email
      try {
        const EmailService = (await import('../../services/notification/emailService')).default;
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/auth/reset-password?token=${resetToken}`;
        
        await EmailService.sendPasswordResetEmail(user.email, user.firstName, resetLink);
        logger.info(`Password reset email sent to: ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError);
        // Don't fail password reset if email fails
      }

      logger.info(`Password reset requested for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request',
        message: 'An error occurred while processing your request'
      });
    }
  }

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password }: ResetPasswordRequest = req.body;

      logger.info(`Resetting password with token: ${token.substring(0, 8)}...`);

      // Hash the token to compare with stored hash
      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      logger.info(`Token hash: ${resetTokenHash.substring(0, 8)}...`);

      const user = await User.findOne({
        passwordResetToken: resetTokenHash,
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        logger.warn(`No user found for token hash: ${resetTokenHash.substring(0, 8)}...`);
        res.status(400).json({
          success: false,
          error: 'Invalid reset token',
          message: 'Invalid or expired password reset token'
        });
        return;
      }

      logger.info(`User found: ${user.email}`);

      // Try to verify token exists in Redis, but don't fail if Redis is down
      try {
        const storedUserId = await redisClient.get(`password_reset:${resetTokenHash}`);
        if (!storedUserId || storedUserId !== user._id.toString()) {
          logger.warn(`Redis validation failed for user: ${user.email}`);
          // Don't fail the request if Redis is down, just log it
        } else {
          logger.info(`Redis validation successful for user: ${user.email}`);
        }
      } catch (redisError) {
        logger.warn(`Redis validation skipped due to error: ${redisError}`);
        // Continue with database validation only
      }

      // Update password
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Try to remove token from Redis, but don't fail if Redis is down
      try {
        await redisClient.del(`password_reset:${resetTokenHash}`);
        logger.info(`Token removed from Redis for user: ${user.email}`);
      } catch (redisError) {
        logger.warn(`Failed to remove token from Redis: ${redisError}`);
      }

      // Try to invalidate all existing sessions, but don't fail if Redis is down
      try {
        await redisClient.del(`refresh_token:${user._id}`);
        logger.info(`Sessions invalidated in Redis for user: ${user.email}`);
      } catch (redisError) {
        logger.warn(`Failed to invalidate sessions in Redis: ${redisError}`);
      }

      logger.info(`Password reset successful for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset failed',
        message: 'An error occurred while resetting your password'
      });
    }
  }

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid current password',
          message: 'Current password is incorrect'
        });
        return;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Invalidate all existing sessions
      await redisClient.del(`refresh_token:${user._id}`);

      logger.info(`Password changed for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Password change failed',
        message: 'An error occurred while changing your password'
      });
    }
  }

  /**
   * Verify password reset token
   * GET /api/v1/auth/verify-reset-token/:token
   */
  static async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Missing reset token',
          message: 'Password reset token is required'
        });
        return;
      }

      logger.info(`Verifying reset token: ${token.substring(0, 8)}...`);

      // Hash the token to compare with stored hash
      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      logger.info(`Token hash: ${resetTokenHash.substring(0, 8)}...`);

      const user = await User.findOne({
        passwordResetToken: resetTokenHash,
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        logger.warn(`No user found for token hash: ${resetTokenHash.substring(0, 8)}...`);
        res.status(400).json({
          success: false,
          error: 'Invalid reset token',
          message: 'Invalid or expired password reset token'
        });
        return;
      }

      logger.info(`User found: ${user.email}`);

      // Try to verify token exists in Redis, but don't fail if Redis is down
      try {
        const storedUserId = await redisClient.get(`password_reset:${resetTokenHash}`);
        if (!storedUserId || storedUserId !== user._id.toString()) {
          logger.warn(`Redis validation failed for user: ${user.email}`);
          // Don't fail the request if Redis is down, just log it
        } else {
          logger.info(`Redis validation successful for user: ${user.email}`);
        }
      } catch (redisError) {
        logger.warn(`Redis validation skipped due to error: ${redisError}`);
        // Continue with database validation only
      }

      res.status(200).json({
        success: true,
        message: 'Reset token is valid',
        data: {
          email: user.email
        }
      });
    } catch (error) {
      logger.error('Verify reset token error:', error);
      res.status(500).json({
        success: false,
        error: 'Token verification failed',
        message: 'An error occurred while verifying the reset token'
      });
    }
  }

  /**
   * Get password strength requirements
   * GET /api/v1/auth/password-requirements
   */
  static async getPasswordRequirements(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Password requirements retrieved successfully',
        data: {
          requirements: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxLength: 128
          },
          strengthLevels: {
            weak: 'Password is too weak',
            medium: 'Password strength is acceptable',
            strong: 'Password is strong',
            veryStrong: 'Password is very strong'
          }
        }
      });
    } catch (error) {
      logger.error('Get password requirements error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get password requirements',
        message: 'An error occurred while retrieving password requirements'
      });
    }
  }

  /**
   * Validate password strength
   * POST /api/v1/auth/validate-password
   */
  static async validatePassword(req: Request, res: Response): Promise<void> {
    try {
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          error: 'Password required',
          message: 'Password is required'
        });
        return;
      }

      const requirements = {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      };

      const validation = {
        isValid: true,
        errors: [] as string[],
        strength: 'weak' as string,
        score: 0
      };

      // Check length
      if (password.length < requirements.minLength) {
        validation.isValid = false;
        validation.errors.push(`Password must be at least ${requirements.minLength} characters long`);
      }

      if (password.length > requirements.maxLength) {
        validation.isValid = false;
        validation.errors.push(`Password must be no more than ${requirements.maxLength} characters long`);
      }

      // Check for uppercase
      if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
        validation.isValid = false;
        validation.errors.push('Password must contain at least one uppercase letter');
      }

      // Check for lowercase
      if (requirements.requireLowercase && !/[a-z]/.test(password)) {
        validation.isValid = false;
        validation.errors.push('Password must contain at least one lowercase letter');
      }

      // Check for numbers
      if (requirements.requireNumbers && !/\d/.test(password)) {
        validation.isValid = false;
        validation.errors.push('Password must contain at least one number');
      }

      // Check for special characters
      if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        validation.isValid = false;
        validation.errors.push('Password must contain at least one special character');
      }

      // Calculate strength score
      let score = 0;
      if (password.length >= 8) score += 1;
      if (password.length >= 12) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[a-z]/.test(password)) score += 1;
      if (/\d/.test(password)) score += 1;
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
      if (password.length >= 16) score += 1;

      // Determine strength level
      if (score >= 6) {
        validation.strength = 'veryStrong';
      } else if (score >= 4) {
        validation.strength = 'strong';
      } else if (score >= 2) {
        validation.strength = 'medium';
      } else {
        validation.strength = 'weak';
      }

      validation.score = score;

      res.status(200).json({
        success: true,
        message: 'Password validation completed',
        data: {
          validation
        }
      });
    } catch (error) {
      logger.error('Validate password error:', error);
      res.status(500).json({
        success: false,
        error: 'Password validation failed',
        message: 'An error occurred while validating the password'
      });
    }
  }

  /**
   * Toggle two-factor authentication
   * POST /api/v1/auth/2fa/toggle
   */
  static async toggleTwoFactor(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { enable, password } = req.body;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid password',
          message: 'Password is incorrect'
        });
        return;
      }

      if (enable) {
        // Generate 2FA secret
        const secret = crypto.randomBytes(20).toString('hex');
        user.twoFactorSecret = secret;
        user.twoFactorEnabled = true;
        await user.save();

        // TODO: Generate QR code for authenticator app
        logger.info(`2FA enabled for user: ${user.email}`);

        res.status(200).json({
          success: true,
          message: 'Two-factor authentication enabled',
          data: {
            secret,
            qrCode: `otpauth://totp/TransactLab:${user.email}?secret=${secret}&issuer=TransactLab`
          }
        });
      } else {
        // Disable 2FA
        user.twoFactorSecret = undefined;
        user.twoFactorEnabled = false;
        await user.save();

        logger.info(`2FA disabled for user: ${user.email}`);

        res.status(200).json({
          success: true,
          message: 'Two-factor authentication disabled'
        });
      }
    } catch (error) {
      logger.error('Toggle 2FA error:', error);
      res.status(500).json({
        success: false,
        error: 'Two-factor authentication toggle failed',
        message: 'An error occurred while toggling two-factor authentication'
      });
    }
  }

  /**
   * Verify two-factor authentication code
   * POST /api/v1/auth/2fa/verify
   */
  static async verifyTwoFactor(req: Request, res: Response): Promise<void> {
    try {
      const { code, userId } = req.body;

      const user = await User.findById(userId).select('+twoFactorSecret');
      if (!user || !user.twoFactorEnabled) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: 'Two-factor authentication is not enabled for this user'
        });
        return;
      }

      // TODO: Implement TOTP verification
      // For now, we'll use a simple verification
      const expectedCode = '123456'; // This should be generated using TOTP library
      
      if (code !== expectedCode) {
        res.status(400).json({
          success: false,
          error: 'Invalid 2FA code',
          message: 'Invalid two-factor authentication code'
        });
        return;
      }

      logger.info(`2FA verified for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Two-factor authentication verified successfully'
      });
    } catch (error) {
      logger.error('Verify 2FA error:', error);
      res.status(500).json({
        success: false,
        error: 'Two-factor authentication verification failed',
        message: 'An error occurred while verifying two-factor authentication'
      });
    }
  }
}

export default PasswordController; 