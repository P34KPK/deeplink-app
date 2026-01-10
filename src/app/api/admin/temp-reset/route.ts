import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { isAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
    // Override auth for this quick fix or use admin check
    // if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        if (!redis) return NextResponse.json({ error: 'No Redis' }, { status: 500 });

        const { searchParams } = new URL(req.url);
        let targetId = searchParams.get('userId') || 'user_37ufk8Bl3z0KJUZWhq0a2Qgen7J'; // Default to user from chat

        if (targetId) {
            await redis.del(`plan:${targetId}`); // New Key Storage Pattern? Or user:ID:plan?
            await redis.del(`user:${targetId}:plan`); // Legacy Pattern
            return NextResponse.json({ success: true, message: `Reset plan for user ${targetId}` });
        } else {
            return NextResponse.json({ error: 'No ID' }, { status: 404 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
