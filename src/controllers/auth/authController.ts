import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../models';
import { generateTokenPair, verifyAccessToken, logout as logoutToken } from '../../config/jwt';
import { logger } from '../../utils/helpers/logger';
import { redisClient } from '../../config/redis';
import { ENV } from '../../config/environment';
import { SecurityService } from '../../services/auth/securityService';

// Request interfaces
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  businessName: string;
  businessType: 'individual' | 'startup' | 'enterprise' | 'agency';
  industry?: string;
  website?: string;
  description?: string;
  securityQuestion: string;
  securityAnswer: string;
}

interface LoginRequest {
  email: string;
  password: string;
  securityAnswer: string;
  rememberMe?: boolean;
  totpCode?: string;
  deviceId?: string;
}

interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

// Response interfaces
interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phone, businessName, businessType, industry, website, description, securityQuestion, securityAnswer }: RegisterRequest = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'User already exists',
          message: 'A user with this email already exists'
        });
        return;
      }

      // Create new user (all users are merchants)
      const user = new User({
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        phone,
        role: 'user', // All users start as regular users
        businessName,
        businessType,
        industry,
        website,
        description,
        securityQuestion: {
          question: securityQuestion,
          answer: securityAnswer
        }
      });

      // Generate email verification token
      const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // Send verification email
      try {
        const EmailService = (await import('../../services/notification/emailService')).default;
        await EmailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
        logger.info(`Verification email sent to: ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      // Generate tokens
      const tokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      // Store refresh token in Redis
      await redisClient.set(
        `refresh_token:${user._id}`,
        tokens.refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          tokens: {
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
            refreshToken: tokens.refreshToken,
            refreshExpiresIn: tokens.refreshExpiresIn
          }
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, securityAnswer, rememberMe = false, totpCode, deviceId }: LoginRequest = req.body;

      // Find user by email - explicitly select password and security question fields
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password +securityQuestion.answer +totpEnabled +securitySettings');
      
      // Debug: Log the user object to see what we're getting
      console.log('🔍 User Object Debug:');
      console.log('  User ID:', user?._id);
      console.log('  Email:', user?.email);
      console.log('  Security Question:', user?.securityQuestion);
      console.log('  Security Answer:', user?.securityQuestion?.answer);
      console.log('  Has Password:', !!user?.password);
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
        return;
      }

      // Check if account is locked (DISABLED FOR DEVELOPMENT)
      if (user.isLocked()) {
        console.log('🔒 Account lock check disabled for development');
        // DISABLED: Allow login even if account appears locked
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment login attempts
        await user.incrementLoginAttempts();
        
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
        return;
      }

      // Verify security question answer
      const isSecurityAnswerValid = await user.compareSecurityAnswer(securityAnswer);
      if (!isSecurityAnswerValid) {
        // Increment login attempts
        await user.incrementLoginAttempts();
        
        res.status(401).json({
          success: false,
          error: 'Invalid security answer',
          message: 'Security question answer is incorrect'
        });
        return;
      }

      // Check if email is verified
      if (!user.isVerified) {
        res.status(403).json({
          success: false,
          error: 'Email not verified',
          message: 'Please verify your email address before logging in. Check your inbox for a verification email or request a new one.',
          data: {
            email: user.email,
            needsVerification: true
          }
        });
        return;
      }

      // Extract device information
      const deviceInfo = SecurityService.extractDeviceInfo(req);
      
      // Check if device is trusted
      const isDeviceTrusted = await SecurityService.isDeviceTrusted(user._id.toString(), deviceInfo.deviceId);
      
      // If TOTP is enabled, verify TOTP code
      if ((user as any).totpEnabled) {
        if (!totpCode) {
          res.status(400).json({
            success: false,
            error: 'TOTP code required',
            message: 'Two-Factor Authentication is enabled. Please provide your TOTP code.',
            data: {
              requiresTotp: true
            }
          });
          return;
        }

        const isTotpValid = await SecurityService.verifyTotpLogin(user._id.toString(), totpCode);
        if (!isTotpValid) {
          res.status(401).json({
            success: false,
            error: 'Invalid TOTP code',
            message: 'Invalid TOTP code. Please try again.'
          });
          return;
        }
      }

      // Check if this is a new device and send alert if configured
      const shouldNotify = !isDeviceTrusted && (
        (user as any).securitySettings?.notifyOnNewDevice !== false // Default to true if not set
      );
      
      if (shouldNotify) {
        try {
          logger.info('Sending new device alert', {
            userId: user._id.toString(),
            email: user.email,
            deviceId: deviceInfo.deviceId,
            notifyOnNewDevice: (user as any).securitySettings?.notifyOnNewDevice
          });
          
          await SecurityService.sendNewDeviceAlert(user, deviceInfo, {
            userId: user._id.toString(),
            email: user.email,
            deviceInfo,
            success: true,
            timestamp: new Date()
          });
          
          logger.info('New device alert sent successfully', {
            userId: user._id.toString(),
            email: user.email
          });
        } catch (error) {
          logger.error('Error sending new device alert:', error);
          // Don't fail login if email sending fails
        }
      } else {
        logger.info('Skipping new device alert', {
          userId: user._id.toString(),
          isDeviceTrusted,
          notifyOnNewDevice: (user as any).securitySettings?.notifyOnNewDevice
        });
      }

      // Add device to trusted devices
      if (!isDeviceTrusted) {
        await SecurityService.addTrustedDevice(user._id.toString(), deviceInfo);
      }

      // Reset login attempts on successful login
      await user.resetLoginAttempts();

      // Generate tokens
      const tokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      // Store refresh token in Redis
      const refreshTokenExpiry = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
      await redisClient.set(
        `refresh_token:${user._id}`,
        tokens.refreshToken,
        refreshTokenExpiry
      );

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      logger.info(`User logged in: ${user.email}`);

      const requireKyc = user.isVerified && !user.isKycVerified;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          tokens: {
            accessToken: tokens.accessToken,
            expiresIn: tokens.expiresIn,
            refreshToken: tokens.refreshToken,
            refreshExpiresIn: tokens.refreshExpiresIn
          },
          requireKyc
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const userId = req.user?._id?.toString();

      if (token) {
        // Blacklist the access token
        logoutToken(token);
      }

      if (userId) {
        // Remove refresh token from Redis
        await redisClient.del(`refresh_token:${userId}`);
      }

      logger.info(`User logged out: ${req.user?.email}`);

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token required',
          message: 'Refresh token is required'
        });
        return;
      }

      // Verify refresh token
      const payload = verifyAccessToken(refreshToken);
      
      // Check if refresh token exists in Redis
      const storedToken = await redisClient.get(`refresh_token:${payload.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired'
        });
        return;
      }

      // Get user
      const user = await User.findById(payload.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
        return;
      }

      // Generate new tokens
      const tokens = generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      // Update refresh token in Redis
      await redisClient.set(
        `refresh_token:${user._id}`,
        tokens.refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );

      logger.info(`Token refreshed for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
          refreshToken: tokens.refreshToken,
          refreshExpiresIn: tokens.refreshExpiresIn
        }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        message: 'Invalid or expired refresh token'
      });
    }
  }

  /**
   * Get user profile
   * GET /api/v1/auth/me
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
        message: 'An error occurred while retrieving profile'
      });
    }
  }

  /**
   * Upload user avatar
   * POST /api/v1/auth/upload-avatar
   */
  static async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          message: 'Please select an avatar image to upload'
        });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
        return;
      }

      // Upload to Cloudinary
      const cloudinary = (await import('../../config/cloudinary')).default;
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(base64, {
        folder: 'transactlab/avatars',
        resource_type: 'image'
      });

      // Save absolute URL (secure_url)
      user.avatar = result.secure_url;
      await user.save();

      logger.info(`Avatar uploaded for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar: user.avatar
        }
      });
    } catch (error) {
      logger.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload avatar',
        message: 'An error occurred while uploading avatar'
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/v1/auth/profile
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { firstName, lastName, phone, avatar, preferences }: any = req.body;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
        return;
      }

      // Update fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone) user.phone = phone;
      if (avatar) user.avatar = avatar;
      if (preferences) {
        // Update preferences if provided
        if (preferences.notifications) {
          user.preferences.notifications = { ...user.preferences.notifications, ...preferences.notifications };
        }
        if (preferences.language) user.preferences.language = preferences.language;
        if (preferences.timezone) user.preferences.timezone = preferences.timezone;
        if (preferences.currency) user.preferences.currency = preferences.currency;
        if (preferences.dashboardTheme) user.preferences.dashboardTheme = preferences.dashboardTheme;
      }

      await user.save();

      logger.info(`Profile updated for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        message: 'An error occurred while updating profile'
      });
    }
  }

  /**
   * Verify email
   * GET /api/v1/auth/verify-email/:token
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Invalid verification token',
          message: 'Invalid or expired verification token'
        });
        return;
      }

      // Mark email as verified
      user.isVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      // Send welcome email
      try {
        const EmailService = (await import('../../services/notification/emailService')).default;
        await EmailService.sendWelcomeEmail(user.email, user.firstName);
        logger.info(`Welcome email sent to: ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
        // Don't fail verification if welcome email fails
      }

      logger.info(`Email verified for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Email verification failed',
        message: 'An error occurred during email verification'
      });
    }
  }

  /**
   * Resend email verification
   * POST /api/v1/auth/resend-verification
   */
  static async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found'
        });
        return;
      }

      if (user.isVerified) {
        res.status(400).json({
          success: false,
          error: 'Email already verified',
          message: 'Email is already verified'
        });
        return;
      }

      // Generate new verification token
      const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // Send verification email
      try {
        const EmailService = (await import('../../services/notification/emailService')).default;
        await EmailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
        logger.info(`Verification email resent to: ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        res.status(500).json({
          success: false,
          error: 'Failed to send verification email',
          message: 'An error occurred while sending verification email'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (error) {
      logger.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend verification',
        message: 'An error occurred while resending verification email'
      });
    }
  }

  /**
   * Initiate security question reset via email
   * POST /api/v1/auth/initiate-security-question-reset
   */
  static async initiateSecurityQuestionReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email required',
          message: 'Email address is required'
        });
        return;
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if user exists or not for security
        res.status(200).json({
          success: true,
          message: 'If an account with this email exists, a reset link has been sent'
        });
        return;
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Update only the reset token fields without triggering full validation
      await User.findByIdAndUpdate(user._id, {
        securityQuestionResetToken: resetToken,
        securityQuestionResetExpires: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
      }, { runValidators: false });

      // Send reset email
      try {
        const EmailService = (await import('../../services/notification/emailService')).default;
        await EmailService.sendSecurityQuestionResetEmail(user.email, user.firstName, resetToken);
        logger.info(`Security question reset email sent to: ${user.email}`);
      } catch (emailError) {
        logger.error('Failed to send security question reset email:', emailError);
        res.status(500).json({
          success: false,
          error: 'Failed to send reset email',
          message: 'An error occurred while sending reset email'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a reset link has been sent'
      });
    } catch (error) {
      logger.error('Initiate security question reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate reset',
        message: 'An error occurred while initiating security question reset'
      });
    }
  }

  /**
   * Reset security question with token verification
   * POST /api/v1/auth/reset-security-question
   */
  static async resetSecurityQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { token, newSecurityQuestion, newSecurityAnswer } = req.body;

      if (!token || !newSecurityQuestion || !newSecurityAnswer) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Token, new security question, and new answer are required'
        });
        return;
      }

      // Find user by reset token
      const user = await User.findOne({
        securityQuestionResetToken: token,
        securityQuestionResetExpires: { $gt: new Date() }
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired token',
          message: 'Reset token is invalid or has expired'
        });
        return;
      }

      // Update security question and clear reset token without triggering full validation
      await User.findByIdAndUpdate(user._id, {
        securityQuestion: {
          question: newSecurityQuestion,
          answer: newSecurityAnswer
        },
        securityQuestionResetToken: undefined,
        securityQuestionResetExpires: undefined
      }, { runValidators: false });

      logger.info(`Security question reset for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Security question updated successfully'
      });
    } catch (error) {
      logger.error('Security question reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Security question reset failed',
        message: 'An error occurred while resetting security question'
      });
    }
  }

  /**
   * Reset security question with password verification (legacy method)
   * POST /api/v1/auth/reset-security-question-password
   */
  static async resetSecurityQuestionWithPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, newSecurityQuestion, newSecurityAnswer } = req.body;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
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
        res.status(401).json({
          success: false,
          error: 'Invalid password',
          message: 'Password is incorrect'
        });
        return;
      }

      // Update security question without triggering full validation
      await User.findByIdAndUpdate(user._id, {
        securityQuestion: {
          question: newSecurityQuestion,
          answer: newSecurityAnswer
        }
      }, { runValidators: false });

      logger.info(`Security question reset for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Security question updated successfully'
      });
    } catch (error) {
      logger.error('Security question reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Security question reset failed',
        message: 'An error occurred while resetting security question'
      });
    }
  }

  /**
   * Unlock account for development (TEMPORARY)
   * POST /api/v1/auth/unlock-account
   */
  static async unlockAccount(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Missing email',
          message: 'Email is required'
        });
        return;
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'No user found with this email'
        });
        return;
      }

      // Unlock the account
      await user.unlockAccount();
      
      logger.info(`Account unlocked for development: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Account unlocked successfully'
      });
    } catch (error) {
      logger.error('Unlock account error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unlock account',
        message: 'An error occurred while unlocking the account'
      });
    }
  }

  /**
   * Delete user account permanently
   * DELETE /api/v1/auth/account
   */
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id?.toString();
      const { password, confirmation } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
        return;
      }

      if (!password) {
        res.status(400).json({
          success: false,
          error: 'Password required',
          message: 'Password is required to delete account'
        });
        return;
      }

      if (confirmation !== 'DELETE') {
        res.status(400).json({
          success: false,
          error: 'Invalid confirmation',
          message: 'Please type DELETE to confirm account deletion'
        });
        return;
      }

      // Find user and verify password
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
        res.status(401).json({
          success: false,
          error: 'Invalid password',
          message: 'Password is incorrect'
        });
        return;
      }

      // Clean up user data before deletion
      try {
        // Remove refresh token from Redis
        await redisClient.del(`refresh_token:${userId}`);
        
        // TODO: Add cleanup for other user-related data
        // - Delete sandbox data (transactions, products, etc.)
        // - Delete uploaded files
        // - Delete webhooks
        // - Delete API keys
        // - Delete team memberships
        // - Delete audit logs
        
        logger.info(`Cleaning up data for user: ${user.email}`);
      } catch (cleanupError) {
        logger.error('Error during account cleanup:', cleanupError);
        // Continue with deletion even if cleanup fails
      }

      // Delete the user account
      await User.findByIdAndDelete(userId);
      
      logger.info(`Account deleted permanently: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      logger.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete account',
        message: 'An error occurred while deleting the account'
      });
    }
  }
}

export default AuthController; 