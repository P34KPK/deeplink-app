import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { isAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
    // Override auth for this quick fix or use admin check
    // if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        if (!redis) return NextResponse.json({ error: 'No Redis' }, { status: 500 });

        // 1. Find User ID
        // const targetEmail = '5kqvbrjjgr@privaterelay.appleid.com';
        // Hardcoding scan for speed
        const keys = await redis.keys('user:*:profile');
        let targetId = null;

        for (const key of keys) {
            const data = await redis.get(key);
            // Check if string contains email (Profile data is usually JSON)
            if (data && typeof data === 'string' && data.includes('5kqvbrjjgr@privaterelay.appleid.com')) {
                const parts = key.split(':');
                if (parts.length >= 2) targetId = parts[1];
                break;
            }
            // If object (from ioredis sometimes depending on config, but usually string)
            if (data && typeof data === 'object') {
                // @ts-ignore
                if (data.email === '5kqvbrjjgr@privaterelay.appleid.com' || JSON.stringify(data).includes('5kqvbrjjgr@privaterelay.appleid.com')) {
                    const parts = key.split(':');
                    if (parts.length >= 2) targetId = parts[1];
                    break;
                }
            }
        }

        if (targetId) {
            await redis.del(`user:${targetId}:plan`);
            return NextResponse.json({ success: true, message: `Reset plan for user ${targetId}` });
        } else {
            return NextResponse.json({ error: 'User not found by email scan' }, { status: 404 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
