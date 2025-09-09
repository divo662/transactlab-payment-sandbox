import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../../config/jwt';
import { redisClient } from '../../config/redis';
import { logger } from '../../utils/helpers/logger';
import { User } from '../../models';
import { TokenBlacklist } from '../../config/jwt';
import '../../utils/types/express'; // Import express type extensions

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
        code: 'TOKEN_REQUIRED'
      });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.has(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET) as any;
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }

    // Attach user to request
    req.user = {
      _id: user._id as any,
      email: user.email,
      role: user.role,
      permissions: decoded.permissions || [],
      tier: decoded.tier || 'free'
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      logger.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.has(token);
    if (isBlacklisted) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET) as any;
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (user && user.isActive) {
      req.user = {
        _id: user._id as any,
        email: user.email,
        role: user.role,
        permissions: decoded.permissions || [],
        tier: decoded.tier || 'free'
      };
    }

    next();
  } catch (error) {
    // Silently continue if token is invalid
    next();
  }
};

/**
 * Refresh Token Authentication Middleware
 * Verifies refresh token for token refresh operations
 */
export const authenticateRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token is required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
      return;
    }

    // Check if refresh token exists in Redis
    const storedToken = await redisClient.get(`refresh_token:${refreshToken}`);
    if (!storedToken) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_TOKEN_SECRET) as any;
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    req.user = {
      _id: user._id as any,
      email: user.email,
      role: user.role,
      permissions: decoded.permissions || [],
      tier: decoded.tier || 'free'
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    } else {
      logger.error('Refresh token authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      });
    }
  }
};

export default {
  authenticateToken,
  optionalAuth,
  authenticateRefreshToken
}; 