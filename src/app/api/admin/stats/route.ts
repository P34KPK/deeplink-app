import { NextResponse } from 'next/server';
import { getLinks } from '@/lib/storage';
// import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/admin-auth';
import { getStats } from '@/lib/analytics';

import { redis } from '@/lib/redis';

export async function GET(req: Request) {
    // const { userId } = await auth();
    // Temporarily bypass Clerk check to debug 500 error

    // Secure Admin Check
    if (!isAdmin(req)) { //  && !userId
        return NextResponse.json({ error: 'Unauthorized: Admin Key Required' }, { status: 401 });
    }

    const allLinks = await getLinks();
    const globalStats = await getStats(); // Fetch analytics

    // 1. Basic Stats
    const totalLinks = allLinks.length;
    const uniqueUsers = new Set(allLinks.map(l => l.userEmail).filter(Boolean)).size;
    const recentActivity = allLinks.slice(0, 50);

    // 2. Fetch Inbox Tickets & Trends (Safely)
    let inbox: any[] = [];
    let trends: any[] = [];
    // ...
    // Processing data...

    try {
        if (redis) {
            const rawTickets = await redis.lrange('system:inbox', 0, 19);
            inbox = rawTickets.map(t => typeof t === 'string' ? JSON.parse(t) : t);
        }

        // 3. Calculation Trends (Top 3 ASINs)
        const asinCounts: Record<string, number> = {};
        const asinNames: Record<string, string> = {};

        allLinks.forEach(link => {
            if (link.asin) {
                const slug = (link.generated || '').split('/').pop() || '';
                const hits = globalStats.statsBySlug[slug] || 0;

                asinCounts[link.asin] = (asinCounts[link.asin] || 0) + hits;
                if (link.title) asinNames[link.asin] = link.title;
            }
        });

        trends = Object.entries(asinCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([asin, hits], index) => ({
                id: index,
                name: asinNames[asin] || asin,
                category: 'Product',
                asin: asin,
                hits: `+${hits}`
            }));

    } catch (err) {
        console.error("Redis/Trends Error (Non-Fatal):", err);
    }

    // 4. Calculate User Roster (Server Side Aggregation on ALL links)
    const userMap: Record<string, any> = {};

    // Known VIPs / Subscriptions (Manual Override)
    const VIP_PLANS: Record<string, string> = {
        'p34k.productions@gmail.com': 'Admin / Founder',
        'stacyadds@gmail.com': 'Pro Member',
    };

    allLinks.forEach(link => {
        const email = link.userEmail || 'Guest / Anonymous';
        if (!userMap[email]) {
            userMap[email] = {
                email: email,
                userId: link.userId, // Keep one ID for reference
                count: 0,
                lastDate: 0,
                status: 'Active',
                plan: VIP_PLANS[email] || 'Free Tier'
            };
        }
        userMap[email].count++;
        userMap[email].lastDate = Math.max(userMap[email].lastDate, link.date || 0);
    });

    // Convert to sorted array
    const users = Object.values(userMap).sort((a, b) => b.lastDate - a.lastDate);

    return NextResponse.json({
        totalLinks,
        uniqueUsers,
        recentActivity,
        inbox,
        trends,
        users,
        globalStats
    });
}
