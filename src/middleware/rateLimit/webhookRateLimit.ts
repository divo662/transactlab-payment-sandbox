import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../../utils/helpers/logger';
import { redisClient } from '../../config/redis';

/**
 * Webhook delivery rate limiter
 * Limits webhook delivery attempts to prevent abuse
 */
export const webhookDeliveryRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 webhook deliveries per minute
  message: {
    success: false,
    message: 'Too many webhook delivery attempts. Please try again later.',
    code: 'WEBHOOK_DELIVERY_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use webhook ID or merchant ID for rate limiting
    const webhookId = req.params.webhookId || req.body.webhook_id;
    const merchantId = req.merchant?._id;
    return webhookId || merchantId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users and trusted IPs
    const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
    return req.user?.role === 'admin' || trustedIPs.includes(req.ip);
  },
  handler: (req, res) => {
    logger.warn(`Webhook delivery rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      webhookId: req.params.webhookId || req.body.webhook_id,
      merchantId: req.merchant?._id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many webhook delivery attempts. Please try again in 1 minute.',
      code: 'WEBHOOK_DELIVERY_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

/**
 * Webhook retry rate limiter
 * Limits webhook retry attempts to prevent infinite loops
 */
export const webhookRetryRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 retry attempts per 5 minutes
  message: {
    success: false,
    message: 'Too many webhook retry attempts. Please try again later.',
    code: 'WEBHOOK_RETRY_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use webhook ID for retry rate limiting
    const webhookId = req.params.webhookId || req.body.webhook_id;
    return webhookId || req.ip;
  },
  skip: (req) => {
    // Skip for admin users
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn(`Webhook retry rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      webhookId: req.params.webhookId || req.body.webhook_id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many webhook retry attempts. Please try again in 5 minutes.',
      code: 'WEBHOOK_RETRY_RATE_LIMIT_EXCEEDED',
      retryAfter: 300
    });
  }
});

/**
 * Webhook test rate limiter
 * Limits webhook testing to prevent abuse
 */
export const webhookTestRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 test attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many webhook test attempts. Please try again later.',
    code: 'WEBHOOK_TEST_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use merchant ID for test rate limiting
    const merchantId = req.merchant?._id;
    const userId = req.user?._id;
    return merchantId?.toString() || userId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn(`Webhook test rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      merchantId: req.merchant?._id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many webhook test attempts. Please try again in 15 minutes.',
      code: 'WEBHOOK_TEST_RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  }
});

/**
 * Webhook configuration rate limiter
 * Limits webhook configuration changes
 */
export const webhookConfigRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 configuration changes per 15 minutes
  message: {
    success: false,
    message: 'Too many webhook configuration changes. Please try again later.',
    code: 'WEBHOOK_CONFIG_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use merchant ID for config rate limiting
    const merchantId = req.merchant?._id;
    const userId = req.user?._id;
    return merchantId?.toString() || userId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn(`Webhook config rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      merchantId: req.merchant?._id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many webhook configuration changes. Please try again in 15 minutes.',
      code: 'WEBHOOK_CONFIG_RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  }
});

/**
 * Webhook signature verification rate limiter
 * Limits signature verification attempts
 */
export const webhookSignatureRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 signature verifications per minute
  message: {
    success: false,
    message: 'Too many signature verification attempts. Please try again later.',
    code: 'WEBHOOK_SIGNATURE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address for signature verification rate limiting
    return req.ip;
  },
  skip: (req) => {
    // Skip for trusted IPs
    const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
    return trustedIPs.includes(req.ip);
  },
  handler: (req, res) => {
    logger.warn(`Webhook signature rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many signature verification attempts. Please try again in 1 minute.',
      code: 'WEBHOOK_SIGNATURE_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

/**
 * Webhook health check rate limiter
 * Limits health check requests
 */
export const webhookHealthRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 health checks per minute
  message: {
    success: false,
    message: 'Too many health check requests. Please try again later.',
    code: 'WEBHOOK_HEALTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address for health check rate limiting
    return req.ip;
  },
  skip: (req) => {
    // Skip for trusted IPs
    const trustedIPs = ['127.0.0.1', '::1', 'localhost'];
    return trustedIPs.includes(req.ip);
  },
  handler: (req, res) => {
    logger.warn(`Webhook health rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many health check requests. Please try again in 1 minute.',
      code: 'WEBHOOK_HEALTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

/**
 * Webhook log retrieval rate limiter
 * Limits webhook log requests
 */
export const webhookLogRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 log requests per 5 minutes
  message: {
    success: false,
    message: 'Too many webhook log requests. Please try again later.',
    code: 'WEBHOOK_LOG_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use merchant ID for log rate limiting
    const merchantId = req.merchant?._id;
    const userId = req.user?._id;
    return merchantId?.toString() || userId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn(`Webhook log rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      merchantId: req.merchant?._id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many webhook log requests. Please try again in 5 minutes.',
      code: 'WEBHOOK_LOG_RATE_LIMIT_EXCEEDED',
      retryAfter: 300
    });
  }
});

/**
 * Webhook event rate limiter
 * Limits webhook event processing
 */
export const webhookEventRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 events per minute
  message: {
    success: false,
    message: 'Too many webhook events. Please try again later.',
    code: 'WEBHOOK_EVENT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use merchant ID for event rate limiting
    const merchantId = req.merchant?._id;
    return merchantId?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip for admin users
    return req.user?.role === 'admin';
  },
  handler: (req, res) => {
    logger.warn(`Webhook event rate limit exceeded for ${req.ip}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      merchantId: req.merchant?._id
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many webhook events. Please try again in 1 minute.',
      code: 'WEBHOOK_EVENT_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

export default {
  webhookDeliveryRateLimiter,
  webhookRetryRateLimiter,
  webhookTestRateLimiter,
  webhookConfigRateLimiter,
  webhookSignatureRateLimiter,
  webhookHealthRateLimiter,
  webhookLogRateLimiter,
  webhookEventRateLimiter
}; 