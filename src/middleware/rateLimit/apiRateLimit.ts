import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../../utils/helpers/logger';
import { redisClient } from '../../config/redis';

/**
 * Dynamic rate limiter based on user tier
 */
export const createDynamicRateLimiter = (tier: 'free' | 'basic' | 'premium' | 'enterprise') => {
  const limits = {
    free: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    basic: { windowMs: 15 * 60 * 1000, max: 500 }, // 500 requests per 15 minutes
    premium: { windowMs: 15 * 60 * 1000, max: 2000 }, // 2000 requests per 15 minutes
    enterprise: { windowMs: 15 * 60 * 1000, max: 10000 } // 10000 requests per 15 minutes
  };

  const config = limits[tier];

  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      message: `Rate limit exceeded. ${tier} tier allows ${config.max} requests per ${config.windowMs / 60000} minutes.`,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use API key or user ID for rate limiting
      const apiKey = req.headers['x-api-key'] as string;
      const userId = req.user?._id;
      return apiKey || userId?.toString() || req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for admin users
      return req.user?.role === 'admin';
    },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${req.ip}`, {
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });
      
      res.status(429).json({
        success: false,
        message: `Rate limit exceeded. ${tier} tier allows ${config.max} requests per ${config.windowMs / 60000} minutes.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(config.windowMs / 1000)
      });
    }
  });
};

/**
 * Authentication rate limiter
 * Stricter limits for auth endpoints to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address for auth rate limiting
    return req.ip;
  },
  skip: (req) => {
    // Skip for trusted IPs
    const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
    return trustedIPs.includes(req.ip);
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  }
});

/**
 * Payment rate limiter
 * Moderate limits for payment endpoints
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 payment requests per minute
  message: {
    success: false,
    message: 'Too many payment requests. Please try again later.',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use merchant ID or API key for payment rate limiting
    const apiKey = req.headers['x-api-key'] as string;
    const merchantId = req.merchant?._id;
    return apiKey || merchantId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn(`Payment rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      merchantId: req.merchant?._id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many payment requests. Please try again in 1 minute.',
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

/**
 * Webhook rate limiter
 * Higher limits for webhook endpoints
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 webhook requests per minute
  message: {
    success: false,
    message: 'Too many webhook requests. Please try again later.',
    code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use merchant ID for webhook rate limiting
    const merchantId = req.merchant?._id;
    return merchantId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn(`Webhook rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      merchantId: req.merchant?._id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many webhook requests. Please try again in 1 minute.',
      code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

/**
 * Analytics rate limiter
 * Lower limits for analytics endpoints (resource intensive)
 */
export const analyticsRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 analytics requests per 5 minutes
  message: {
    success: false,
    message: 'Too many analytics requests. Please try again later.',
    code: 'ANALYTICS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use merchant ID for analytics rate limiting
    const merchantId = req.merchant?._id;
    const userId = req.user?._id;
    return merchantId?.toString() || userId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn(`Analytics rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      merchantId: req.merchant?._id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many analytics requests. Please try again in 5 minutes.',
      code: 'ANALYTICS_RATE_LIMIT_EXCEEDED',
      retryAfter: 300
    });
  }
});

/**
 * Upload rate limiter
 * Strict limits for file uploads
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 uploads per minute
  message: {
    success: false,
    message: 'Too many upload requests. Please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for upload rate limiting
    const userId = req.user?._id;
    return userId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      userId: req.user?._id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many upload requests. Please try again in 1 minute.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

/**
 * API key rate limiter
 * Moderate limits for API key management
 */
export const apiKeyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 API key operations per 15 minutes
  message: {
    success: false,
    message: 'Too many API key operations. Please try again later.',
    code: 'API_KEY_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use merchant ID for API key rate limiting
    const merchantId = req.merchant?._id;
    const userId = req.user?._id;
    return merchantId?.toString() || userId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn(`API key rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      merchantId: req.merchant?._id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many API key operations. Please try again in 15 minutes.',
      code: 'API_KEY_RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  }
});

/**
 * General rate limiter
 * Default rate limiting for all other endpoints
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use API key, user ID, or IP for general rate limiting
    const apiKey = req.headers['x-api-key'] as string;
    const userId = req.user?._id;
    return apiKey || userId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users and trusted IPs
    const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
    return req.user?.role === 'admin' || trustedIPs.includes(req.ip);
  },
  handler: (req, res) => {
    logger.warn(`General rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again in 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  }
});

/**
 * Trusted IP bypass middleware
 */
export const isTrustedIP = (ip: string): boolean => {
  const trustedIPs = [
    '127.0.0.1',
    '::1',
    'localhost',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16'
  ];
  
  return trustedIPs.some(trustedIP => {
    if (trustedIP.includes('/')) {
      // CIDR notation
      return ip.startsWith(trustedIP.split('/')[0]);
    }
    return ip === trustedIP;
  });
};

/**
 * Admin user bypass middleware
 */
export const isAdminUser = (req: Request): boolean => {
  return req.user?.role === 'admin';
};

export default {
  createDynamicRateLimiter,
  authRateLimiter,
  paymentRateLimiter,
  webhookRateLimiter,
  analyticsRateLimiter,
  uploadRateLimiter,
  apiKeyRateLimiter,
  generalRateLimiter,
  isTrustedIP,
  isAdminUser
}; 