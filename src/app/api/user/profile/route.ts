import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { isAdmin } from '@/lib/admin-auth';

// Safe initialization
const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;
const redis = (redisUrl && redisToken)
    ? new Redis({ url: redisUrl, token: redisToken })
    : { hset: async () => { }, hgetall: async () => null };

export async function POST(req: Request) {
    try {
        // Secure it (or allow logged in user)
        // For now, we use the admin key check or assuming simple access for the demo
        // const { userId } = await auth(); 
        // Using a hardcoded userId for the P34K demo if not passed

        const body = await req.json();
        const { username, bio, avatar, userId = 'p34k' } = body;

        // Save to Redis
        await redis.hset(`user:${userId}:profile`, {
            username,
            bio,
            avatar,
            updatedAt: Date.now()
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Profile Save Error:', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
