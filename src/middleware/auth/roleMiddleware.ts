import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/helpers/logger';

/**
 * Role-Based Access Control Middleware
 * Checks if user has required role(s)
 */
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      const userRole = req.user.role;
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      if (!requiredRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role verification failed',
        code: 'ROLE_VERIFICATION_ERROR'
      });
    }
  };
};

/**
 * Admin Only Middleware
 * Restricts access to admin users only
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  requireRole('admin')(req, res, next);
};

/**
 * Merchant Only Middleware
 * Restricts access to merchant users only
 */
export const requireMerchant = (req: Request, res: Response, next: NextFunction): void => {
  requireRole(['merchant', 'admin'])(req, res, next);
};

/**
 * User Only Middleware
 * Restricts access to authenticated users only
 */
export const requireUser = (req: Request, res: Response, next: NextFunction): void => {
  requireRole(['user', 'merchant', 'admin'])(req, res, next);
};

/**
 * Self or Admin Middleware
 * Allows users to access their own data or admin to access any data
 */
export const requireSelfOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const userId = req.params.id || req.params.userId;
    
    // Admin can access any user's data
    if (req.user.role === 'admin') {
      return next();
    }

    // Users can only access their own data
    if (req.user._id.toString() === userId) {
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own data.',
      code: 'ACCESS_DENIED'
    });
  } catch (error) {
    logger.error('Self or admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Access verification failed',
      code: 'ACCESS_VERIFICATION_ERROR'
    });
  }
};

/**
 * Merchant or Admin Middleware
 * Allows merchants to access their own data or admin to access any merchant data
 */
export const requireMerchantOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    const merchantId = req.params.id || req.params.merchantId;
    
    // Admin can access any merchant's data
    if (req.user.role === 'admin') {
      return next();
    }

    // Users can only access their own data
    if (req.user.role === 'user' && req.user.merchantId?.toString() === merchantId) {
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own merchant data.',
      code: 'ACCESS_DENIED'
    });
  } catch (error) {
    logger.error('Merchant or admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Access verification failed',
      code: 'ACCESS_VERIFICATION_ERROR'
    });
  }
};

/**
 * Permission-Based Access Control Middleware
 * Checks if user has required permission(s)
 */
export const requirePermission = (permissions: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      const userPermissions = req.user.permissions || [];
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required permission(s): ${requiredPermissions.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission verification failed',
        code: 'PERMISSION_VERIFICATION_ERROR'
      });
    }
  };
};

/**
 * Tier-Based Access Control Middleware
 * Checks if user's tier allows access to specific features
 */
export const requireTier = (requiredTier: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      const userTier = req.user.tier || 'free';
      const tierHierarchy = ['free', 'basic', 'premium', 'enterprise'];
      
      const userTierIndex = tierHierarchy.indexOf(userTier);
      const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

      if (userTierIndex < requiredTierIndex) {
        res.status(403).json({
          success: false,
          message: `This feature requires ${requiredTier} tier or higher`,
          code: 'INSUFFICIENT_TIER'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Tier check error:', error);
      res.status(500).json({
        success: false,
        message: 'Tier verification failed',
        code: 'TIER_VERIFICATION_ERROR'
      });
    }
  };
};

export default {
  requireRole,
  requireAdmin,
  requireMerchant,
  requireUser,
  requireSelfOrAdmin,
  requireMerchantOrAdmin,
  requirePermission,
  requireTier
}; 