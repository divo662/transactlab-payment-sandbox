import { Request, Response, NextFunction } from 'express';
import { ApiKey, Merchant } from '../../models';
import { logger } from '../../utils/helpers/logger';
import { redisClient } from '../../config/redis';
import '../../utils/types/express'; // Import express type extensions

/**
 * API Key Authentication Middleware
 * Validates API key and attaches merchant to request
 */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const secretKey = req.headers['x-secret-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'API key is required',
        code: 'API_KEY_REQUIRED'
      });
      return;
    }

    // Check cache first
    const cachedApiKey = await redisClient.get(`api_key:${apiKey}`);
    let apiKeyData;

    if (cachedApiKey) {
      apiKeyData = JSON.parse(cachedApiKey);
    } else {
      // Get API key from database
      apiKeyData = await ApiKey.findOne({ 
        key: apiKey, 
        isActive: true, 
        isRevoked: false 
      }).populate('merchantId');

      if (!apiKeyData) {
        res.status(401).json({
          success: false,
          message: 'Invalid API key',
          code: 'INVALID_API_KEY'
        });
        return;
      }

      // Cache API key for 5 minutes
      await redisClient.set(`api_key:${apiKey}`, JSON.stringify(apiKeyData), 300);
    }

    // Validate secret key if provided
    if (secretKey && apiKeyData.secret !== secretKey) {
      res.status(401).json({
        success: false,
        message: 'Invalid secret key',
        code: 'INVALID_SECRET_KEY'
      });
      return;
    }

    // Check if merchant is active
    if (!apiKeyData.merchantId || !apiKeyData.merchantId.isActive) {
      res.status(401).json({
        success: false,
        message: 'Merchant account is inactive',
        code: 'MERCHANT_INACTIVE'
      });
      return;
    }

    // Check IP restrictions
    if (apiKeyData.ipWhitelist && apiKeyData.ipWhitelist.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      if (!apiKeyData.ipWhitelist.includes(clientIP)) {
        res.status(403).json({
          success: false,
          message: 'IP address not allowed',
          code: 'IP_NOT_ALLOWED'
        });
        return;
      }
    }

    // Update last used timestamp
    await ApiKey.findByIdAndUpdate(apiKeyData._id, {
      lastUsed: new Date(),
      $inc: { usageCount: 1 }
    });

    // Attach API key and merchant to request
    req.apiKey = apiKeyData;
    req.merchant = apiKeyData.merchantId;
    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * API Key Permission Middleware
 * Checks if API key has required permissions
 */
export const requireApiKeyPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.apiKey) {
        res.status(401).json({
          success: false,
          message: 'API key authentication required',
          code: 'API_KEY_REQUIRED'
        });
        return;
      }

      // Check if API key has the required permission
      if (!req.apiKey.permissions.includes(permission)) {
        res.status(403).json({
          success: false,
          message: `Permission '${permission}' required`,
          code: 'PERMISSION_DENIED'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('API key permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

/**
 * API Key Rate Limit Middleware
 * Checks API key usage limits
 */
export const checkApiKeyLimits = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.apiKey) {
      return next();
    }

    const apiKeyId = req.apiKey._id.toString();
    const currentUsage = await redisClient.get(`api_usage:${apiKeyId}`);

    if (currentUsage) {
      const usage = parseInt(currentUsage);
      if (usage >= req.apiKey.restrictions.rateLimit.requestsPerMinute) {
        res.status(429).json({
          success: false,
          message: 'API rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED'
        });
        return;
      }
    }

    // Increment usage counter
    await redisClient.incr(`api_usage:${apiKeyId}`);
    await redisClient.expire(`api_usage:${apiKeyId}`, 3600); // 1 hour window

    next();
  } catch (error) {
    logger.error('API key rate limit check error:', error);
    next(); // Continue on error
  }
};

/**
 * API Key Validation Middleware
 * Validates API key format and structure
 */
export const validateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'API key is required',
        code: 'API_KEY_REQUIRED'
      });
      return;
    }

    // Validate API key format
    if (!/^pk_(live|test)_[a-zA-Z0-9]{32}$/.test(apiKey)) {
      res.status(400).json({
        success: false,
        message: 'Invalid API key format',
        code: 'INVALID_API_KEY_FORMAT'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('API key validation error:', error);
    res.status(500).json({
      success: false,
      message: 'API key validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

export default {
  authenticateApiKey,
  requireApiKeyPermission,
  checkApiKeyLimits,
  validateApiKey
}; 