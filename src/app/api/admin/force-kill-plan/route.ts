import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic'; // Disable caching explicitly

export async function GET(req: Request) {
    try {
        if (!redis) return NextResponse.json({ error: 'No Redis' });

        const userId = 'user_37ufk8Bl3z0KJUZWhq0a2Qgen7J';

        console.log(`KILLING PLAN FOR: ${userId}`);

        // Try deleting all known key patterns
        await redis.del(`plan:${userId}`);
        await redis.del(`user:${userId}:plan`);

        // Also verify
        const check1 = await redis.exists(`plan:${userId}`);
        const check2 = await redis.exists(`user:${userId}:plan`);

        return NextResponse.json({
            success: true,
            message: `Plan Reset Executed for ${userId}`,
            remaining_keys: {
                [`plan:${userId}`]: check1,
                [`user:${userId}:plan`]: check2
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
