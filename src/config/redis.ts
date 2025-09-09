import { createClient } from 'redis';
import { logger } from '../utils/helpers/logger';
import { ENV } from './environment';

const REDIS_URL = ENV.REDIS_URL;

class RedisClient {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: REDIS_URL,
        socket: {
          connectTimeout: 5000, // 5 second timeout
          reconnectStrategy: (retries) => {
            if (retries > 3) { // Reduced from 10 to 3
              logger.warn('Redis connection failed, continuing without Redis');
              return false; // Stop trying to reconnect
            }
            return Math.min(retries * 100, 1000);
          },
        },
      });

      this.client.on('error', (err) => {
        logger.warn('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('🔗 Redis connected');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('🔄 Redis reconnecting...');
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.warn('Redis connection ended');
        this.isConnected = false;
      });

      // Try to connect with timeout
      const connectionPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
      });

      try {
        await Promise.race([connectionPromise, timeoutPromise]);
      } catch (error) {
        logger.warn('Redis connection failed or timed out, continuing without Redis');
        this.isConnected = false;
        // Don't throw error, just log and continue
      }
    } catch (error) {
      logger.warn('Failed to initialize Redis client, continuing without Redis:', error);
      this.isConnected = false;
      // Don't exit process, Redis is optional for caching
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        logger.info('Redis disconnected');
        this.isConnected = false;
      } catch (error) {
        logger.warn('Error disconnecting Redis:', error);
      }
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.warn('Redis SET error:', error);
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.warn('Redis GET error:', error);
      this.isConnected = false;
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (error) {
      logger.warn('Redis DEL error:', error);
      this.isConnected = false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.warn('Redis EXISTS error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    if (!this.client || !this.isConnected) return 0;
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.warn('Redis INCR error:', error);
      this.isConnected = false;
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      logger.warn('Redis EXPIRE error:', error);
      this.isConnected = false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) return [];
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.warn('Redis KEYS error:', error);
      this.isConnected = false;
      return [];
    }
  }

  // Check if Redis is available
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export const redisClient = new RedisClient(); 