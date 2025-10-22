"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class RedisClient {
    constructor() {
        this.client = null;
        const redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    return true;
                }
                return false;
            },
        };
        try {
            this.client = new ioredis_1.default(redisConfig);
            this.client.on('connect', () => {
                logger_1.logger.info('Redis client connecting...');
            });
            this.client.on('ready', () => {
                logger_1.logger.info('✅ Redis connected successfully');
            });
            this.client.on('error', (err) => {
                logger_1.logger.error('Redis connection error:', err);
            });
            this.client.on('close', () => {
                logger_1.logger.warn('Redis connection closed');
            });
            this.client.on('reconnecting', () => {
                logger_1.logger.info('Redis reconnecting...');
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to create Redis client:', error);
        }
    }
    getClient() {
        return this.client;
    }
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            logger_1.logger.info('Redis disconnected');
        }
    }
}
exports.redisClient = new RedisClient();
exports.redis = exports.redisClient.getClient();
//# sourceMappingURL=redis.js.map