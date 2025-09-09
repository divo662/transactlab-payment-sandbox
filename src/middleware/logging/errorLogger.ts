import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/helpers/logger';

/**
 * Error logging middleware
 * Logs all errors with detailed information
 */
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.requestId || 'unknown';
  
  // Log error details
  logger.error('Application error', {
    requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: (err as any).code,
      statusCode: (err as any).statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      origin: req.get('Origin'),
      contentType: req.get('Content-Type'),
      authorization: req.get('Authorization') ? 'present' : 'absent',
      apiKey: req.get('X-API-Key') ? 'present' : 'absent'
    },
    user: {
      id: req.user?._id,
      role: req.user?.role,
      merchantId: req.merchant?._id
    },
    timestamp: new Date().toISOString()
  });
  
  // Log request body for debugging (excluding sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = sanitizeErrorRequestBody(req.body);
    logger.debug('Error request body', {
      requestId,
      body: sanitizedBody
    });
  }
  
  // Log query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    logger.debug('Error request query', {
      requestId,
      query: req.query
    });
  }
  
  // Log URL parameters
  if (req.params && Object.keys(req.params).length > 0) {
    logger.debug('Error request params', {
      requestId,
      params: req.params
    });
  }
  
  next(err);
};

/**
 * API error logger
 * Specialized error logging for API endpoints
 */
export const apiErrorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.requestId || 'unknown';
  
  // Log API-specific error details
  logger.error('API error', {
    requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: (err as any).code,
      statusCode: (err as any).statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      apiKey: req.get('X-API-Key') ? 'present' : 'absent',
      secretKey: req.get('X-Secret-Key') ? 'present' : 'absent',
      contentType: req.get('Content-Type')
    },
    merchant: {
      id: req.merchant?._id,
      name: req.merchant?.businessName
    },
    timestamp: new Date().toISOString()
  });
  
  // Log API request body for debugging
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = sanitizeApiErrorBody(req.body);
    logger.debug('API error request body', {
      requestId,
      body: sanitizedBody
    });
  }
  
  next(err);
};

/**
 * Webhook error logger
 * Specialized error logging for webhook endpoints
 */
export const webhookErrorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.requestId || 'unknown';
  
  // Log webhook-specific error details
  logger.error('Webhook error', {
    requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: (err as any).code,
      statusCode: (err as any).statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      signature: req.get('X-TransactLab-Signature') ? 'present' : 'absent',
      timestamp: req.get('X-TransactLab-Timestamp'),
      contentType: req.get('Content-Type')
    },
    webhook: {
      id: req.params['webhookId'] || req.body?.webhook_id,
      eventType: req.body?.event_type
    },
    timestamp: new Date().toISOString()
  });
  
  // Log webhook payload for debugging
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = sanitizeWebhookErrorBody(req.body);
    logger.debug('Webhook error payload', {
      requestId,
      body: sanitizedBody
    });
  }
  
  next(err);
};

/**
 * Admin error logger
 * Specialized error logging for admin endpoints
 */
export const adminErrorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.requestId || 'unknown';
  
  // Log admin-specific error details
  logger.error('Admin error', {
    requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: (err as any).code,
      statusCode: (err as any).statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      authorization: req.get('Authorization') ? 'present' : 'absent',
      contentType: req.get('Content-Type')
    },
    user: {
      id: req.user?._id,
      role: req.user?.role,
      email: req.user?.email
    },
    timestamp: new Date().toISOString()
  });
  
  // Log admin request body for debugging
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = sanitizeAdminErrorBody(req.body);
    logger.debug('Admin error request body', {
      requestId,
      body: sanitizedBody
    });
  }
  
  next(err);
};

/**
 * Database error logger
 * Specialized error logging for database errors
 */
export const databaseErrorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.requestId || 'unknown';
  
  // Check if it's a database error
  const isDatabaseError = err.name === 'MongoError' || 
                         err.name === 'ValidationError' || 
                         err.name === 'CastError' ||
                         err.message.includes('MongoDB') ||
                         err.message.includes('database');
  
  if (isDatabaseError) {
    logger.error('Database error', {
      requestId,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: (err as any).code,
        statusCode: (err as any).statusCode
      },
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      user: {
        id: req.user?._id,
        role: req.user?.role
      },
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
};

/**
 * Validation error logger
 * Specialized error logging for validation errors
 */
export const validationErrorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.requestId || 'unknown';
  
  // Check if it's a validation error
  const isValidationError = err.name === 'ValidationError' || 
                           err.message.includes('validation') ||
                           err.message.includes('ValidationError');
  
  if (isValidationError) {
    logger.warn('Validation error', {
      requestId,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack
      },
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      user: {
        id: req.user?._id,
        role: req.user?.role
      },
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
};

/**
 * Authentication error logger
 * Specialized error logging for authentication errors
 */
export const authErrorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.requestId || 'unknown';
  
  // Check if it's an authentication error
  const isAuthError = err.name === 'JsonWebTokenError' || 
                     err.name === 'TokenExpiredError' ||
                     err.message.includes('authentication') ||
                     err.message.includes('unauthorized') ||
                     err.message.includes('forbidden');
  
  if (isAuthError) {
    logger.warn('Authentication error', {
      requestId,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack
      },
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        authorization: req.get('Authorization') ? 'present' : 'absent',
        apiKey: req.get('X-API-Key') ? 'present' : 'absent'
      },
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
};

/**
 * Rate limit error logger
 * Specialized error logging for rate limit errors
 */
export const rateLimitErrorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.requestId || 'unknown';
  
  // Check if it's a rate limit error
  const isRateLimitError = err.message.includes('rate limit') ||
                          err.message.includes('too many requests') ||
                          (err as any).code === 'RATE_LIMIT_EXCEEDED';
  
  if (isRateLimitError) {
    logger.warn('Rate limit error', {
      requestId,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack
      },
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        apiKey: req.get('X-API-Key') ? 'present' : 'absent'
      },
      user: {
        id: req.user?._id,
        role: req.user?.role
      },
      timestamp: new Date().toISOString()
    });
  }
  
  next(err);
};

/**
 * Sanitize error request body
 */
const sanitizeErrorRequestBody = (body: any): any => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'apiKey', 'secretKey'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

/**
 * Sanitize API error body
 */
const sanitizeApiErrorBody = (body: any): any => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'apiKey', 'secretKey'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

/**
 * Sanitize webhook error body
 */
const sanitizeWebhookErrorBody = (body: any): any => {
  const sensitiveFields = ['signature', 'secret', 'token', 'key', 'webhook_secret'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

/**
 * Sanitize admin error body
 */
const sanitizeAdminErrorBody = (body: any): any => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'adminKey'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

export default {
  errorLogger,
  apiErrorLogger,
  webhookErrorLogger,
  adminErrorLogger,
  databaseErrorLogger,
  validationErrorLogger,
  authErrorLogger,
  rateLimitErrorLogger
}; 