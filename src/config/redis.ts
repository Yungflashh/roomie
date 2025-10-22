import Redis from 'ioredis';
import { logger } from '../utils/logger';
import dotenv from "dotenv"


dotenv.config()


class RedisClient {
  private client: Redis | null = null;

  constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    };

    try {
      this.client = new Redis(redisConfig);

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis connected successfully');
      });

      this.client.on('error', (err: Error) => {
        logger.error('Redis connection error:', err);
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });
    } catch (error) {
      logger.error('Failed to create Redis client:', error);
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis disconnected');
    }
  }
}

export const redisClient = new RedisClient();
export const redis = redisClient.getClient();