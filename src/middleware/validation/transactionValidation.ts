import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../../utils/helpers/logger';
import { CURRENCIES } from '../../utils/constants/currencies';
import { PAYMENT_METHODS } from '../../utils/constants/paymentMethods';
import { TRANSACTION_STATUS } from '../../utils/constants/transactionStatus';

/**
 * Validation schemas for transaction-related requests
 */
export const transactionSchemas = {
  // Initialize transaction
  initializeTransaction: Joi.object({
    amount: Joi.number()
      .positive()
      .min(100) // Minimum amount in kobo (₦1)
      .max(1000000000) // Maximum amount (₦10M)
      .required()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'number.min': 'Amount must be at least ₦1',
        'number.max': 'Amount cannot exceed ₦10,000,000',
        'any.required': 'Amount is required'
      }),
    
    currency: Joi.string()
      .valid(...Object.values(CURRENCIES))
      .default('NGN')
      .messages({
        'string.base': 'Currency must be a string',
        'any.only': 'Invalid currency. Supported currencies: NGN, USD, EUR, GBP',
        'any.required': 'Currency is required'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    reference: Joi.string()
      .pattern(/^[A-Za-z0-9_-]{10,50}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Reference must be 10-50 characters long and contain only letters, numbers, hyphens, and underscores'
      }),
    
    callback_url: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Please provide a valid callback URL'
      }),
    
    payment_method: Joi.string()
      .valid(...Object.values(PAYMENT_METHODS))
      .optional()
      .messages({
        'any.only': 'Invalid payment method'
      }),
    
    metadata: Joi.object()
      .optional()
      .messages({
        'object.base': 'Metadata must be an object'
      }),
    
    customer: Joi.object({
      name: Joi.string().max(100).optional(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
      address: Joi.string().max(200).optional()
    }).optional(),
    
    channels: Joi.array()
      .items(Joi.string().valid('card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'))
      .optional()
      .messages({
        'array.base': 'Channels must be an array',
        'any.only': 'Invalid channel type'
      })
  }),

  // Verify transaction
  verifyTransaction: Joi.object({
    reference: Joi.string()
      .required()
      .messages({
        'any.required': 'Transaction reference is required'
      })
  }),

  // Create refund
  createRefund: Joi.object({
    transaction_id: Joi.string()
      .required()
      .messages({
        'any.required': 'Transaction ID is required'
      }),
    
    amount: Joi.number()
      .positive()
      .required()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required'
      }),
    
    reason: Joi.string()
      .max(500)
      .required()
      .messages({
        'string.max': 'Reason cannot exceed 500 characters',
        'any.required': 'Refund reason is required'
      }),
    
    refund_type: Joi.string()
      .valid('full', 'partial')
      .default('full')
      .messages({
        'any.only': 'Refund type must be either "full" or "partial"'
      }),
    
    metadata: Joi.object()
      .optional()
      .messages({
        'object.base': 'Metadata must be an object'
      })
  }),

  // Update refund
  updateRefund: Joi.object({
    status: Joi.string()
      .valid('pending', 'approved', 'rejected', 'processed', 'failed')
      .required()
      .messages({
        'any.only': 'Invalid refund status',
        'any.required': 'Status is required'
      }),
    
    reason: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Reason cannot exceed 500 characters'
      }),
    
    metadata: Joi.object()
      .optional()
      .messages({
        'object.base': 'Metadata must be an object'
      })
  }),

  // List transactions
  listTransactions: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    
    status: Joi.string()
      .valid(...Object.values(TRANSACTION_STATUS))
      .optional()
      .messages({
        'any.only': 'Invalid transaction status'
      }),
    
    payment_method: Joi.string()
      .valid(...Object.values(PAYMENT_METHODS))
      .optional()
      .messages({
        'any.only': 'Invalid payment method'
      }),
    
    start_date: Joi.date()
      .iso()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date',
        'date.format': 'Start date must be in ISO format'
      }),
    
    end_date: Joi.date()
      .iso()
      .min(Joi.ref('start_date'))
      .optional()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.format': 'End date must be in ISO format',
        'date.min': 'End date must be after start date'
      }),
    
    amount_min: Joi.number()
      .positive()
      .optional()
      .messages({
        'number.base': 'Minimum amount must be a number',
        'number.positive': 'Minimum amount must be positive'
      }),
    
    amount_max: Joi.number()
      .positive()
      .min(Joi.ref('amount_min'))
      .optional()
      .messages({
        'number.base': 'Maximum amount must be a number',
        'number.positive': 'Maximum amount must be positive',
        'number.min': 'Maximum amount must be greater than minimum amount'
      })
  }),

  // Cancel transaction
  cancelTransaction: Joi.object({
    reason: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Reason cannot exceed 500 characters'
      })
  })
};

/**
 * Generic validation middleware
 */
export const validateTransaction = (schemaName: keyof typeof transactionSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const schema = transactionSchemas[schemaName];
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
      logger.error('Transaction validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Query parameter validation middleware
 */
export const validateTransactionQuery = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { error, value } = transactionSchemas.listTransactions.validate(req.query, {
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
        message: 'Query validation failed',
        errors: errorMessages,
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Replace request query with validated data
    req.query = value;
    next();
  } catch (error) {
    logger.error('Transaction query validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Query validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Amount validation middleware
 * Validates amount based on currency and merchant limits
 */
export const validateAmount = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { amount, currency } = req.body;
    const merchant = req.merchant;

    if (!amount || !currency) {
      return next();
    }

    // Currency-specific validations
    const currencyLimits = {
      NGN: { min: 100, max: 1000000000 }, // ₦1 - ₦10M
      USD: { min: 1, max: 10000000 },     // $1 - $10M
      EUR: { min: 1, max: 10000000 },     // €1 - €10M
      GBP: { min: 1, max: 10000000 }      // £1 - £10M
    };

    const limits = currencyLimits[currency as keyof typeof currencyLimits];
    if (!limits) {
      res.status(400).json({
        success: false,
        message: 'Unsupported currency',
        code: 'UNSUPPORTED_CURRENCY'
      });
      return;
    }

    if (amount < limits.min) {
      res.status(400).json({
        success: false,
        message: `Minimum amount for ${currency} is ${limits.min}`,
        code: 'AMOUNT_TOO_LOW'
      });
      return;
    }

    if (amount > limits.max) {
      res.status(400).json({
        success: false,
        message: `Maximum amount for ${currency} is ${limits.max}`,
        code: 'AMOUNT_TOO_HIGH'
      });
      return;
    }

    // Check merchant limits if available
    if (merchant) {
      // Note: Merchant limits would be checked here if implemented
      // For now, we'll just validate the single transaction amount
      // against the currency limits defined above
    }

    next();
  } catch (error) {
    logger.error('Amount validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Amount validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

export default {
  validateTransaction,
  validateTransactionQuery,
  validateAmount,
  transactionSchemas
}; 