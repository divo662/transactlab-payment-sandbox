import { CacheService } from './cacheService';
import { logger } from '../../utils/helpers/logger';

export interface CacheDecoratorOptions {
  prefix: string;
  ttl?: number;
  keyGenerator?: (...args: any[]) => string;
  invalidateOn?: string[]; // Method names that should invalidate this cache
  skipCache?: boolean; // Skip caching for this call
}

/**
 * Cache decorator for class methods
 * Automatically caches method results and invalidates on specified methods
 */
export function Cacheable(options: CacheDecoratorOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      // Skip cache if requested
      if (options.skipCache) {
        return await method.apply(this, args);
      }

      try {
        // Generate cache key
        let cacheKey: string;
        if (options.keyGenerator) {
          cacheKey = options.keyGenerator(...args);
        } else {
          // Default key generation using first argument
          cacheKey = args[0]?.toString() || 'default';
        }

        const fullCacheKey = `${className}:${propertyName}:${cacheKey}`;

        // Try to get from cache
        const cachedResult = await CacheService.get('method', fullCacheKey);
        if (cachedResult !== null) {
          logger.debug(`Cache HIT: ${fullCacheKey}`);
          return cachedResult;
        }

        // Cache miss - execute method
        logger.debug(`Cache MISS: ${fullCacheKey}`);
        const result = await method.apply(this, args);

        // Store result in cache
        if (result !== null && result !== undefined) {
          await CacheService.set('method', fullCacheKey, result, {
            prefix: options.prefix,
            ttl: options.ttl
          });
        }

        return result;
      } catch (error) {
        logger.error(`Cache decorator error for ${className}.${propertyName}:`, error);
        // Fallback to original method if cache fails
        return await method.apply(this, args);
      }
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 * Automatically invalidates related caches when this method is called
 */
export function CacheInvalidate(patterns: string[]) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      // Execute the original method
      const result = await method.apply(this, args);

      // Invalidate cache patterns
      try {
        for (const pattern of patterns) {
          // Replace placeholders with actual values from args
          let resolvedPattern = pattern;
          
          // Replace common placeholders
          resolvedPattern = resolvedPattern.replace('{userId}', args[0]?.toString() || '*');
          resolvedPattern = resolvedPattern.replace('{productId}', args[0]?.toString() || '*');
          resolvedPattern = resolvedPattern.replace('{transactionId}', args[0]?.toString() || '*');
          resolvedPattern = resolvedPattern.replace('{sessionId}', args[0]?.toString() || '*');
          
          await CacheService.deletePattern(resolvedPattern);
          logger.debug(`Cache invalidated: ${resolvedPattern}`);
        }
      } catch (error) {
        logger.error(`Cache invalidation error for ${className}.${propertyName}:`, error);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache middleware for Express routes
 * Automatically caches GET responses
 */
export function cacheMiddleware(options: {
  prefix: string;
  ttl?: number;
  keyGenerator?: (req: any) => string;
  skipCache?: (req: any) => boolean;
}) {
  return async (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if condition is met
    if (options.skipCache && options.skipCache(req)) {
      return next();
    }

    try {
      // Generate cache key
      let cacheKey: string;
      if (options.keyGenerator) {
        cacheKey = options.keyGenerator(req);
      } else {
        // Default key generation using URL and user ID
        const userId = req.user?._id?.toString() || 'anonymous';
        cacheKey = `${req.originalUrl}:${userId}`;
      }

      const fullCacheKey = `route:${options.prefix}:${cacheKey}`;

      // Try to get from cache
      const cachedResponse = await CacheService.get('route', fullCacheKey);
      if (cachedResponse !== null) {
        logger.debug(`Route cache HIT: ${fullCacheKey}`);
        return res.json(cachedResponse);
      }

      // Cache miss - intercept response
      const originalJson = res.json;
      res.json = function (data: any) {
        // Store in cache
        CacheService.set('route', fullCacheKey, data, {
          prefix: options.prefix,
          ttl: options.ttl
        }).catch(error => {
          logger.error('Route cache SET error:', error);
        });

        // Send response
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * User-specific cache key generator
 */
export function userCacheKeyGenerator(userId: string, suffix: string = '') {
  return `${userId}${suffix ? ':' + suffix : ''}`;
}

/**
 * Product-specific cache key generator
 */
export function productCacheKeyGenerator(productId: string, userId?: string) {
  return userId ? `${productId}:${userId}` : productId;
}

/**
 * Transaction-specific cache key generator
 */
export function transactionCacheKeyGenerator(transactionId: string, userId?: string) {
  return userId ? `${transactionId}:${userId}` : transactionId;
}

export default {
  Cacheable,
  CacheInvalidate,
  cacheMiddleware,
  userCacheKeyGenerator,
  productCacheKeyGenerator,
  transactionCacheKeyGenerator
};
