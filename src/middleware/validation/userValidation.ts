import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../../utils/helpers/logger';

/**
 * Validation schemas for user-related requests
 */
export const userSchemas = {
  // User registration
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    
    firstName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
        'any.required': 'First name is required'
      }),
    
    lastName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
        'any.required': 'Last name is required'
      }),
    
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    role: Joi.string()
      .valid('user', 'admin')
      .default('user')
      .messages({
        'any.only': 'Invalid role. Must be user or admin'
      })
  }),

  // User login
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      }),
    
    rememberMe: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Remember me must be a boolean value'
      })
  }),

  // Update user profile
  updateProfile: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .optional()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
      }),
    
    lastName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
      }),
    
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    avatar: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Please provide a valid avatar URL'
      }),
    
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        sms: Joi.boolean().optional(),
        push: Joi.boolean().optional()
      }).optional(),
      language: Joi.string().valid('en', 'fr', 'es', 'de').optional(),
      timezone: Joi.string().optional(),
      currency: Joi.string().valid('NGN', 'USD', 'EUR', 'GBP').optional()
    }).optional()
  }),

  // Change password
  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Password confirmation does not match',
        'any.required': 'Password confirmation is required'
      })
  }),

  // Forgot password
  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
  }),

  // Reset password
  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Password confirmation does not match',
        'any.required': 'Password confirmation is required'
      })
  }),

  // Two-factor authentication
  toggleTwoFactor: Joi.object({
    enable: Joi.boolean()
      .required()
      .messages({
        'boolean.base': 'Enable must be a boolean value',
        'any.required': 'Enable parameter is required'
      })
  }),

  verifyTwoFactor: Joi.object({
    code: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.length': 'Two-factor code must be exactly 6 digits',
        'string.pattern.base': 'Two-factor code must contain only digits',
        'any.required': 'Two-factor code is required'
      })
  }),

  // Admin user management
  updateUser: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .optional()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
        'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
      }),
    
    lastName: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s'-]+$/)
      .optional()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
        'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
      }),
    
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    role: Joi.string()
      .valid('user', 'admin')
      .optional()
      .messages({
        'any.only': 'Invalid role. Must be user or admin'
      }),
    
    isActive: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is active must be a boolean value'
      }),
    
    isVerified: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is verified must be a boolean value'
      })
  })
};

/**
 * Generic validation middleware
 */
export const validateUser = (schemaName: keyof typeof userSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const schema = userSchemas[schemaName];
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages,
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      // Replace request body with validated data
      req.body = value;
      next();
    } catch (error) {
      logger.error('User validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Password strength validation middleware
 */
export const validatePasswordStrength = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return next();
    }

    const passwordRequirements = {
      minLength: 8,
      maxLength: 128,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    };

    const errors = [];

    if (password.length < passwordRequirements.minLength) {
      errors.push(`Password must be at least ${passwordRequirements.minLength} characters long`);
    }

    if (password.length > passwordRequirements.maxLength) {
      errors.push(`Password cannot exceed ${passwordRequirements.maxLength} characters`);
    }

    if (!passwordRequirements.hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!passwordRequirements.hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!passwordRequirements.hasNumber) {
      errors.push('Password must contain at least one number');
    }

    if (!passwordRequirements.hasSpecialChar) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors,
        code: 'PASSWORD_WEAK'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Password strength validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Password validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Email validation middleware
 */
export const validateEmail = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        code: 'INVALID_EMAIL'
      });
      return;
    }

    // Check for disposable email domains (basic check)
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1];
    
    if (disposableDomains.includes(domain)) {
      res.status(400).json({
        success: false,
        message: 'Disposable email addresses are not allowed',
        code: 'DISPOSABLE_EMAIL'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Email validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Email validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Phone number validation middleware
 */
export const validatePhone = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return next();
    }

    // International phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number',
        code: 'INVALID_PHONE'
      });
      return;
    }

    // Remove all non-digit characters for length check
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      res.status(400).json({
        success: false,
        message: 'Phone number must be between 10 and 15 digits',
        code: 'INVALID_PHONE_LENGTH'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Phone validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Phone validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

export default {
  validateUser,
  validatePasswordStrength,
  validateEmail,
  validatePhone,
  userSchemas
}; 