import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from '../../utils/helpers/logger';

/**
 * Helmet security middleware configuration
 * Sets various HTTP headers to help protect the app
 */
export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://api.transactlab.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false,
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Frameguard
  frameguard: { action: "deny" },
  
  // Hide Powered-By
  hidePoweredBy: true,
  
  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // NoSniff
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  
  // XSS Protection
  xssFilter: true
});

/**
 * Custom security headers middleware
 */
export const customSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add API-specific headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId());
  
  next();
};

/**
 * API-specific security headers
 */
export const apiSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Add API-specific security headers
  res.setHeader('X-API-Rate-Limit', '1000');
  res.setHeader('X-API-Rate-Limit-Remaining', '999');
  res.setHeader('X-API-Rate-Limit-Reset', '1640995200');
  
  // Add CORS headers for API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  next();
};

/**
 * Webhook-specific security headers
 */
export const webhookSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Add webhook-specific security headers
  res.setHeader('X-Webhook-Signature', 'sha256');
  res.setHeader('X-Webhook-Timestamp', Date.now().toString());
  
  // Add CORS headers for webhooks
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-TransactLab-Signature, X-TransactLab-Timestamp');
  
  next();
};

/**
 * Admin-specific security headers
 */
export const adminSecurityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Add admin-specific security headers
  res.setHeader('X-Admin-Panel', 'true');
  res.setHeader('X-Admin-Version', '1.0');
  
  // Stricter CORS for admin
  const allowedOrigins = [
    'https://admin.transactlab.com',
    'https://dashboard.transactlab.com',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  next();
};

/**
 * CSP middleware for different environments
 */
export const cspMiddleware = (environment: 'development' | 'production' | 'staging') => {
  const cspConfigs = {
    development: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "http://localhost:*"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http://localhost:*"],
        connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
        imgSrc: ["'self'", "data:", "http://localhost:*"],
        fontSrc: ["'self'", "http://localhost:*"]
      }
    },
    production: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.transactlab.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    staging: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://staging-api.transactlab.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    }
  };
  
  return helmet.contentSecurityPolicy(cspConfigs[environment]);
};

/**
 * Security logging middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Log security-related headers
  const securityHeaders = {
    'user-agent': req.get('User-Agent'),
    'x-forwarded-for': req.get('X-Forwarded-For'),
    'x-real-ip': req.get('X-Real-IP'),
    'x-forwarded-proto': req.get('X-Forwarded-Proto'),
    'origin': req.get('Origin'),
    'referer': req.get('Referer')
  };
  
  logger.info('Security headers', {
    ip: req.ip,
    method: req.method,
    path: req.path,
    headers: securityHeaders
  });
  
  next();
};

/**
 * Request ID generator
 */
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Security validation middleware
 */
export const securityValidation = (req: Request, res: Response, next: NextFunction): void => {
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-host',
    'x-original-url',
    'x-rewrite-url'
  ];
  
  const hasSuspiciousHeaders = suspiciousHeaders.some(header => 
    req.headers[header] !== undefined
  );
  
  if (hasSuspiciousHeaders) {
    logger.warn('Suspicious headers detected', {
      ip: req.ip,
      headers: req.headers,
      path: req.path
    });
    
    res.status(400).json({
      success: false,
      message: 'Invalid request headers',
      code: 'INVALID_HEADERS'
    });
    return;
  }
  
  // Check for suspicious user agents
  const userAgent = req.get('User-Agent') || '';
  const suspiciousUserAgents = [
    'curl',
    'wget',
    'python',
    'bot',
    'crawler',
    'spider'
  ];
  
  const isSuspiciousUserAgent = suspiciousUserAgents.some(agent => 
    userAgent.toLowerCase().includes(agent)
  );
  
  if (isSuspiciousUserAgent) {
    logger.info('Suspicious user agent detected', {
      ip: req.ip,
      userAgent,
      path: req.path
    });
  }
  
  next();
};

export default {
  helmetConfig,
  customSecurityHeaders,
  apiSecurityHeaders,
  webhookSecurityHeaders,
  adminSecurityHeaders,
  cspMiddleware,
  securityLogger,
  securityValidation
}; 