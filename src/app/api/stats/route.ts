import { NextResponse } from 'next/server';
import { getStats } from '@/lib/analytics';
import { auth, currentUser } from '@clerk/nextjs/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export async function GET() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- CHECK PLAN ---
    let plan = 'free';
    const planKey = `user:${userId}:plan`;

    try {
        const storedPlan = await redis.get(planKey);
        if (storedPlan) plan = storedPlan;

        // ADMIN OVERRIDE
        if (user.primaryEmailAddress?.emailAddress === 'p34k.productions@gmail.com') {
            plan = 'pro';
        }
    } catch (e) {
        console.error("Redis plan check failed", e);
    }

    if (plan !== 'pro') {
        return NextResponse.json({ error: 'Upgrade Required. Insights are for PRO members only.' }, { status: 403 });
    }

    // --- FETCH DATA ---
    const stats = await getStats();

    // Convert topLinks object to sorted array
    // stats.topLinks is Record<string, { total: number, android: number, ... }>
    const sortedLinks = Object.entries(stats.topLinks || {})
        .map(([asin, data]) => ({
            asin,
            ...data // Spread the detailed stats (total, android, ios, desktop)
        }))
        .sort((a, b) => b.total - a.total) // Sort by total clicks
        .slice(0, 50); // Return top 50

    return NextResponse.json({
        ...stats,
        topLinks: sortedLinks
    });
}
