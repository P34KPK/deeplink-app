
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

// Create a singleton instance
// If REDIS_URL is not provided, this will be null, allowing for graceful degradation
export const redis = redisUrl ? new Redis(redisUrl) : null;

// Helper to check if redis is connected (optional, for health checks)
export const isRedisConfigured = !!redis;
