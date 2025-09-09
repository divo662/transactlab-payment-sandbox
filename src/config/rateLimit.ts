import rateLimit from 'express-rate-limit';
import { logger } from '../utils/helpers/logger';

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  // General API rate limits
  GENERAL: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
    max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // 100 requests per window
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_CONFIG.GENERAL.windowMs / 1000)
      });
    }
  },

  // Authentication endpoints (more strict)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many authentication attempts',
        message: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: 900
      });
    }
  },

  // Payment endpoints (very strict)
  PAYMENT: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 payment attempts per minute
    message: {
      error: 'Too many payment attempts, please try again later.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      logger.warn(`Payment rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many payment attempts',
        message: 'Too many payment attempts. Please try again in 1 minute.',
        retryAfter: 60
      });
    }
  },

  // Webhook endpoints (very permissive)
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 webhook deliveries per minute
    message: {
      error: 'Too many webhook deliveries, please reduce frequency.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      logger.warn(`Webhook rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many webhook deliveries',
        message: 'Webhook delivery rate too high. Please reduce frequency.',
        retryAfter: 60
      });
    }
  },

  // API key endpoints (moderate)
  API_KEY: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 API key operations per minute
    message: {
      error: 'Too many API key operations, please try again later.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      logger.warn(`API key rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many API key operations',
        message: 'Too many API key operations. Please try again in 1 minute.',
        retryAfter: 60
      });
    }
  },

  // File upload endpoints
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: {
      error: 'Too many file uploads, please try again later.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many file uploads',
        message: 'Too many file uploads. Please try again in 1 minute.',
        retryAfter: 60
      });
    }
  },

  // Analytics endpoints (moderate)
  ANALYTICS: {
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 analytics requests per minute
    message: {
      error: 'Too many analytics requests, please try again later.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      logger.warn(`Analytics rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Too many analytics requests',
        message: 'Too many analytics requests. Please try again in 1 minute.',
        retryAfter: 60
      });
    }
  }
};

// Create rate limiters
export const createRateLimiters = () => {
  return {
    // General API rate limiter
    general: rateLimit(RATE_LIMIT_CONFIG.GENERAL),

    // Authentication rate limiter
    auth: rateLimit({
      ...RATE_LIMIT_CONFIG.AUTH,
      keyGenerator: (req) => {
        // Use IP + user agent for auth rate limiting
        return `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
      }
    }),

    // Payment rate limiter
    payment: rateLimit({
      ...RATE_LIMIT_CONFIG.PAYMENT,
      keyGenerator: (req) => {
        // Use IP + merchant ID for payment rate limiting
        const merchantId = req.headers['x-merchant-id'] || req.body?.merchantId || 'anonymous';
        return `${req.ip}-${merchantId}`;
      }
    }),

    // Webhook rate limiter
    webhook: rateLimit({
      ...RATE_LIMIT_CONFIG.WEBHOOK,
      keyGenerator: (req) => {
        // Use webhook URL for webhook rate limiting
        const webhookUrl = req.headers['x-webhook-url'] || req.body?.webhookUrl || req.ip;
        return `webhook-${webhookUrl}`;
      }
    }),

    // API key rate limiter
    apiKey: rateLimit({
      ...RATE_LIMIT_CONFIG.API_KEY,
      keyGenerator: (req) => {
        // Use API key for rate limiting
        const apiKey = req.headers['x-api-key'] || req.query['apiKey'] || 'anonymous';
        return `apikey-${apiKey}`;
      }
    }),

    // Upload rate limiter
    upload: rateLimit({
      ...RATE_LIMIT_CONFIG.UPLOAD,
      keyGenerator: (req) => {
        // Use IP + user ID for upload rate limiting
        const userId = req.user?._id?.toString() || req.headers['x-user-id'] || 'anonymous';
        return `${req.ip}-${userId}`;
      }
    }),

    // Analytics rate limiter
    analytics: rateLimit({
      ...RATE_LIMIT_CONFIG.ANALYTICS,
      keyGenerator: (req) => {
        // Use merchant ID for analytics rate limiting
        const merchantId = req.headers['x-merchant-id'] || req.query['merchantId'] || req.user?.['merchantId'] || 'anonymous';
        return `analytics-${merchantId}`;
      }
    })
  };
};

// Dynamic rate limiter based on user tier
export const createDynamicRateLimiter = (tier: 'free' | 'basic' | 'premium' | 'enterprise') => {
  const limits = {
    free: { windowMs: 60 * 1000, max: 10 },
    basic: { windowMs: 60 * 1000, max: 50 },
    premium: { windowMs: 60 * 1000, max: 200 },
    enterprise: { windowMs: 60 * 1000, max: 1000 }
  };

  const config = limits[tier];

  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      error: `Rate limit exceeded for ${tier} tier`,
      retryAfter: `${Math.ceil(config.windowMs / 1000)} seconds`
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: any, res: any) => {
      logger.warn(`Dynamic rate limit exceeded for ${tier} tier, IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Rate limit exceeded for ${tier} tier. Please upgrade your plan for higher limits.`,
        retryAfter: Math.ceil(config.windowMs / 1000),
        tier,
        currentLimit: config.max,
        windowMs: config.windowMs
      });
    },
    keyGenerator: (req) => {
      const userId = req.user?._id?.toString() || req.headers['x-user-id'] || 'anonymous';
      return `${tier}-${userId}`;
    }
  });
};

// Rate limit bypass for trusted IPs
export const isTrustedIP = (ip: string): boolean => {
  const trustedIPs = process.env['TRUSTED_IPS']?.split(',') || [];
  return trustedIPs.includes(ip);
};

// Rate limit bypass for admin users
export const isAdminUser = (req: any): boolean => {
  return req.user?.role === 'admin';
};

// Custom rate limiter that bypasses for trusted sources
export const createTrustedRateLimiter = (baseConfig: any) => {
  return rateLimit({
    ...baseConfig,
    skip: (req) => {
      return isTrustedIP(req.ip || '') || isAdminUser(req);
    }
  });
};

// Export rate limiters
export const rateLimiters = createRateLimiters(); 