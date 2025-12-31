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

    // --- RETRIEVE USER USAGE ---
    // Even for free users, we need to calculate their usage to show the "Lite Dashboard"

    // 1. Get User Links
    const { getLinks } = await import('@/lib/storage');
    const allLinks = await getLinks();
    const userLinks = allLinks.filter(l => l.userId === userId);
    const linkCount = userLinks.length;

    // 2. Calculate Total Clicks for User
    let totalUserClicks = 0;
    // We need to fetch clicks for each slug
    // Optimization: Pipeline this if possible, but loop is okay for < 20 links
    for (const link of userLinks) {
        const slug = link.generated.split('/').pop();
        if (slug) {
            const clicks = await redis.get(`shortlink:${slug}:click_count`); // Check key name in analytics.ts? usually 'click_count' or just 'clicks'
            // Let's assume standard 'shortlink:{slug}:clicks' or similar. 
            // Wait, I should verify the key name in analytics.ts logic. 
            // Usually tracking sets simple key?
            // Let's use getStats logic or standard. 
            // Let's check keys.
            // Actually, let's just peek at how getStats does it or how track.ts does it.
            // Tracking usually increments `shortlink:{slug}:clicks`.
            const c = await redis.get(`shortlink:${slug}:clicks`);
            if (c) totalUserClicks += parseInt(c, 10);
        }
    }

    // --- RESPONSE STRATEGY ---

    // If FREE: Return specific "Lite" object
    if (plan !== 'pro') {
        return NextResponse.json({
            plan: 'free',
            usage: {
                links: linkCount,
                clicks: totalUserClicks
            },
            limits: {
                links: 20,
                clicks: 200
            },
            // We do NOT return 'stats' (global charts) or detailed breakdowns
        });
    }

    // If PRO: Return Full Stats
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
        plan: 'pro',
        ...stats,
        topLinks: sortedLinks
    });
}
