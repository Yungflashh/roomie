import Redis from 'ioredis';
declare class RedisClient {
    private client;
    constructor();
    getClient(): Redis | null;
    disconnect(): Promise<void>;
}
export declare const redisClient: RedisClient;
export declare const redis: Redis | null;
export {};
//# sourceMappingURL=redis.d.ts.map