import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../../services/cache/cacheService';
import { logger } from '../../utils/helpers/logger';

export interface CacheMiddlewareOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
  prefix?: string;
}

/**
 * Express middleware to cache GET responses
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = 300, // Default 5 minutes
    keyGenerator,
    skipCache,
    prefix = 'route'
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if condition is met
    if (skipCache && skipCache(req)) {
      return next();
    }

    try {
      // Generate cache key
      let cacheKey: string;
      if (keyGenerator) {
        cacheKey = keyGenerator(req);
      } else {
        // Default key generation using URL, query params, and user ID
        const userId = (req as any).user?._id?.toString() || 'anonymous';
        const queryString = req.query ? JSON.stringify(req.query) : '';
        cacheKey = `${req.originalUrl}:${userId}:${queryString}`;
      }

      const fullCacheKey = `${prefix}:${cacheKey}`;

      // Try to get from cache
      const cachedResponse = await CacheService.get('route', fullCacheKey);
      if (cachedResponse !== null) {
        logger.debug(`Route cache HIT: ${fullCacheKey}`);
        return res.json(cachedResponse);
      }

      // Cache miss - intercept response
      const originalJson = res.json;
      res.json = function (data: any) {
        // Store in cache (don't await to avoid blocking response)
        CacheService.set('route', fullCacheKey, data, {
          prefix,
          ttl
        }).catch(error => {
          logger.error('Route cache SET error:', error);
        });

        logger.debug(`Route cache SET: ${fullCacheKey}`);
        
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
 * Cache key generators for common use cases
 */
export const cacheKeyGenerators = {
  /**
   * Generate cache key based on user ID and route
   */
  userRoute: (req: Request): string => {
    const userId = (req as any).user?._id?.toString() || 'anonymous';
    const route = req.path;
    const query = req.query ? JSON.stringify(req.query) : '';
    return `user:${userId}:${route}:${query}`;
  },

  /**
   * Generate cache key for API endpoints
   */
  apiRoute: (req: Request): string => {
    const userId = (req as any).user?._id?.toString() || 'anonymous';
    const apiKey = req.headers['x-api-key'] || 'no-key';
    const route = req.path;
    const query = req.query ? JSON.stringify(req.query) : '';
    return `api:${userId}:${apiKey}:${route}:${query}`;
  },

  /**
   * Generate cache key for dashboard data
   */
  dashboard: (req: Request): string => {
    const userId = (req as any).user?._id?.toString() || 'anonymous';
    const timeRange = req.query.timeRange || '30d';
    return `dashboard:${userId}:${timeRange}`;
  },

  /**
   * Generate cache key for analytics data
   */
  analytics: (req: Request): string => {
    const userId = (req as any).user?._id?.toString() || 'anonymous';
    const timeRange = req.query.timeRange || '30d';
    const type = req.query.type || 'overview';
    return `analytics:${type}:${userId}:${timeRange}`;
  }
};

/**
 * Skip cache conditions
 */
export const skipCacheConditions = {
  /**
   * Skip cache for admin users
   */
  skipForAdmins: (req: Request): boolean => {
    const user = (req as any).user;
    return user && user.role === 'admin';
  },

  /**
   * Skip cache for requests with no-cache header
   */
  skipWithNoCacheHeader: (req: Request): boolean => {
    return req.headers['cache-control'] === 'no-cache' || 
           req.headers['x-no-cache'] === 'true';
  },

  /**
   * Skip cache for real-time data endpoints
   */
  skipRealTimeEndpoints: (req: Request): boolean => {
    const realTimePaths = ['/live', '/realtime', '/stream', '/events'];
    return realTimePaths.some(path => req.path.includes(path));
  }
};

export default cacheMiddleware;
