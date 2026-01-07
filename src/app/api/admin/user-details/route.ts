import { NextResponse } from 'next/server';
import { getLinks } from '@/lib/storage';
import { getStats, getAffiliateStats } from '@/lib/analytics';
import { redis } from '@/lib/redis';
import { getUserProfile } from '@/lib/profile-service';
import { isAdmin } from '@/lib/admin-auth';

// Force dynamic to ensure fresh data
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // 1. Admin Security Check
    if (!isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse User ID
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 3. Fetch Data Sources
    const globalStats = await getStats();
    const allLinks = await getLinks();
    const userProfile = await getUserProfile(userId);

    // 4. Filter for specific User
    const userLinks = allLinks.filter(l => l.userId === userId);

    // Get User Plan
    let plan = 'free';
    try {
        const storedPlan = await redis?.get(`user:${userId}:plan`);
        if (storedPlan) plan = storedPlan;

        // Check for hardcoded admins/pros relative to email if available
        const email = userLinks[0]?.userEmail; // Best guess from links if profile doesn't have it (profile usually doesn't store email in redis key, but might in data)
        if (email === 'p34k.productions@gmail.com' || email === 'stacyadd@gmail.com') {
            plan = 'pro';
        }
    } catch (e) {
        console.error("Plan check failed", e);
    }

    // 5. Calculate User Specific Stats
    const userSlugs = new Set<string>();
    const userAsins = new Set<string>();

    userLinks.forEach(l => {
        const slug = l.generated?.split('/').pop();
        if (slug) userSlugs.add(slug);
        if (l.asin) userAsins.add(l.asin);
    });

    let myTotalClicks = 0;
    userSlugs.forEach(slug => {
        if (globalStats.statsBySlug[slug]) {
            myTotalClicks += globalStats.statsBySlug[slug];
        }
    });

    // Top Links for User
    const myTopLinks = Object.entries(globalStats.topLinks || {})
        .filter(([asin]) => userAsins.has(asin))
        .map(([asin, data]) => ({ asin, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 50);

    // Platform Trends (Global Context for them)
    // We can show them what's trending globally as 'trends'
    const platformTrends = Object.entries(globalStats.topLinks || {})
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 3)
        .map(([asin, data], idx) => {
            const link = allLinks.find(l => l.asin === asin);
            return {
                id: idx + 1,
                name: link ? link.title : `Hot Product`,
                category: link ? 'Trending' : 'Viral',
                asin,
                hits: `+${data.total}`
            };
        });

    // Construct Response suited for ProDashboard consumption
    // We mock some privacy-sensitive fields as empty since we don't track per-user granularity for these yet
    const stats = {
        plan,
        usage: {
            links: userLinks.length,
            clicks: myTotalClicks
        },
        limits: { links: 20, clicks: 200 },
        totalClicks: myTotalClicks,
        globalLastClick: Date.now(),
        dailyClicks: {}, // No per-user history available in v2 redis schema yet
        devices: { android: 0, ios: 0, desktop: 0, other: 0 },
        locations: {},
        browsers: {},
        referrers: {},
        topLinks: myTopLinks,
        trends: platformTrends,
        broadcast: null, // User specific broadcast?
        affiliate: await getAffiliateStats(userId)
    };

    return NextResponse.json({
        user: {
            userId,
            email: userLinks[0]?.userEmail || 'Unknown Email', // augment
            ...userProfile
        },
        stats,
        history: userLinks // User's links serve as history/recent activity
    });
}
