import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/helpers/logger';

/**
 * Simple HTML sanitization function
 * Removes HTML tags and potentially dangerous content
 */
const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous JavaScript patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove other potentially dangerous patterns
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/expression\(/gi, '');
  
  return sanitized.trim();
};

/**
 * HTML sanitization middleware
 * Removes potentially dangerous HTML/JavaScript from input
 */
export const sanitizeHtmlMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('HTML sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Input sanitization failed',
      code: 'SANITIZATION_ERROR'
    });
  }
};

/**
 * Recursively sanitize object properties
 */
const sanitizeObject = (obj: any): void => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Sanitize string values
        obj[key] = sanitizeHtml(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitizeObject(value);
      }
    }
  }
};

/**
 * SQL injection prevention middleware
 */
export const preventSqlInjection = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|WHERE|FROM|AND|OR)\b)/i,
      /(\b(script|javascript|vbscript|onload|onerror|onclick)\b)/i,
      /(\b(union|select|insert|update|delete|drop|create|alter|exec)\b)/i,
      /(--|\/\*|\*\/|xp_|sp_)/i
    ];
    
    const checkForSqlInjection = (value: string): boolean => {
      return sqlPatterns.some(pattern => pattern.test(value));
    };
    
    // Check request body
    if (req.body && typeof req.body === 'object') {
      const hasInjection = checkObjectForInjection(req.body, checkForSqlInjection);
      if (hasInjection) {
        throw new Error('SQL injection detected in request body');
      }
    }
    
    // Check query parameters
    if (req.query && typeof req.query === 'object') {
      const hasInjection = checkObjectForInjection(req.query, checkForSqlInjection);
      if (hasInjection) {
        throw new Error('SQL injection detected in query parameters');
      }
    }
    
    // Check URL parameters
    if (req.params && typeof req.params === 'object') {
      const hasInjection = checkObjectForInjection(req.params, checkForSqlInjection);
      if (hasInjection) {
        throw new Error('SQL injection detected in URL parameters');
      }
    }
    
    next();
  } catch (error) {
    logger.warn('SQL injection attempt detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      error: error.message
    });
    
    res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      code: 'INVALID_INPUT'
    });
  }
};

/**
 * Check object for SQL injection patterns
 */
const checkObjectForInjection = (obj: any, checkFunction: (value: string) => boolean): boolean => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        if (checkFunction(value)) {
          return true;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (checkObjectForInjection(value, checkFunction)) {
          return true;
        }
      }
    }
  }
  return false;
};

/**
 * XSS prevention middleware
 */
export const preventXss = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>.*?<\/link>/gi,
      /<meta[^>]*>.*?<\/meta>/gi
    ];
    
    const checkForXss = (value: string): boolean => {
      return xssPatterns.some(pattern => pattern.test(value));
    };
    
    // Check request body
    if (req.body && typeof req.body === 'object') {
      const hasXss = checkObjectForXss(req.body, checkForXss);
      if (hasXss) {
        throw new Error('XSS attack detected in request body');
      }
    }
    
    // Check query parameters
    if (req.query && typeof req.query === 'object') {
      const hasXss = checkObjectForXss(req.query, checkForXss);
      if (hasXss) {
        throw new Error('XSS attack detected in query parameters');
      }
    }
    
    next();
  } catch (error) {
    logger.warn('XSS attack attempt detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      error: error.message
    });
    
    res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      code: 'INVALID_INPUT'
    });
  }
};

/**
 * Check object for XSS patterns
 */
const checkObjectForXss = (obj: any, checkFunction: (value: string) => boolean): boolean => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        if (checkFunction(value)) {
          return true;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (checkObjectForXss(value, checkFunction)) {
          return true;
        }
      }
    }
  }
  return false;
};

/**
 * Input length validation middleware
 */
export const validateInputLength = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const maxLengths = {
      email: 254,
      password: 128,
      firstName: 50,
      lastName: 50,
      phone: 20,
      description: 500,
      url: 2048,
      reference: 50,
      reason: 500
    };
    
    const checkLength = (obj: any, maxLengths: Record<string, number>): void => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          const maxLength = maxLengths[key];
          
          if (typeof value === 'string' && maxLength && value.length > maxLength) {
            throw new Error(`Field '${key}' exceeds maximum length of ${maxLength} characters`);
          } else if (typeof value === 'object' && value !== null) {
            checkLength(value, maxLengths);
          }
        }
      }
    };
    
    // Check request body
    if (req.body && typeof req.body === 'object') {
      checkLength(req.body, maxLengths);
    }
    
    // Check query parameters
    if (req.query && typeof req.query === 'object') {
      checkLength(req.query, maxLengths);
    }
    
    next();
  } catch (error) {
    logger.warn('Input length validation failed', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      error: error.message
    });
    
    res.status(400).json({
      success: false,
      message: error.message,
      code: 'INPUT_LENGTH_EXCEEDED'
    });
  }
};

/**
 * Input type validation middleware
 */
export const validateInputTypes = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const typeValidations = {
      email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      phone: (value: string) => /^\+?[\d\s\-\(\)]+$/.test(value),
      url: (value: string) => /^https?:\/\/.+/.test(value),
      amount: (value: number) => typeof value === 'number' && value > 0,
      currency: (value: string) => ['NGN', 'USD', 'EUR', 'GBP'].includes(value),
      status: (value: string) => ['pending', 'success', 'failed', 'cancelled'].includes(value)
    };
    
    const checkTypes = (obj: any, validations: Record<string, (value: any) => boolean>): void => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          const validation = validations[key];
          
          if (validation && !validation(value)) {
            throw new Error(`Invalid format for field '${key}'`);
          } else if (typeof value === 'object' && value !== null) {
            checkTypes(value, validations);
          }
        }
      }
    };
    
    // Check request body
    if (req.body && typeof req.body === 'object') {
      checkTypes(req.body, typeValidations);
    }
    
    next();
  } catch (error) {
    logger.warn('Input type validation failed', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      error: error.message
    });
    
    res.status(400).json({
      success: false,
      message: error.message,
      code: 'INVALID_INPUT_TYPE'
    });
  }
};

/**
 * Comprehensive input sanitization middleware
 */
export const comprehensiveSanitization = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Apply all sanitization methods
    sanitizeHtmlMiddleware(req, res, () => {
      preventSqlInjection(req, res, () => {
        preventXss(req, res, () => {
          validateInputLength(req, res, () => {
            validateInputTypes(req, res, next);
          });
        });
      });
    });
  } catch (error) {
    logger.error('Comprehensive sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Input sanitization failed',
      code: 'SANITIZATION_ERROR'
    });
  }
};

/**
 * Sanitization logging middleware
 */
export const sanitizationLogger = (req: Request, res: Response, next: NextFunction): void => {
  const originalBody = JSON.stringify(req.body);
  const originalQuery = JSON.stringify(req.query);
  
  next();
  
  // Log sanitization changes
  const sanitizedBody = JSON.stringify(req.body);
  const sanitizedQuery = JSON.stringify(req.query);
  
  if (originalBody !== sanitizedBody || originalQuery !== sanitizedQuery) {
    logger.info('Input sanitization applied', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      bodyChanged: originalBody !== sanitizedBody,
      queryChanged: originalQuery !== sanitizedQuery
    });
  }
};

export default {
  sanitizeHtmlMiddleware,
  preventSqlInjection,
  preventXss,
  validateInputLength,
  validateInputTypes,
  comprehensiveSanitization,
  sanitizationLogger
}; 