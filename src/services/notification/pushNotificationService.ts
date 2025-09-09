import { logger } from '../../utils/helpers/logger';

export interface PushNotificationOptions {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  image?: string;
  badge?: number;
  sound?: string;
  priority?: 'high' | 'normal';
  ttl?: number;
  channel?: string;
}

export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

export interface PushNotificationTemplate {
  name: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface DeviceToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  appVersion?: string;
  lastSeen?: Date;
}

/**
 * Push Notification Service
 * Handles push notifications for mobile apps
 */
export class PushNotificationService {
  private static readonly TEMPLATES: Record<string, PushNotificationTemplate> = {
    'payment_success': {
      name: 'payment_success',
      title: 'Payment Successful',
      body: 'Your payment of {{amount}} {{currency}} has been processed successfully.',
      data: {
        type: 'payment_success',
        reference: '{{reference}}',
        amount: '{{amount}}',
        currency: '{{currency}}'
      }
    },
    'payment_failed': {
      name: 'payment_failed',
      title: 'Payment Failed',
      body: 'Your payment of {{amount}} {{currency}} could not be processed.',
      data: {
        type: 'payment_failed',
        reference: '{{reference}}',
        amount: '{{amount}}',
        currency: '{{currency}}',
        reason: '{{reason}}'
      }
    },
    'refund_processed': {
      name: 'refund_processed',
      title: 'Refund Processed',
      body: 'Your refund of {{amount}} {{currency}} has been processed.',
      data: {
        type: 'refund_processed',
        reference: '{{reference}}',
        amount: '{{amount}}',
        currency: '{{currency}}'
      }
    },
    'security_alert': {
      name: 'security_alert',
      title: 'Security Alert',
      body: 'New API key created for your account. If this wasn\'t you, contact support immediately.',
      data: {
        type: 'security_alert',
        action: 'api_key_created'
      }
    },
    'welcome': {
      name: 'welcome',
      title: 'Welcome to TransactLab!',
      body: 'Your account has been created successfully. Start processing payments now!',
      data: {
        type: 'welcome'
      }
    },
    'transaction_update': {
      name: 'transaction_update',
      title: 'Transaction Update',
      body: 'Your transaction {{reference}} status has been updated to {{status}}.',
      data: {
        type: 'transaction_update',
        reference: '{{reference}}',
        status: '{{status}}'
      }
    }
  };

  // Mock device tokens storage (in real app, this would be in database)
  private static readonly DEVICE_TOKENS: Map<string, DeviceToken[]> = new Map();

  /**
   * Send push notification
   */
  static async sendPushNotification(options: PushNotificationOptions): Promise<PushNotificationResult> {
    try {
      // In a real implementation, this would use Firebase Cloud Messaging, Apple Push Notification Service, etc.
      // For now, we'll simulate the push notification sending process
      
      const notificationData = {
        to: Array.isArray(options.to) ? options.to : [options.to],
        title: options.title,
        body: options.body,
        data: options.data || {},
        image: options.image,
        badge: options.badge,
        sound: options.sound || 'default',
        priority: options.priority || 'normal',
        ttl: options.ttl || 86400, // 24 hours
        channel: options.channel
      };

      // Simulate push notification sending delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate a mock message ID
      const messageId = `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info('Push notification sent successfully', {
        messageId,
        to: notificationData.to,
        title: notificationData.title
      });

      return {
        success: true,
        messageId,
        message: 'Push notification sent successfully'
      };

    } catch (error) {
      logger.error('Failed to send push notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        options
      });

      return {
        success: false,
        message: 'Failed to send push notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send templated push notification
   */
  static async sendTemplatedPushNotification(
    templateName: string,
    to: string | string[],
    data: Record<string, any>,
    options: Partial<PushNotificationOptions> = {}
  ): Promise<PushNotificationResult> {
    try {
      const template = this.TEMPLATES[templateName];
      if (!template) {
        return {
          success: false,
          message: `Push notification template '${templateName}' not found`
        };
      }

      // Replace template variables
      const title = this.replaceTemplateVariables(template.title, data);
      const body = this.replaceTemplateVariables(template.body, data);
      const templateData = template.data ? this.replaceTemplateVariablesInObject(template.data, data) : {};

      const notificationOptions: PushNotificationOptions = {
        to,
        title,
        body,
        data: { ...templateData, ...options.data },
        ...options
      };

      return await this.sendPushNotification(notificationOptions);

    } catch (error) {
      logger.error('Failed to send templated push notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateName,
        to,
        data
      });

      return {
        success: false,
        message: 'Failed to send templated push notification',
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
   * Replace template variables in object
   */
  static replaceTemplateVariablesInObject(obj: Record<string, any>, data: Record<string, any>): Record<string, any> {
    try {
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          result[key] = this.replaceTemplateVariables(value, data);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Failed to replace template variables in object', {
        error: error instanceof Error ? error.message : 'Unknown error',
        obj,
        data
      });
      return obj;
    }
  }

  /**
   * Register device token
   */
  static async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceId?: string,
    appVersion?: string
  ): Promise<boolean> {
    try {
      const deviceToken: DeviceToken = {
        userId,
        token,
        platform,
        deviceId,
        appVersion,
        lastSeen: new Date()
      };

      // Get existing tokens for user
      const userTokens = this.DEVICE_TOKENS.get(userId) || [];
      
      // Remove existing token if it exists
      const filteredTokens = userTokens.filter(t => t.token !== token);
      
      // Add new token
      filteredTokens.push(deviceToken);
      
      // Update storage
      this.DEVICE_TOKENS.set(userId, filteredTokens);

      logger.info('Device token registered', {
        userId,
        platform,
        deviceId
      });

      return true;

    } catch (error) {
      logger.error('Failed to register device token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        platform
      });
      return false;
    }
  }

  /**
   * Unregister device token
   */
  static async unregisterDeviceToken(userId: string, token: string): Promise<boolean> {
    try {
      const userTokens = this.DEVICE_TOKENS.get(userId) || [];
      const filteredTokens = userTokens.filter(t => t.token !== token);
      
      this.DEVICE_TOKENS.set(userId, filteredTokens);

      logger.info('Device token unregistered', {
        userId,
        token: token.substring(0, 10) + '...'
      });

      return true;

    } catch (error) {
      logger.error('Failed to unregister device token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      return false;
    }
  }

  /**
   * Get user device tokens
   */
  static async getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
    try {
      return this.DEVICE_TOKENS.get(userId) || [];
    } catch (error) {
      logger.error('Failed to get user device tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      return [];
    }
  }

  /**
   * Send push notification to user
   */
  static async sendPushNotificationToUser(
    userId: string,
    templateName: string,
    data: Record<string, any>,
    options: Partial<PushNotificationOptions> = {}
  ): Promise<PushNotificationResult[]> {
    try {
      const deviceTokens = await this.getUserDeviceTokens(userId);
      
      if (deviceTokens.length === 0) {
        logger.warn('No device tokens found for user', { userId });
        return [];
      }

      const tokens = deviceTokens.map(dt => dt.token);
      const result = await this.sendTemplatedPushNotification(templateName, tokens, data, options);

      return [result];

    } catch (error) {
      logger.error('Failed to send push notification to user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        templateName
      });

      return [{
        success: false,
        message: 'Failed to send push notification to user',
        error: error instanceof Error ? error.message : 'Unknown error'
      }];
    }
  }

  /**
   * Send payment success push notification
   */
  static async sendPaymentSuccessPushNotification(
    userId: string,
    data: {
      amount: number;
      currency: string;
      reference: string;
    }
  ): Promise<PushNotificationResult[]> {
    return await this.sendPushNotificationToUser(userId, 'payment_success', data);
  }

  /**
   * Send payment failed push notification
   */
  static async sendPaymentFailedPushNotification(
    userId: string,
    data: {
      amount: number;
      currency: string;
      reference: string;
      reason: string;
    }
  ): Promise<PushNotificationResult[]> {
    return await this.sendPushNotificationToUser(userId, 'payment_failed', data);
  }

  /**
   * Send refund processed push notification
   */
  static async sendRefundProcessedPushNotification(
    userId: string,
    data: {
      amount: number;
      currency: string;
      reference: string;
    }
  ): Promise<PushNotificationResult[]> {
    return await this.sendPushNotificationToUser(userId, 'refund_processed', data);
  }

  /**
   * Send security alert push notification
   */
  static async sendSecurityAlertPushNotification(
    userId: string
  ): Promise<PushNotificationResult[]> {
    return await this.sendPushNotificationToUser(userId, 'security_alert', {});
  }

  /**
   * Send welcome push notification
   */
  static async sendWelcomePushNotification(
    userId: string
  ): Promise<PushNotificationResult[]> {
    return await this.sendPushNotificationToUser(userId, 'welcome', {});
  }

  /**
   * Send transaction update push notification
   */
  static async sendTransactionUpdatePushNotification(
    userId: string,
    data: {
      reference: string;
      status: string;
    }
  ): Promise<PushNotificationResult[]> {
    return await this.sendPushNotificationToUser(userId, 'transaction_update', data);
  }

  /**
   * Send bulk push notifications
   */
  static async sendBulkPushNotifications(
    users: Array<{ userId: string; data?: Record<string, any> }>,
    templateName: string,
    defaultData: Record<string, any> = {}
  ): Promise<Array<{ userId: string; results: PushNotificationResult[] }>> {
    try {
      const results = [];

      for (const user of users) {
        const data = { ...defaultData, ...user.data };
        const userResults = await this.sendPushNotificationToUser(user.userId, templateName, data);
        
        results.push({
          userId: user.userId,
          results: userResults
        });
      }

      logger.info('Bulk push notifications completed', {
        totalUsers: users.length,
        successfulSends: results.filter(r => r.results.some(res => res.success)).length
      });

      return results;

    } catch (error) {
      logger.error('Failed to send bulk push notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        usersCount: users.length,
        templateName
      });

      return users.map(user => ({
        userId: user.userId,
        results: [{
          success: false,
          message: 'Failed to send bulk push notifications',
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      }));
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
  static getTemplate(templateName: string): PushNotificationTemplate | null {
    return this.TEMPLATES[templateName] || null;
  }

  /**
   * Add custom template
   */
  static addTemplate(template: PushNotificationTemplate): void {
    try {
      this.TEMPLATES[template.name] = template;
      
      logger.info('Push notification template added', {
        templateName: template.name
      });
    } catch (error) {
      logger.error('Failed to add push notification template', {
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
        
        logger.info('Push notification template removed', {
          templateName
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to remove push notification template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateName
      });
      return false;
    }
  }

  /**
   * Clean up expired device tokens
   */
  static async cleanupExpiredTokens(expiryDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - expiryDays);

      let removedCount = 0;

      for (const [userId, tokens] of this.DEVICE_TOKENS.entries()) {
        const validTokens = tokens.filter(token => {
          return token.lastSeen && token.lastSeen > cutoffDate;
        });

        if (validTokens.length !== tokens.length) {
          this.DEVICE_TOKENS.set(userId, validTokens);
          removedCount += tokens.length - validTokens.length;
        }
      }

      logger.info('Expired device tokens cleaned up', {
        removedCount
      });

      return removedCount;

    } catch (error) {
      logger.error('Failed to cleanup expired tokens', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }
}

export default PushNotificationService; 