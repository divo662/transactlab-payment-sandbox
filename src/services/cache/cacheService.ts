import { redisClient } from '../../config/redis';
import { logger } from '../../utils/helpers/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
  suffix?: string; // Key suffix for additional namespacing
  serialize?: boolean; // Whether to JSON serialize/deserialize
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

export class CacheService {
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0
  };

  // Cache key prefixes for different data types
  private static readonly PREFIXES = {
    USER: 'user',
    PRODUCT: 'product',
    PLAN: 'plan',
    TRANSACTION: 'transaction',
    SESSION: 'session',
    CUSTOMER: 'customer',
    WEBHOOK: 'webhook',
    API_KEY: 'api_key',
    ANALYTICS: 'analytics',
    SECURITY: 'security',
    DASHBOARD: 'dashboard'
  };

  // Default TTL values (in seconds)
  private static readonly DEFAULT_TTL = {
    USER: 300, // 5 minutes
    PRODUCT: 600, // 10 minutes
    PLAN: 600, // 10 minutes
    TRANSACTION: 1800, // 30 minutes
    SESSION: 3600, // 1 hour
    CUSTOMER: 300, // 5 minutes
    WEBHOOK: 1800, // 30 minutes
    API_KEY: 900, // 15 minutes
    ANALYTICS: 300, // 5 minutes
    SECURITY: 1800, // 30 minutes
    DASHBOARD: 60 // 1 minute
  };

  /**
   * Generate cache key with prefix
   */
  private static generateKey(prefix: string, identifier: string, suffix?: string): string {
    const key = suffix ? `${prefix}:${identifier}:${suffix}` : `${prefix}:${identifier}`;
    return key;
  }

  /**
   * Set cache value
   */
  static async set<T>(
    prefix: string, 
    identifier: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      if (!redisClient.isAvailable()) {
        logger.warn('Redis not available, skipping cache set');
        return;
      }

      const key = this.generateKey(options.prefix || prefix, identifier, options.suffix);
      const ttl = options.ttl || this.DEFAULT_TTL[prefix as keyof typeof this.DEFAULT_TTL] || 300;
      
      let cacheValue: string;
      if (options.serialize !== false) {
        cacheValue = JSON.stringify(value);
      } else {
        cacheValue = String(value);
      }

      await redisClient.set(key, cacheValue, ttl);
      this.stats.sets++;
      
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache SET error:', error);
    }
  }

  /**
   * Get cache value
   */
  static async get<T>(
    prefix: string, 
    identifier: string, 
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      if (!redisClient.isAvailable()) {
        logger.warn('Redis not available, skipping cache get');
        return null;
      }

      const key = this.generateKey(options.prefix || prefix, identifier, options.suffix);
      const cachedValue = await redisClient.get(key);

      if (cachedValue === null) {
        this.stats.misses++;
        logger.debug(`Cache MISS: ${key}`);
        return null;
      }

      this.stats.hits++;
      logger.debug(`Cache HIT: ${key}`);

      if (options.serialize !== false) {
        try {
          return JSON.parse(cachedValue) as T;
        } catch (parseError) {
          logger.error('Cache JSON parse error:', parseError);
          this.stats.errors++;
          return null;
        }
      }

      return cachedValue as T;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache GET error:', error);
      return null;
    }
  }

  /**
   * Delete cache value
   */
  static async delete(
    prefix: string, 
    identifier: string, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      if (!redisClient.isAvailable()) {
        logger.warn('Redis not available, skipping cache delete');
        return;
      }

      const key = this.generateKey(options.prefix || prefix, identifier, options.suffix);
      await redisClient.del(key);
      this.stats.deletes++;
      
      logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache DELETE error:', error);
    }
  }

  /**
   * Delete multiple cache keys by pattern
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      if (!redisClient.isAvailable()) {
        logger.warn('Redis not available, skipping cache pattern delete');
        return;
      }

      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        for (const key of keys) {
          await redisClient.del(key);
          this.stats.deletes++;
        }
        logger.debug(`Cache DELETE PATTERN: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache DELETE PATTERN error:', error);
    }
  }

  /**
   * Check if cache key exists
   */
  static async exists(
    prefix: string, 
    identifier: string, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      if (!redisClient.isAvailable()) {
        return false;
      }

      const key = this.generateKey(options.prefix || prefix, identifier, options.suffix);
      return await redisClient.exists(key);
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache EXISTS error:', error);
      return false;
    }
  }

  /**
   * Get or set cache value (cache-aside pattern)
   */
  static async getOrSet<T>(
    prefix: string,
    identifier: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cachedValue = await this.get<T>(prefix, identifier, options);
      if (cachedValue !== null) {
        return cachedValue;
      }

      // Cache miss - fetch from source
      logger.debug(`Cache MISS, fetching: ${prefix}:${identifier}`);
      const value = await fetchFunction();
      
      // Store in cache
      await this.set(prefix, identifier, value, options);
      
      return value;
    } catch (error) {
      logger.error('Cache GET_OR_SET error:', error);
      // Fallback to direct fetch if cache fails
      return await fetchFunction();
    }
  }

  /**
   * Invalidate user-related cache
   */
  static async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `${this.PREFIXES.USER}:${userId}*`,
      `${this.PREFIXES.PRODUCT}:*:${userId}`,
      `${this.PREFIXES.PLAN}:*:${userId}`,
      `${this.PREFIXES.TRANSACTION}:*:${userId}`,
      `${this.PREFIXES.SESSION}:*:${userId}`,
      `${this.PREFIXES.CUSTOMER}:*:${userId}`,
      `${this.PREFIXES.API_KEY}:*:${userId}`,
      `${this.PREFIXES.ANALYTICS}:*:${userId}`,
      `${this.PREFIXES.DASHBOARD}:${userId}*`
    ];

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }

    logger.info(`Invalidated user cache for: ${userId}`);
  }

  /**
   * Invalidate product-related cache
   */
  static async invalidateProductCache(productId: string, userId?: string): Promise<void> {
    const patterns = [
      `${this.PREFIXES.PRODUCT}:${productId}*`,
      `${this.PREFIXES.PLAN}:*:${productId}*`
    ];

    if (userId) {
      patterns.push(`${this.PREFIXES.DASHBOARD}:${userId}*`);
    }

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }

    logger.info(`Invalidated product cache for: ${productId}`);
  }

  /**
   * Invalidate transaction-related cache
   */
  static async invalidateTransactionCache(transactionId: string, userId?: string): Promise<void> {
    const patterns = [
      `${this.PREFIXES.TRANSACTION}:${transactionId}*`,
      `${this.PREFIXES.ANALYTICS}:*`
    ];

    if (userId) {
      patterns.push(`${this.PREFIXES.DASHBOARD}:${userId}*`);
    }

    for (const pattern of patterns) {
      await this.deletePattern(pattern);
    }

    logger.info(`Invalidated transaction cache for: ${transactionId}`);
  }

  /**
   * Get cache statistics
   */
  static getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  static resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  static async warmUpCache(userId: string): Promise<void> {
    try {
      logger.info(`Warming up cache for user: ${userId}`);
      
      // This would typically preload user's most frequently accessed data
      // Implementation depends on your specific use cases
      
      logger.info(`Cache warm-up completed for user: ${userId}`);
    } catch (error) {
      logger.error('Cache warm-up error:', error);
    }
  }

  /**
   * Check if Redis is available
   */
  static isAvailable(): boolean {
    return redisClient.isAvailable();
  }

  // Convenience methods for specific data types
  static async setUser<T>(userId: string, data: T, ttl?: number): Promise<void> {
    return this.set(this.PREFIXES.USER, userId, data, { ttl });
  }

  static async getUser<T>(userId: string): Promise<T | null> {
    return this.get<T>(this.PREFIXES.USER, userId);
  }

  static async setProduct<T>(productId: string, data: T, ttl?: number): Promise<void> {
    return this.set(this.PREFIXES.PRODUCT, productId, data, { ttl });
  }

  static async getProduct<T>(productId: string): Promise<T | null> {
    return this.get<T>(this.PREFIXES.PRODUCT, productId);
  }

  static async setTransaction<T>(transactionId: string, data: T, ttl?: number): Promise<void> {
    return this.set(this.PREFIXES.TRANSACTION, transactionId, data, { ttl });
  }

  static async getTransaction<T>(transactionId: string): Promise<T | null> {
    return this.get<T>(this.PREFIXES.TRANSACTION, transactionId);
  }

  static async setAnalytics<T>(key: string, data: T, ttl?: number): Promise<void> {
    return this.set(this.PREFIXES.ANALYTICS, key, data, { ttl });
  }

  static async getAnalytics<T>(key: string): Promise<T | null> {
    return this.get<T>(this.PREFIXES.ANALYTICS, key);
  }

  static async setDashboard<T>(userId: string, data: T, ttl?: number): Promise<void> {
    return this.set(this.PREFIXES.DASHBOARD, userId, data, { ttl });
  }

  static async getDashboard<T>(userId: string): Promise<T | null> {
    return this.get<T>(this.PREFIXES.DASHBOARD, userId);
  }
}

export default CacheService;
