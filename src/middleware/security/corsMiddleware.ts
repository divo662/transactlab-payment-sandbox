import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from '../../utils/helpers/logger';
import { ENV } from '../../config/environment';

/**
 * CORS configuration options
 */
export const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ENV.CORS_ORIGINS;
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check for wildcard subdomains
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.substring(2);
        return origin.endsWith(domain);
      }
      return false;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  
  credentials: true, // Allow credentials (cookies, authorization headers)
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Secret-Key',
    'X-TransactLab-Signature',
    'X-TransactLab-Timestamp'
  ],
  
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  
  maxAge: 86400, // 24 hours
  
  preflightContinue: false,
  
  optionsSuccessStatus: 204
};

/**
 * CORS middleware for API routes
 */
export const apiCors = cors({
  ...corsOptions,
  origin: function (origin, callback) {
    const apiAllowedOrigins = [
      ...ENV.CORS_ORIGINS,
      'https://api.transactlab.com',
      'https://sandbox-api.transactlab.com'
    ];
    
    if (!origin) {
      return callback(null, true);
    }

    if (apiAllowedOrigins.includes('*') || apiAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`API CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by API CORS'));
  }
});

/**
 * CORS middleware for webhook endpoints
 * More permissive for webhook delivery
 */
export const webhookCors = cors({
  ...corsOptions,
  origin: function (origin, callback) {
    const webhookAllowedOrigins = [
      ...ENV.CORS_ORIGINS,
      '*', // Allow all origins for webhooks
      'https://webhook.transactlab.com'
    ];
    
    if (!origin) {
      return callback(null, true);
    }

    if (webhookAllowedOrigins.includes('*') || webhookAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`Webhook CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by Webhook CORS'));
  },
  
  methods: ['POST', 'OPTIONS'], // Only allow POST for webhooks
  
  allowedHeaders: [
    'Content-Type',
    'X-TransactLab-Signature',
    'X-TransactLab-Timestamp',
    'User-Agent'
  ]
});

/**
 * CORS middleware for admin routes
 * Restrictive for admin endpoints
 */
export const adminCors = cors({
  ...corsOptions,
  origin: function (origin, callback) {
    const adminAllowedOrigins = [
      'https://admin.transactlab.com',
      'https://dashboard.transactlab.com',
      'http://localhost:3000', // Development
      'http://localhost:3001'  // Development
    ];
    
    if (!origin) {
      return callback(null, true);
    }

    if (adminAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`Admin CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by Admin CORS'));
  },
  
  credentials: true,
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ]
});

/**
 * CORS middleware for public routes
 * More permissive for public endpoints
 */
export const publicCors = cors({
  ...corsOptions,
  origin: function (origin, callback) {
    const publicAllowedOrigins = [
      ...ENV.CORS_ORIGINS,
      '*', // Allow all origins for public endpoints
      'https://transactlab.com',
      'https://www.transactlab.com'
    ];
    
    if (!origin) {
      return callback(null, true);
    }

    if (publicAllowedOrigins.includes('*') || publicAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`Public CORS blocked request from origin: ${origin}`);
    return callback(new Error('Not allowed by Public CORS'));
  }
});

/**
 * CORS error handler middleware
 */
export const corsErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      code: 'CORS_ERROR'
    });
    return;
  }
  
  next(err);
};

/**
 * CORS preflight handler
 */
export const corsPreflight = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
};

/**
 * CORS logging middleware
 */
export const corsLogger = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.get('Origin');
  
  if (origin) {
    logger.info(`CORS request from origin: ${origin}`, {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
  }
  
  next();
};

/**
 * Dynamic CORS middleware based on route type
 */
export const dynamicCors = (routeType: 'api' | 'webhook' | 'admin' | 'public') => {
  const corsConfigs = {
    api: apiCors,
    webhook: webhookCors,
    admin: adminCors,
    public: publicCors
  };
  
  return corsConfigs[routeType];
};

export default {
  corsOptions,
  apiCors,
  webhookCors,
  adminCors,
  publicCors,
  corsErrorHandler,
  corsPreflight,
  corsLogger,
  dynamicCors
}; 