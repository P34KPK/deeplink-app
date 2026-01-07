
import { redis } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
    limit: number;
    windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    limit: 20, // 20 requests
    windowMs: 60 * 1000 // per 1 minute
};

export async function rateLimit(req: NextRequest | Request, config: RateLimitConfig = DEFAULT_CONFIG) {
    if (!redis) {
        // Fallback: If no Redis, we can't effectively rate limit across serverless functions.
        // We log a warning but allow traffic to prevent blocking legimite users due to missing infra.
        // console.warn('Rate Limit skipped: Redis not configured');
        return { success: true };
    }

    const ip = (req.headers.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0];
    const key = `rate_limit:${ip}`;

    try {
        const current = await redis.incr(key);

        if (current === 1) {
            await redis.expire(key, config.windowMs / 1000);
        }

        if (current > config.limit) {
            return { success: false, limit: config.limit, remaining: 0 };
        }

        return { success: true, limit: config.limit, remaining: config.limit - current };
    } catch (error) {
        console.error('Rate Limit Error:', error);
        return { success: true }; // Fail open
    }
}
