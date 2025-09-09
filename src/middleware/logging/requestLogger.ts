import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/helpers/logger';
import '../../utils/types/express'; // Import express type extensions

/**
 * Request logging middleware
 * Logs all incoming requests with relevant information
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    origin: req.get('Origin'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    authorization: req.get('Authorization') ? 'present' : 'absent',
    apiKey: req.get('X-API-Key') ? 'present' : 'absent',
    timestamp: new Date().toISOString()
  });
  
  // Log request body for non-GET requests (excluding sensitive data)
  if (req.method !== 'GET' && req.body) {
    const sanitizedBody = sanitizeRequestBody(req.body);
    logger.debug('Request body', {
      requestId,
      body: sanitizedBody
    });
  }
  
  // Log query parameters
  if (Object.keys(req.query).length > 0) {
    logger.debug('Request query', {
      requestId,
      query: req.query
    });
  }
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Log error responses
    if (statusCode >= 400) {
      logger.warn('Request failed', {
        requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        error: chunk ? chunk.toString() : 'No error details'
      });
    }
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * API request logger
 * Specialized logging for API endpoints
 */
export const apiRequestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  req.requestId = requestId;
  
  // Log API-specific information
  logger.info('API request started', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    apiKey: req.get('X-API-Key') ? 'present' : 'absent',
    secretKey: req.get('X-Secret-Key') ? 'present' : 'absent',
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    timestamp: new Date().toISOString()
  });
  
  // Log API request body (excluding sensitive fields)
  if (req.method !== 'GET' && req.body) {
    const sanitizedBody = sanitizeApiRequestBody(req.body);
    logger.debug('API request body', {
      requestId,
      body: sanitizedBody
    });
  }
  
  // Override res.end for API responses
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    logger.info('API request completed', {
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      apiKey: req.get('X-API-Key') ? 'present' : 'absent',
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Log API errors
    if (statusCode >= 400) {
      logger.warn('API request failed', {
        requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        statusCode,
        duration: `${duration}ms`,
        apiKey: req.get('X-API-Key') ? 'present' : 'absent',
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        error: chunk ? chunk.toString() : 'No error details'
      });
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Webhook request logger
 * Specialized logging for webhook endpoints
 */
export const webhookRequestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  req.requestId = requestId;
  
  // Log webhook-specific information
  logger.info('Webhook request started', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    signature: req.get('X-TransactLab-Signature') ? 'present' : 'absent',
    webhookTimestamp: req.get('X-TransactLab-Timestamp'),
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    timestamp: new Date().toISOString()
  });

  // Log webhook payload (excluding sensitive data)
  if (req.body) {
    const sanitizedBody = sanitizeWebhookBody(req.body);
    logger.debug('Webhook payload', {
      requestId,
      body: sanitizedBody
    });
  }

  // Override res.end for webhook responses
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    logger.info('Webhook request completed', {
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      signature: req.get('X-TransactLab-Signature') ? 'present' : 'absent',
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Log webhook errors
    if (statusCode >= 400) {
      logger.error('Webhook request failed', {
        requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        statusCode,
        duration: `${duration}ms`,
        signature: req.get('X-TransactLab-Signature') ? 'present' : 'absent',
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        error: chunk ? chunk.toString() : 'No error details'
      });
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Admin request logger
 * Specialized logging for admin endpoints
 */
export const adminRequestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  req.requestId = requestId;
  
  // Log admin-specific information
  logger.info('Admin request started', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    authorization: req.get('Authorization') ? 'present' : 'absent',
    contentType: req.get('Content-Type'),
    timestamp: new Date().toISOString()
  });
  
  // Log admin request body (excluding sensitive data)
  if (req.method !== 'GET' && req.body) {
    const sanitizedBody = sanitizeAdminBody(req.body);
    logger.debug('Admin request body', {
      requestId,
      body: sanitizedBody
    });
  }
  
  // Override res.end for admin responses
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    logger.info('Admin request completed', {
      requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      authorization: req.get('Authorization') ? 'present' : 'absent',
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Log admin errors
    if (statusCode >= 400) {
      logger.error('Admin request failed', {
        requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        statusCode,
        duration: `${duration}ms`,
        authorization: req.get('Authorization') ? 'present' : 'absent',
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        error: chunk ? chunk.toString() : 'No error details'
      });
    }
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Performance monitoring middleware
 */
export const performanceLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log performance metrics
    logger.info('Request performance', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Alert on slow requests
    if (duration > 1000) { // 1 second
      logger.warn('Slow request performance', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
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
 * Sanitize request body for logging (remove sensitive data)
 */
const sanitizeRequestBody = (body: any): any => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

/**
 * Sanitize API request body
 */
const sanitizeApiRequestBody = (body: any): any => {
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
 * Sanitize webhook body
 */
const sanitizeWebhookBody = (body: any): any => {
  const sensitiveFields = ['signature', 'secret', 'token', 'key'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

/**
 * Sanitize admin body
 */
const sanitizeAdminBody = (body: any): any => {
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
  requestLogger,
  apiRequestLogger,
  webhookRequestLogger,
  adminRequestLogger,
  performanceLogger
}; 