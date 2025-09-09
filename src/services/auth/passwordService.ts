import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Types } from 'mongoose';
import User from '../../models/User';
import { logger } from '../../utils/helpers/logger';

export interface PasswordResult {
  success: boolean;
  message?: string;
  error?: string;
  resetToken?: string;
  resetExpires?: Date;
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Password Service
 * Handles password hashing, validation, and reset functionality
 */
export class PasswordService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly RESET_TOKEN_EXPIRES_IN = 3600000; // 1 hour in milliseconds

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
      
      logger.debug('Password hashed successfully');
      
      return hashedPassword;
    } catch (error) {
      logger.error('Failed to hash password', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      
      logger.debug('Password comparison completed', {
        isMatch
      });
      
      return isMatch;
    } catch (error) {
      logger.error('Failed to compare password', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];
    
    // Check minimum length
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    // Check maximum length
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for common passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }
    
    // Check for sequential characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain repeated characters');
    }
    
    // Check for sequential numbers
    if (/123|234|345|456|567|678|789/.test(password)) {
      errors.push('Password cannot contain sequential numbers');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate password reset token
   */
  static generateResetToken(): string {
    try {
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      logger.debug('Password reset token generated');
      
      return resetToken;
    } catch (error) {
      logger.error('Failed to generate reset token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Hash reset token
   */
  static async hashResetToken(token: string): Promise<string> {
    try {
      const hashedToken = await bcrypt.hash(token, this.SALT_ROUNDS);
      
      logger.debug('Reset token hashed successfully');
      
      return hashedToken;
    } catch (error) {
      logger.error('Failed to hash reset token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Compare reset token with hash
   */
  static async compareResetToken(token: string, hash: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(token, hash);
      
      logger.debug('Reset token comparison completed', {
        isMatch
      });
      
      return isMatch;
    } catch (error) {
      logger.error('Failed to compare reset token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<PasswordResult> {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return {
          success: false,
          message: 'If an account with this email exists, a reset link has been sent'
        };
      }

      // Generate reset token
      const resetToken = this.generateResetToken();
      const hashedResetToken = await this.hashResetToken(resetToken);
      
      // Set reset token and expiration
      const resetExpires = new Date(Date.now() + this.RESET_TOKEN_EXPIRES_IN);
      
      user.passwordResetToken = hashedResetToken;
      user.passwordResetExpires = resetExpires;
      await user.save();

      logger.info('Password reset requested', {
        userId: user._id,
        email: user.email
      });

      return {
        success: true,
        message: 'Password reset link sent to your email',
        resetToken,
        resetExpires
      };

    } catch (error) {
      logger.error('Password reset request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email
      });

      return {
        success: false,
        message: 'Failed to process password reset request',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<PasswordResult> {
    try {
      // Validate new password
      const validation = this.validatePassword(newPassword);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Password does not meet requirements',
          error: validation.errors.join(', ')
        };
      }

      // Find user with valid reset token
      const user = await User.findOne({
        passwordResetToken: { $exists: true },
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      // Verify reset token
      const isTokenValid = await this.compareResetToken(token, user.passwordResetToken);
      if (!isTokenValid) {
        return {
          success: false,
          message: 'Invalid reset token'
        };
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password and clear reset token
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      logger.info('Password reset successfully', {
        userId: user._id,
        email: user.email
      });

      return {
        success: true,
        message: 'Password reset successfully'
      };

    } catch (error) {
      logger.error('Password reset failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to reset password',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: Types.ObjectId,
    currentPassword: string,
    newPassword: string
  ): Promise<PasswordResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Validate new password
      const validation = this.validatePassword(newPassword);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Password does not meet requirements',
          error: validation.errors.join(', ')
        };
      }

      // Check if new password is same as current
      const isSamePassword = await this.comparePassword(newPassword, user.password);
      if (isSamePassword) {
        return {
          success: false,
          message: 'New password must be different from current password'
        };
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      user.password = hashedPassword;
      await user.save();

      logger.info('Password changed successfully', {
        userId: user._id,
        email: user.email
      });

      return {
        success: true,
        message: 'Password changed successfully'
      };

    } catch (error) {
      logger.error('Password change failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });

      return {
        success: false,
        message: 'Failed to change password',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify reset token
   */
  static async verifyResetToken(token: string): Promise<PasswordResult> {
    try {
      const user = await User.findOne({
        passwordResetToken: { $exists: true },
        passwordResetExpires: { $gt: new Date() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }

      // Verify reset token
      const isTokenValid = await this.compareResetToken(token, user.passwordResetToken);
      if (!isTokenValid) {
        return {
          success: false,
          message: 'Invalid reset token'
        };
      }

      return {
        success: true,
        message: 'Reset token is valid'
      };

    } catch (error) {
      logger.error('Reset token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Failed to verify reset token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate random password
   */
  static generateRandomPassword(length: number = 12): string {
    try {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      
      // Ensure at least one character from each category
      password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
      password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
      password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
      password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special character
      
      // Fill the rest randomly
      for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
      }
      
      // Shuffle the password
      password = password.split('').sort(() => Math.random() - 0.5).join('');
      
      logger.debug('Random password generated');
      
      return password;
    } catch (error) {
      logger.error('Failed to generate random password', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check if password was changed after token was issued
   */
  static async isPasswordChangedAfter(userId: Types.ObjectId, tokenIssuedAt: number): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      // Since passwordChangedAt doesn't exist, we'll use updatedAt as a proxy
      // This is not as accurate but provides a reasonable approximation
      const updatedAt = user.updatedAt.getTime() / 1000;
      return updatedAt > tokenIssuedAt;

    } catch (error) {
      logger.error('Failed to check password change time', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      return false;
    }
  }

  /**
   * Clean up expired reset tokens
   */
  static async cleanupExpiredResetTokens(): Promise<number> {
    try {
      const result = await User.updateMany(
        {
          passwordResetExpires: { $lt: new Date() }
        },
        {
          $unset: {
            passwordResetToken: 1,
            passwordResetExpires: 1
          }
        }
      );

      logger.info('Expired reset tokens cleaned up', {
        modifiedCount: result.modifiedCount
      });

      return result.modifiedCount || 0;

    } catch (error) {
      logger.error('Failed to cleanup expired reset tokens', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }
}

export default PasswordService; 