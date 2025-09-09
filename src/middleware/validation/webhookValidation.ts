import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { logger } from '../../utils/helpers/logger';
import { Webhook } from '../../models';

/**
 * Validation schemas for webhook-related requests
 */
const webhookSchemas = {
  // Create webhook
  createWebhook: Joi.object({
    url: Joi.string()
      .uri()
      .required()
      .messages({
        'string.uri': 'Please provide a valid webhook URL',
        'any.required': 'Webhook URL is required'
      }),
    
    events: Joi.array()
      .items(Joi.string().valid(
        'charge.success',
        'charge.failed',
        'transfer.success',
        'transfer.failed',
        'refund.processed',
        'refund.failed',
        'subscription.created',
        'subscription.updated',
        'subscription.cancelled',
        'subscription.billed',
        'customer.created',
        'customer.updated'
      ))
      .min(1)
      .required()
      .messages({
        'array.base': 'Events must be an array',
        'array.min': 'At least one event must be selected',
        'any.only': 'Invalid event type',
        'any.required': 'Events are required'
      }),
    
    description: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters'
      }),
    
    isActive: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'Is active must be a boolean value'
      })
  }),

  // Update webhook
  updateWebhook: Joi.object({
    url: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'Please provide a valid webhook URL'
      }),
    
    events: Joi.array()
      .items(Joi.string().valid(
        'charge.success',
        'charge.failed',
        'transfer.success',
        'transfer.failed',
        'refund.processed',
        'refund.failed',
        'subscription.created',
        'subscription.updated',
        'subscription.cancelled',
        'subscription.billed',
        'customer.created',
        'customer.updated'
      ))
      .min(1)
      .optional()
      .messages({
        'array.base': 'Events must be an array',
        'array.min': 'At least one event must be selected',
        'any.only': 'Invalid event type'
      }),
    
    description: Joi.string()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters'
      }),
    
    isActive: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Is active must be a boolean value'
      })
  }),

  // Test webhook
  testWebhook: Joi.object({
    webhook_id: Joi.string()
      .required()
      .messages({
        'any.required': 'Webhook ID is required'
      }),
    
    event_type: Joi.string()
      .valid(
        'charge.success',
        'charge.failed',
        'transfer.success',
        'transfer.failed',
        'refund.processed',
        'refund.failed',
        'subscription.created',
        'subscription.updated',
        'subscription.cancelled',
        'subscription.billed',
        'customer.created',
        'customer.updated'
      )
      .required()
      .messages({
        'any.only': 'Invalid event type',
        'any.required': 'Event type is required'
      }),
    
    payload: Joi.object()
      .optional()
      .messages({
        'object.base': 'Payload must be an object'
      })
  }),

  // Deliver webhook
  deliverWebhook: Joi.object({
    webhook_id: Joi.string()
      .required()
      .messages({
        'any.required': 'Webhook ID is required'
      }),
    
    event_type: Joi.string()
      .valid(
        'charge.success',
        'charge.failed',
        'transfer.success',
        'transfer.failed',
        'refund.processed',
        'refund.failed',
        'subscription.created',
        'subscription.updated',
        'subscription.cancelled',
        'subscription.billed',
        'customer.created',
        'customer.updated'
      )
      .required()
      .messages({
        'any.only': 'Invalid event type',
        'any.required': 'Event type is required'
      }),
    
    payload: Joi.object()
      .required()
      .messages({
        'object.base': 'Payload must be an object',
        'any.required': 'Payload is required'
      })
  }),

  // Verify webhook signature
  verifyWebhook: Joi.object({
    signature: Joi.string()
      .required()
      .messages({
        'any.required': 'Webhook signature is required'
      }),
    
    timestamp: Joi.string()
      .pattern(/^\d{10}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Timestamp must be a 10-digit Unix timestamp'
      })
  })
};

/**
 * Generic validation middleware
 */
export const validateWebhook = (schemaName: keyof typeof webhookSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const schema = webhookSchemas[schemaName];
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
      logger.error('Webhook validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Webhook signature verification middleware
 */
export const verifyWebhookSignature = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers['x-transactlab-signature'] as string;
    const timestamp = req.headers['x-transactlab-timestamp'] as string;
    
    if (!signature) {
      res.status(401).json({
        success: false,
        message: 'Webhook signature is required',
        code: 'SIGNATURE_REQUIRED'
      });
      return;
    }

    // Get webhook secret from database or configuration
    const webhookId = req.params.webhookId || req.body.webhook_id;
    let webhookSecret = process.env.WEBHOOK_SECRET;

    if (webhookId) {
      const webhook = await Webhook.findById(webhookId);
      if (webhook && webhook.secret) {
        webhookSecret = webhook.secret;
      }
    }

    if (!webhookSecret) {
      res.status(500).json({
        success: false,
        message: 'Webhook secret not configured',
        code: 'WEBHOOK_SECRET_MISSING'
      });
      return;
    }

    // Verify timestamp (prevent replay attacks)
    if (timestamp) {
      const timestampNum = parseInt(timestamp);
      const now = Math.floor(Date.now() / 1000);
      const tolerance = 300; // 5 minutes

      if (Math.abs(now - timestampNum) > tolerance) {
        res.status(401).json({
          success: false,
          message: 'Webhook timestamp is too old',
          code: 'TIMESTAMP_EXPIRED'
        });
        return;
      }
    }

    // Create expected signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // Compare signatures
    if (signature !== expectedSignature) {
      res.status(401).json({
        success: false,
        message: 'Invalid webhook signature',
        code: 'INVALID_SIGNATURE'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Webhook signature verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Signature verification failed',
      code: 'SIGNATURE_VERIFICATION_ERROR'
    });
  }
};

/**
 * Webhook URL validation middleware
 */
export const validateWebhookUrl = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return next();
    }

    // Basic URL format validation
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(url)) {
      res.status(400).json({
        success: false,
        message: 'Webhook URL must use HTTPS protocol',
        code: 'INVALID_WEBHOOK_URL'
      });
      return;
    }

    // Check for localhost or private IP addresses (security)
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    const privateIPs = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '10.0.0.0',
      '172.16.0.0',
      '192.168.0.0'
    ];

    if (privateIPs.some(ip => hostname.includes(ip))) {
      res.status(400).json({
        success: false,
        message: 'Webhook URL cannot point to localhost or private IP addresses',
        code: 'PRIVATE_IP_NOT_ALLOWED'
      });
      return;
    }

    // Check URL length
    if (url.length > 2048) {
      res.status(400).json({
        success: false,
        message: 'Webhook URL is too long (maximum 2048 characters)',
        code: 'URL_TOO_LONG'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Webhook URL validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook URL validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Webhook event validation middleware
 */
export const validateWebhookEvents = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { events } = req.body;
    
    if (!events || !Array.isArray(events)) {
      return next();
    }

    const validEvents = [
      'charge.success',
      'charge.failed',
      'transfer.success',
      'transfer.failed',
      'refund.processed',
      'refund.failed',
      'subscription.created',
      'subscription.updated',
      'subscription.cancelled',
      'subscription.billed',
      'customer.created',
      'customer.updated'
    ];

    const invalidEvents = events.filter(event => !validEvents.includes(event));
    
    if (invalidEvents.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Invalid webhook events',
        errors: invalidEvents.map(event => `"${event}" is not a valid event type`),
        code: 'INVALID_WEBHOOK_EVENTS'
      });
      return;
    }

    // Check for duplicate events
    const uniqueEvents = [...new Set(events)];
    if (uniqueEvents.length !== events.length) {
      res.status(400).json({
        success: false,
        message: 'Duplicate webhook events are not allowed',
        code: 'DUPLICATE_WEBHOOK_EVENTS'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Webhook events validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook events validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Webhook payload validation middleware
 */
export const validateWebhookPayload = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { payload, event_type } = req.body;
    
    if (!payload || !event_type) {
      return next();
    }

    // Basic payload structure validation based on event type
    const requiredFields = {
      'charge.success': ['id', 'amount', 'currency', 'status', 'reference'],
      'charge.failed': ['id', 'amount', 'currency', 'status', 'reference', 'failure_reason'],
      'transfer.success': ['id', 'amount', 'currency', 'status', 'recipient'],
      'transfer.failed': ['id', 'amount', 'currency', 'status', 'recipient', 'failure_reason'],
      'refund.processed': ['id', 'transaction_id', 'amount', 'status'],
      'refund.failed': ['id', 'transaction_id', 'amount', 'status', 'failure_reason'],
      'subscription.created': ['id', 'customer_id', 'plan_id', 'status'],
      'subscription.updated': ['id', 'customer_id', 'plan_id', 'status'],
      'subscription.cancelled': ['id', 'customer_id', 'plan_id', 'status'],
      'subscription.billed': ['id', 'customer_id', 'plan_id', 'amount', 'status'],
      'customer.created': ['id', 'email', 'name'],
      'customer.updated': ['id', 'email', 'name']
    };

    const required = requiredFields[event_type as keyof typeof requiredFields];
    if (required) {
      const missingFields = required.filter(field => !payload[field]);
      
      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Webhook payload is missing required fields',
          errors: missingFields.map(field => `"${field}" is required`),
          code: 'INVALID_WEBHOOK_PAYLOAD'
        });
        return;
      }
    }

    next();
  } catch (error) {
    logger.error('Webhook payload validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook payload validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

export default {
  validateWebhook,
  verifyWebhookSignature,
  validateWebhookUrl,
  validateWebhookEvents,
  validateWebhookPayload,
  webhookSchemas
}; 