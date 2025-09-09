import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import User from '../../models/User';
import { logger } from '../../utils/helpers/logger';
import { JWT_CONFIG, generateAccessToken } from '../../config/jwt';

export interface AuthResult {
  success: boolean;
  user?: any;
  merchant?: any;
  token?: string;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  businessName?: string;
  businessEmail?: string;
  industry?: string;
}

/**
 * Authentication Service
 * Handles user registration, login, logout, and session management
 */
export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email.toLowerCase() });
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      // Create user
      const user = new User({
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: 'user'
      });

      await user.save();

      // All users are now merchants with business data built into the User model

      // Generate JWT token
      const token = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info('User registered successfully', {
        userId: user._id,
        email: user.email,
        hasMerchant: true // All users are now merchants
      });

      return {
        success: true,
        user: userResponse,
        token,
        message: 'Registration successful'
      };

    } catch (error) {
      logger.error('Registration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: data.email
      });

      return {
        success: false,
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Find user by email
      const user = await User.findOne({ email: credentials.email.toLowerCase() });
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // All users are now merchants with business data built into the User model

      // Generate JWT token
      const token = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info('User logged in successfully', {
        userId: user._id,
        email: user.email,
        hasMerchant: true // All users are now merchants
      });

      return {
        success: true,
        user: userResponse,
        token,
        message: 'Login successful'
      };

    } catch (error) {
      logger.error('Login failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: credentials.email
      });

      return {
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(userId: Types.ObjectId): Promise<AuthResult> {
    try {
      // Update last logout
      await User.findByIdAndUpdate(userId, {
        lastLogout: new Date()
      });

      logger.info('User logged out successfully', {
        userId
      });

      return {
        success: true,
        message: 'Logout successful'
      };

    } catch (error) {
      logger.error('Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });

      return {
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify JWT token
   */
  static async verifyToken(token: string): Promise<AuthResult> {
    try {
      const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET) as any;
      
      // Check if user still exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated'
        };
      }

      // All users are now merchants with business data built into the User model

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return {
        success: true,
        user: userResponse,
        message: 'Token verified successfully'
      };

    } catch (error) {
      logger.error('Token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Invalid token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Refresh JWT token
   */
  static async refreshToken(userId: Types.ObjectId): Promise<AuthResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // All users are now merchants with business data built into the User model

      // Generate new JWT token
      const token = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });

      logger.info('Token refreshed successfully', {
        userId: user._id,
        email: user.email
      });

      return {
        success: true,
        token,
        message: 'Token refreshed successfully'
      };

    } catch (error) {
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });

      return {
        success: false,
        message: 'Token refresh failed',
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
  ): Promise<AuthResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedNewPassword;
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
        message: 'Password change failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId: Types.ObjectId): Promise<AuthResult> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // All users are now merchants with business data built into the User model

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return {
        success: true,
        user: userResponse,
        message: 'Profile retrieved successfully'
      };

    } catch (error) {
      logger.error('Get user profile failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });

      return {
        success: false,
        message: 'Failed to get user profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: Types.ObjectId, 
    updateData: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      avatar: string;
    }>
  ): Promise<AuthResult> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          ...updateData,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info('User profile updated successfully', {
        userId: user._id,
        email: user.email
      });

      return {
        success: true,
        user: userResponse,
        message: 'Profile updated successfully'
      };

    } catch (error) {
      logger.error('Update user profile failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });

      return {
        success: false,
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default AuthService; 