import { CacheService } from './cacheService';
import { logger } from '../../utils/helpers/logger';

export class CacheInvalidationService {
  /**
   * Invalidate all user-related caches
   */
  static async invalidateUserData(userId: string): Promise<void> {
    try {
      logger.info(`Invalidating all caches for user: ${userId}`);
      
      const patterns = [
        `products:${userId}`,
        `analytics:*:${userId}:*`,
        `dashboard:${userId}`,
        `transactions:*:${userId}`,
        `customers:*:${userId}`,
        `sessions:*:${userId}`,
        `plans:*:${userId}`,
        `subscriptions:*:${userId}`,
        `webhooks:*:${userId}`,
        `api_keys:*:${userId}`
      ];

      for (const pattern of patterns) {
        await CacheService.deletePattern(pattern);
      }

      logger.info(`Cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating user cache:', error);
    }
  }

  /**
   * Invalidate product-related caches
   */
  static async invalidateProductData(userId: string, productId?: string): Promise<void> {
    try {
      if (productId) {
        logger.info(`Invalidating product cache: ${productId} for user: ${userId}`);
        await CacheService.deletePattern(`product:${productId}*`);
      }
      
      // Always invalidate user's products list
      await CacheService.delete('products', userId);
      
      // Invalidate analytics that might include this product
      await CacheService.deletePattern(`analytics:*:${userId}:*`);
      
      logger.info(`Product cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating product cache:', error);
    }
  }

  /**
   * Invalidate transaction-related caches
   */
  static async invalidateTransactionData(userId: string, transactionId?: string): Promise<void> {
    try {
      if (transactionId) {
        logger.info(`Invalidating transaction cache: ${transactionId} for user: ${userId}`);
        await CacheService.deletePattern(`transaction:${transactionId}*`);
      }
      
      // Invalidate analytics that include transaction data
      await CacheService.deletePattern(`analytics:*:${userId}:*`);
      
      // Invalidate dashboard data
      await CacheService.delete('dashboard', userId);
      
      logger.info(`Transaction cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating transaction cache:', error);
    }
  }

  /**
   * Invalidate customer-related caches
   */
  static async invalidateCustomerData(userId: string, customerId?: string): Promise<void> {
    try {
      if (customerId) {
        logger.info(`Invalidating customer cache: ${customerId} for user: ${userId}`);
        await CacheService.deletePattern(`customer:${customerId}*`);
      }
      
      // Invalidate analytics that include customer data
      await CacheService.deletePattern(`analytics:*:${userId}:*`);
      
      logger.info(`Customer cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating customer cache:', error);
    }
  }

  /**
   * Invalidate session-related caches
   */
  static async invalidateSessionData(userId: string, sessionId?: string): Promise<void> {
    try {
      if (sessionId) {
        logger.info(`Invalidating session cache: ${sessionId} for user: ${userId}`);
        await CacheService.deletePattern(`session:${sessionId}*`);
      }
      
      // Invalidate analytics that include session data
      await CacheService.deletePattern(`analytics:*:${userId}:*`);
      
      // Invalidate dashboard data
      await CacheService.delete('dashboard', userId);
      
      logger.info(`Session cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating session cache:', error);
    }
  }

  /**
   * Invalidate plan-related caches
   */
  static async invalidatePlanData(userId: string, planId?: string): Promise<void> {
    try {
      if (planId) {
        logger.info(`Invalidating plan cache: ${planId} for user: ${userId}`);
        await CacheService.deletePattern(`plan:${planId}*`);
      }
      
      // Invalidate subscription data that might reference this plan
      await CacheService.deletePattern(`subscriptions:*:${userId}`);
      
      logger.info(`Plan cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating plan cache:', error);
    }
  }

  /**
   * Invalidate subscription-related caches
   */
  static async invalidateSubscriptionData(userId: string, subscriptionId?: string): Promise<void> {
    try {
      if (subscriptionId) {
        logger.info(`Invalidating subscription cache: ${subscriptionId} for user: ${userId}`);
        await CacheService.deletePattern(`subscription:${subscriptionId}*`);
      }
      
      // Invalidate analytics that include subscription data
      await CacheService.deletePattern(`analytics:*:${userId}:*`);
      
      logger.info(`Subscription cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating subscription cache:', error);
    }
  }

  /**
   * Invalidate webhook-related caches
   */
  static async invalidateWebhookData(userId: string, webhookId?: string): Promise<void> {
    try {
      if (webhookId) {
        logger.info(`Invalidating webhook cache: ${webhookId} for user: ${userId}`);
        await CacheService.deletePattern(`webhook:${webhookId}*`);
      }
      
      // Invalidate analytics that include webhook data
      await CacheService.deletePattern(`analytics:*:${userId}:*`);
      
      logger.info(`Webhook cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating webhook cache:', error);
    }
  }

  /**
   * Invalidate API key-related caches
   */
  static async invalidateApiKeyData(userId: string, apiKeyId?: string): Promise<void> {
    try {
      if (apiKeyId) {
        logger.info(`Invalidating API key cache: ${apiKeyId} for user: ${userId}`);
        await CacheService.deletePattern(`api_key:${apiKeyId}*`);
      }
      
      logger.info(`API key cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating API key cache:', error);
    }
  }

  /**
   * Invalidate all analytics caches for a user
   */
  static async invalidateAnalyticsData(userId: string): Promise<void> {
    try {
      logger.info(`Invalidating analytics caches for user: ${userId}`);
      await CacheService.deletePattern(`analytics:*:${userId}:*`);
      logger.info(`Analytics cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating analytics cache:', error);
    }
  }

  /**
   * Invalidate dashboard caches for a user
   */
  static async invalidateDashboardData(userId: string): Promise<void> {
    try {
      logger.info(`Invalidating dashboard caches for user: ${userId}`);
      await CacheService.delete('dashboard', userId);
      logger.info(`Dashboard cache invalidation completed for user: ${userId}`);
    } catch (error) {
      logger.error('Error invalidating dashboard cache:', error);
    }
  }

  /**
   * Invalidate all caches (use with caution - only for admin operations)
   */
  static async invalidateAllCaches(): Promise<void> {
    try {
      logger.warn('Invalidating ALL caches - this should only be used for admin operations');
      
      const patterns = [
        'user:*',
        'product:*',
        'plan:*',
        'transaction:*',
        'session:*',
        'customer:*',
        'webhook:*',
        'api_key:*',
        'analytics:*',
        'dashboard:*'
      ];

      for (const pattern of patterns) {
        await CacheService.deletePattern(pattern);
      }

      logger.warn('ALL caches invalidated');
    } catch (error) {
      logger.error('Error invalidating all caches:', error);
    }
  }
}

export default CacheInvalidationService;
