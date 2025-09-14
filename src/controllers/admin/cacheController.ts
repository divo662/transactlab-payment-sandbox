import { Request, Response } from 'express';
import { CacheService } from '../../services/cache/cacheService';
import { CacheInvalidationService } from '../../services/cache/cacheInvalidationService';
import { logger } from '../../utils/helpers/logger';

export class CacheController {
  /**
   * Get cache statistics
   * GET /api/v1/admin/cache/stats
   */
  static async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = CacheService.getStats();
      
      res.json({
        success: true,
        data: {
          ...stats,
          hitRate: stats.hits + stats.misses > 0 ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) + '%' : '0%',
          redisAvailable: CacheService.isAvailable()
        }
      });
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cache statistics'
      });
    }
  }

  /**
   * Reset cache statistics
   * POST /api/v1/admin/cache/stats/reset
   */
  static async resetCacheStats(req: Request, res: Response): Promise<void> {
    try {
      CacheService.resetStats();
      
      res.json({
        success: true,
        message: 'Cache statistics reset successfully'
      });
    } catch (error) {
      logger.error('Error resetting cache stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset cache statistics'
      });
    }
  }

  /**
   * Invalidate user cache
   * DELETE /api/v1/admin/cache/user/:userId
   */
  static async invalidateUserCache(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      await CacheInvalidationService.invalidateUserData(userId);
      
      logger.info(`Admin cache invalidation: User ${userId}`);
      
      res.json({
        success: true,
        message: `Cache invalidated for user ${userId}`
      });
    } catch (error) {
      logger.error('Error invalidating user cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invalidate user cache'
      });
    }
  }

  /**
   * Invalidate all caches
   * DELETE /api/v1/admin/cache/all
   */
  static async invalidateAllCache(req: Request, res: Response): Promise<void> {
    try {
      await CacheInvalidationService.invalidateAllCaches();
      
      logger.warn('Admin cache invalidation: ALL caches cleared');
      
      res.json({
        success: true,
        message: 'All caches invalidated successfully'
      });
    } catch (error) {
      logger.error('Error invalidating all caches:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invalidate all caches'
      });
    }
  }

  /**
   * Warm up cache for a user
   * POST /api/v1/admin/cache/warmup/:userId
   */
  static async warmupUserCache(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      await CacheService.warmUpCache(userId);
      
      logger.info(`Admin cache warmup: User ${userId}`);
      
      res.json({
        success: true,
        message: `Cache warmed up for user ${userId}`
      });
    } catch (error) {
      logger.error('Error warming up user cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to warm up user cache'
      });
    }
  }

  /**
   * Get cache health status
   * GET /api/v1/admin/cache/health
   */
  static async getCacheHealth(req: Request, res: Response): Promise<void> {
    try {
      const isAvailable = CacheService.isAvailable();
      
      // Test basic cache operations
      let isWorking = false;
      if (isAvailable) {
        try {
          const testKey = 'health-check';
          const testValue = { timestamp: new Date().toISOString() };
          
          await CacheService.set('test', testKey, testValue, { ttl: 10 });
          const retrieved = await CacheService.get('test', testKey);
          await CacheService.delete('test', testKey);
          
          isWorking = retrieved !== null;
        } catch (error) {
          logger.error('Cache health check failed:', error);
        }
      }

      res.json({
        success: true,
        data: {
          available: isAvailable,
          working: isWorking,
          status: isAvailable && isWorking ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error checking cache health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check cache health'
      });
    }
  }
}

export default CacheController;
