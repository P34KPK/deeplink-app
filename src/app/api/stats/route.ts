import { NextResponse } from 'next/server';
import { getStats, getAffiliateStats } from '@/lib/analytics';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redis } from '@/lib/redis';
// Use dynamic import for storage to avoid circular dependency issues if any, or standard import
import { getLinks } from '@/lib/storage';
import { getUserProfile } from '@/lib/profile-service';

export const dynamic = 'force-dynamic';

export async function GET() {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Determine Plan
    let plan = 'free';
    const planKey = `user:${userId}:plan`;

    // Check Admin Override
    const email = user.primaryEmailAddress?.emailAddress;
    const isSuperUser = email === 'p34k.productions@gmail.com' || email?.includes('stacyadd') || email === 'babygansta77@gmail.com';

    try {
        const storedPlan = await redis?.get(planKey);
        if (storedPlan) plan = storedPlan;
        if (isSuperUser) plan = 'pro';
    } catch (e) {
        console.error("Plan check error", e);
    }

    // 2. Fetch Data
    const globalStats = await getStats();
    const allLinks = await getLinks();

    // 3. Filter for User
    const userLinks = allLinks.filter(l => l.userId === userId);

    // Identify user's resources
    const userSlugs = new Set<string>();
    const userAsins = new Set<string>();

    userLinks.forEach(l => {
        const slug = l.generated?.split('/').pop();
        if (slug) userSlugs.add(slug);
        if (l.asin) userAsins.add(l.asin);
    });

    // 4. Calculate User Specific Stats (Total Clicks)
    let myTotalClicks = 0;
    userSlugs.forEach(slug => {
        if (globalStats.statsBySlug[slug]) {
            myTotalClicks += globalStats.statsBySlug[slug];
        }
    });

    // if (isSuperUser) {
    //     myTotalClicks = Math.max(myTotalClicks, 15420); // Force Titan Level (Disabled for Beta Accuracy)
    // }

    // 5. Build Top Links for User (My Products)
    // Shows aggregate ASIN performance for products the user is linking to
    const myTopLinks = Object.entries(globalStats.topLinks || {})
        .filter(([asin]) => userAsins.has(asin))
        .map(([asin, data]) => ({ asin, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 50);

    // 6. Global Trends (Agent B: Real Data)
    // Top 3 ASINs platform-wide
    const platformTrends = Object.entries(globalStats.topLinks || {})
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 3)
        .map(([asin, data], idx) => {
            // Try to find a title for this ASIN from any link in the DB
            const link = allLinks.find(l => l.asin === asin);
            return {
                id: idx + 1,
                name: link ? link.title : `Hot Product`,
                category: link ? 'Trending' : 'Viral',
                asin,
                hits: `+${data.total}`
            };
        });

    // 7. Fetch Broadcast
    let broadcast = null;
    try {
        if (redis) {
            const raw = await redis.get('system:broadcast');
            if (raw) broadcast = JSON.parse(raw);
        }
    } catch (e) {
        console.error("Broadcast fetch error", e);
    }

    // 8. Construct Response
    // Note: dailyClicks and devices are reset to empty for now to enforce isolation 
    // (Global logs cannot be safely attributed to user retroactively in v3)
    return NextResponse.json({
        plan,
        usage: {
            links: userLinks.length,
            clicks: myTotalClicks
        },
        limits: { links: 20, clicks: 200 },

        // Pro Stats
        totalClicks: myTotalClicks,
        globalLastClick: Date.now(), // Realtime

        // Privacy: Return empty sets to avoid leaking global traffic data
        dailyClicks: {},
        devices: { android: 0, ios: 0, desktop: 0, other: 0 },
        locations: {},
        browsers: {},
        referrers: {},

        // User's specific top links
        topLinks: myTopLinks,

        // Agent B: Real Trends
        trends: platformTrends,
        broadcast,
        affiliate: await getAffiliateStats(userId)
    });
}
