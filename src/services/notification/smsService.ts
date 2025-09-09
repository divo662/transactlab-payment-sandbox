import { logger } from '../../utils/helpers/logger';

export interface SmsOptions {
  to: string | string[];
  message: string;
  from?: string;
  template?: string;
  data?: Record<string, any>;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

export interface SmsTemplate {
  name: string;
  message: string;
}

/**
 * SMS Service
 * Handles SMS notifications and delivery
 */
export class SmsService {
  private static readonly DEFAULT_FROM = 'TransactLab';
  private static readonly TEMPLATES: Record<string, SmsTemplate> = {
    'payment_success': {
      name: 'payment_success',
      message: 'Payment successful! Amount: {{amount}} {{currency}}. Ref: {{reference}}. Thank you for your business!'
    },
    'payment_failed': {
      name: 'payment_failed',
      message: 'Payment failed for {{amount}} {{currency}}. Ref: {{reference}}. Please try again or contact support.'
    },
    'refund_processed': {
      name: 'refund_processed',
      message: 'Refund processed for {{amount}} {{currency}}. Ref: {{reference}}. Will be credited in 3-5 business days.'
    },
    'otp': {
      name: 'otp',
      message: 'Your TransactLab verification code is: {{code}}. Valid for 10 minutes. Do not share this code.'
    },
    'welcome': {
      name: 'welcome',
      message: 'Welcome to TransactLab! Your account has been created successfully. Start processing payments now!'
    },
    'security_alert': {
      name: 'security_alert',
      message: 'Security Alert: New API key created for your account. If this wasn\'t you, contact support immediately.'
    }
  };

  /**
   * Send SMS
   */
  static async sendSms(options: SmsOptions): Promise<SmsResult> {
    try {
      // In a real implementation, this would use a service like Twilio, AWS SNS, etc.
      // For now, we'll simulate the SMS sending process
      
      const smsData = {
        to: Array.isArray(options.to) ? options.to : [options.to],
        message: options.message,
        from: options.from || this.DEFAULT_FROM
      };

      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 200));

      // Generate a mock message ID
      const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('SMS sent successfully', {
        messageId,
        to: smsData.to,
        from: smsData.from
      });

      return {
        success: true,
        messageId,
        message: 'SMS sent successfully'
      };

    } catch (error) {
      logger.error('Failed to send SMS', {
        error: error instanceof Error ? error.message : 'Unknown error',
        options
      });

      return {
        success: false,
        message: 'Failed to send SMS',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send templated SMS
   */
  static async sendTemplatedSms(
    templateName: string,
    to: string | string[],
    data: Record<string, any>,
    options: Partial<SmsOptions> = {}
  ): Promise<SmsResult> {
    try {
      const template = this.TEMPLATES[templateName];
      if (!template) {
        return {
          success: false,
          message: `SMS template '${templateName}' not found`
        };
      }

      // Replace template variables
      const message = this.replaceTemplateVariables(template.message, data);

      const smsOptions: SmsOptions = {
        to,
        message,
        ...options
      };

      return await this.sendSms(smsOptions);

    } catch (error) {
      logger.error('Failed to send templated SMS', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateName,
        to,
        data
      });

      return {
        success: false,
        message: 'Failed to send templated SMS',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Replace template variables
   */
  static replaceTemplateVariables(template: string, data: Record<string, any>): string {
    try {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
      });
    } catch (error) {
      logger.error('Failed to replace template variables', {
        error: error instanceof Error ? error.message : 'Unknown error',
        template,
        data
      });
      return template;
    }
  }

  /**
   * Send payment success SMS
   */
  static async sendPaymentSuccessSms(
    to: string,
    data: {
      amount: number;
      currency: string;
      reference: string;
    }
  ): Promise<SmsResult> {
    return await this.sendTemplatedSms('payment_success', to, data);
  }

  /**
   * Send payment failed SMS
   */
  static async sendPaymentFailedSms(
    to: string,
    data: {
      amount: number;
      currency: string;
      reference: string;
    }
  ): Promise<SmsResult> {
    return await this.sendTemplatedSms('payment_failed', to, data);
  }

  /**
   * Send refund processed SMS
   */
  static async sendRefundProcessedSms(
    to: string,
    data: {
      amount: number;
      currency: string;
      reference: string;
    }
  ): Promise<SmsResult> {
    return await this.sendTemplatedSms('refund_processed', to, data);
  }

  /**
   * Send OTP SMS
   */
  static async sendOtpSms(
    to: string,
    code: string
  ): Promise<SmsResult> {
    return await this.sendTemplatedSms('otp', to, { code });
  }

  /**
   * Send welcome SMS
   */
  static async sendWelcomeSms(
    to: string
  ): Promise<SmsResult> {
    return await this.sendTemplatedSms('welcome', to, {});
  }

  /**
   * Send security alert SMS
   */
  static async sendSecurityAlertSms(
    to: string
  ): Promise<SmsResult> {
    return await this.sendTemplatedSms('security_alert', to, {});
  }

  /**
   * Validate phone number
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    try {
      // Remove all non-digit characters
      const cleaned = phoneNumber.replace(/\D/g, '');
      
      // Check if it's a valid phone number (7-15 digits)
      return cleaned.length >= 7 && cleaned.length <= 15;
    } catch (error) {
      logger.error('Failed to validate phone number', {
        error: error instanceof Error ? error.message : 'Unknown error',
        phoneNumber
      });
      return false;
    }
  }

  /**
   * Format phone number
   */
  static formatPhoneNumber(phoneNumber: string, countryCode: string = '+234'): string {
    try {
      // Remove all non-digit characters
      const cleaned = phoneNumber.replace(/\D/g, '');
      
      // If it starts with 0, replace with country code
      if (cleaned.startsWith('0')) {
        return countryCode + cleaned.substring(1);
      }
      
      // If it doesn't start with country code, add it
      if (!cleaned.startsWith(countryCode.replace('+', ''))) {
        return countryCode + cleaned;
      }
      
      return '+' + cleaned;
    } catch (error) {
      logger.error('Failed to format phone number', {
        error: error instanceof Error ? error.message : 'Unknown error',
        phoneNumber,
        countryCode
      });
      return phoneNumber;
    }
  }

  /**
   * Get available templates
   */
  static getAvailableTemplates(): string[] {
    return Object.keys(this.TEMPLATES);
  }

  /**
   * Get template
   */
  static getTemplate(templateName: string): SmsTemplate | null {
    return this.TEMPLATES[templateName] || null;
  }

  /**
   * Add custom template
   */
  static addTemplate(template: SmsTemplate): void {
    try {
      this.TEMPLATES[template.name] = template;
      
      logger.info('SMS template added', {
        templateName: template.name
      });
    } catch (error) {
      logger.error('Failed to add SMS template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        template
      });
    }
  }

  /**
   * Remove template
   */
  static removeTemplate(templateName: string): boolean {
    try {
      if (this.TEMPLATES[templateName]) {
        delete this.TEMPLATES[templateName];
        
        logger.info('SMS template removed', {
          templateName
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to remove SMS template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateName
      });
      return false;
    }
  }

  /**
   * Send bulk SMS
   */
  static async sendBulkSms(
    recipients: Array<{ phone: string; data?: Record<string, any> }>,
    templateName: string,
    defaultData: Record<string, any> = {}
  ): Promise<Array<{ phone: string; result: SmsResult }>> {
    try {
      const results = [];

      for (const recipient of recipients) {
        const data = { ...defaultData, ...recipient.data };
        const result = await this.sendTemplatedSms(templateName, recipient.phone, data);
        
        results.push({
          phone: recipient.phone,
          result
        });
      }

      logger.info('Bulk SMS completed', {
        totalRecipients: recipients.length,
        successfulSends: results.filter(r => r.result.success).length
      });

      return results;

    } catch (error) {
      logger.error('Failed to send bulk SMS', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipientsCount: recipients.length,
        templateName
      });

      return recipients.map(recipient => ({
        phone: recipient.phone,
        result: {
          success: false,
          message: 'Failed to send bulk SMS',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  }

  /**
   * Check SMS delivery status
   */
  static async checkDeliveryStatus(messageId: string): Promise<{
    status: 'delivered' | 'failed' | 'pending' | 'unknown';
    timestamp?: Date;
    error?: string;
  }> {
    try {
      // In a real implementation, this would check with the SMS provider
      // For now, we'll simulate a delivery status check
      
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate delivery status (90% success rate)
      const isDelivered = Math.random() > 0.1;

      return {
        status: isDelivered ? 'delivered' : 'failed',
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Failed to check SMS delivery status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      });

      return {
        status: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default SmsService; 