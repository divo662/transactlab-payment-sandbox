import { logger } from '../../utils/helpers/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  message?: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'phone' | 'url' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: any) => boolean;
}

/**
 * Validation Service
 * Handles data validation utilities and schema validation
 */
export class ValidationService {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    } catch (error) {
      logger.error('Failed to validate email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email
      });
      return false;
    }
  }

  /**
   * Validate phone number format
   */
  static isValidPhone(phone: string): boolean {
    try {
      // Remove all non-digit characters
      const cleaned = phone.replace(/\D/g, '');
      
      // Check if it's a valid phone number (7-15 digits)
      return cleaned.length >= 7 && cleaned.length <= 15;
    } catch (error) {
      logger.error('Failed to validate phone number', {
        error: error instanceof Error ? error.message : 'Unknown error',
        phone
      });
      return false;
    }
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      const urlRegex = /^https?:\/\/.+/;
      return urlRegex.test(url);
    } catch (error) {
      logger.error('Failed to validate URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url
      });
      return false;
    }
  }

  /**
   * Validate amount (positive number)
   */
  static isValidAmount(amount: number): boolean {
    try {
      return typeof amount === 'number' && amount > 0 && isFinite(amount);
    } catch (error) {
      logger.error('Failed to validate amount', {
        error: error instanceof Error ? error.message : 'Unknown error',
        amount
      });
      return false;
    }
  }

  /**
   * Validate currency code
   */
  static isValidCurrency(currency: string): boolean {
    try {
      const validCurrencies = ['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'];
      return validCurrencies.includes(currency.toUpperCase());
    } catch (error) {
      logger.error('Failed to validate currency', {
        error: error instanceof Error ? error.message : 'Unknown error',
        currency
      });
      return false;
    }
  }

  /**
   * Validate payment method
   */
  static isValidPaymentMethod(method: string): boolean {
    try {
      const validMethods = [
        'card', 'bank_transfer', 'ussd', 'mobile_money', 
        'qr_code', 'wallet', 'crypto'
      ];
      return validMethods.includes(method.toLowerCase());
    } catch (error) {
      logger.error('Failed to validate payment method', {
        error: error instanceof Error ? error.message : 'Unknown error',
        method
      });
      return false;
    }
  }

  /**
   * Validate transaction status
   */
  static isValidTransactionStatus(status: string): boolean {
    try {
      const validStatuses = [
        'pending', 'processing', 'successful', 'failed', 
        'cancelled', 'expired', 'refunded'
      ];
      return validStatuses.includes(status.toLowerCase());
    } catch (error) {
      logger.error('Failed to validate transaction status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        status
      });
      return false;
    }
  }

  /**
   * Validate API key format
   */
  static isValidApiKey(apiKey: string): boolean {
    try {
      // API key should start with 'tl_' and be at least 32 characters
      const apiKeyRegex = /^tl_[A-Za-z0-9_-]{28,}$/;
      return apiKeyRegex.test(apiKey);
    } catch (error) {
      logger.error('Failed to validate API key', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Validate webhook URL
   */
  static isValidWebhookUrl(url: string): boolean {
    try {
      if (!this.isValidUrl(url)) {
        return false;
      }

      // Check if it's not localhost
      const urlObj = new URL(url);
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to validate webhook URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url
      });
      return false;
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate object against rules
   */
  static validateObject(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = data[rule.field];
      let isValid = true;

      switch (rule.type) {
        case 'required':
          isValid = value !== undefined && value !== null && value !== '';
          break;

        case 'email':
          isValid = value && this.isValidEmail(value);
          break;

        case 'phone':
          isValid = value && this.isValidPhone(value);
          break;

        case 'url':
          isValid = value && this.isValidUrl(value);
          break;

        case 'minLength':
          isValid = value && value.length >= rule.value;
          break;

        case 'maxLength':
          isValid = value && value.length <= rule.value;
          break;

        case 'pattern':
          isValid = value && new RegExp(rule.value).test(value);
          break;

        case 'custom':
          isValid = rule.validator ? rule.validator(value) : true;
          break;
      }

      if (!isValid) {
        errors.push(rule.message || `${rule.field} is invalid`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate transaction data
   */
  static validateTransactionData(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'amount',
        type: 'custom',
        message: 'Amount must be a positive number',
        validator: (value) => this.isValidAmount(value)
      },
      {
        field: 'currency',
        type: 'custom',
        message: 'Invalid currency code',
        validator: (value) => this.isValidCurrency(value)
      },
      {
        field: 'customerEmail',
        type: 'email',
        message: 'Invalid customer email'
      },
      {
        field: 'paymentMethod',
        type: 'custom',
        message: 'Invalid payment method',
        validator: (value) => this.isValidPaymentMethod(value)
      }
    ];

    return this.validateObject(data, rules);
  }

  /**
   * Validate merchant data
   */
  static validateMerchantData(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'businessName',
        type: 'required',
        message: 'Business name is required'
      },
      {
        field: 'businessName',
        type: 'minLength',
        value: 2,
        message: 'Business name must be at least 2 characters'
      },
      {
        field: 'businessName',
        type: 'maxLength',
        value: 100,
        message: 'Business name must be less than 100 characters'
      },
      {
        field: 'businessEmail',
        type: 'email',
        message: 'Invalid business email'
      },
      {
        field: 'phone',
        type: 'phone',
        message: 'Invalid phone number'
      }
    ];

    return this.validateObject(data, rules);
  }

  /**
   * Validate webhook data
   */
  static validateWebhookData(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'name',
        type: 'required',
        message: 'Webhook name is required'
      },
      {
        field: 'name',
        type: 'minLength',
        value: 2,
        message: 'Webhook name must be at least 2 characters'
      },
      {
        field: 'url',
        type: 'custom',
        message: 'Invalid webhook URL',
        validator: (value) => this.isValidWebhookUrl(value)
      },
      {
        field: 'events',
        type: 'required',
        message: 'Webhook events are required'
      },
      {
        field: 'events',
        type: 'custom',
        message: 'Events must be an array',
        validator: (value) => Array.isArray(value) && value.length > 0
      }
    ];

    return this.validateObject(data, rules);
  }

  /**
   * Validate API key data
   */
  static validateApiKeyData(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'name',
        type: 'required',
        message: 'API key name is required'
      },
      {
        field: 'name',
        type: 'minLength',
        value: 2,
        message: 'API key name must be at least 2 characters'
      },
      {
        field: 'permissions',
        type: 'required',
        message: 'API key permissions are required'
      },
      {
        field: 'permissions',
        type: 'custom',
        message: 'Permissions must be an array',
        validator: (value) => Array.isArray(value) && value.length > 0
      }
    ];

    return this.validateObject(data, rules);
  }

  /**
   * Sanitize input data
   */
  static sanitizeInput(data: any): any {
    try {
      if (typeof data === 'string') {
        return data.trim().replace(/[<>]/g, '');
      }

      if (typeof data === 'object' && data !== null) {
        const sanitized: any = Array.isArray(data) ? [] : {};

        for (const [key, value] of Object.entries(data)) {
          sanitized[key] = this.sanitizeInput(value);
        }

        return sanitized;
      }

      return data;
    } catch (error) {
      logger.error('Failed to sanitize input', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return data;
    }
  }

  /**
   * Validate and sanitize data
   */
  static validateAndSanitize(data: any, rules: ValidationRule[]): {
    isValid: boolean;
    errors: string[];
    sanitizedData?: any;
  } {
    const sanitizedData = this.sanitizeInput(data);
    const validation = this.validateObject(sanitizedData, rules);

    return {
      isValid: validation.isValid,
      errors: validation.errors,
      sanitizedData: validation.isValid ? sanitizedData : undefined
    };
  }

  /**
   * Check if value is empty
   */
  static isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string') {
      return value.trim() === '';
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }

    return false;
  }

  /**
   * Check if value is not empty
   */
  static isNotEmpty(value: any): boolean {
    return !this.isEmpty(value);
  }

  /**
   * Validate date format
   */
  static isValidDate(date: string): boolean {
    try {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate date range
   */
  static isValidDateRange(startDate: string, endDate: string): boolean {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return start <= end;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate numeric range
   */
  static isValidNumericRange(value: number, min: number, max: number): boolean {
    return typeof value === 'number' && value >= min && value <= max;
  }

  /**
   * Validate string length
   */
  static isValidStringLength(value: string, min: number, max: number): boolean {
    return typeof value === 'string' && value.length >= min && value.length <= max;
  }
}

export default ValidationService; 