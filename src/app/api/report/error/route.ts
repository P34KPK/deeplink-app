
import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, stack, url, userAgent } = body;

        // Store in a List for the "Live Feed"
        const logEntry = {
            type: 'ERROR',
            message: message || 'Unknown Error',
            details: stack,
            url,
            agent: userAgent,
            timestamp: Date.now()
        };

        // Push to a global list (capped at 1000)
        await redis.lpush('system:logs', JSON.stringify(logEntry));
        await redis.ltrim('system:logs', 0, 999);

        // Also increment a stats counter
        await redis.incr('stats:errors:count');

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Logger Failed", e);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
