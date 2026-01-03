import { NextResponse } from 'next/server';
import { getLinks } from '@/lib/storage';
// import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/admin-auth';

import { Redis } from '@upstash/redis';

// Safe initialization to prevent crash if env vars are missing
const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

const redis = (redisUrl && redisToken)
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

export async function GET(req: Request) {
    // const { userId } = await auth();
    // Temporarily bypass Clerk check to debug 500 error

    // Secure Admin Check
    if (!isAdmin(req)) { //  && !userId
        return NextResponse.json({ error: 'Unauthorized: Admin Key Required' }, { status: 401 });
    }

    const allLinks = await getLinks();

    // 1. Basic Stats
    const totalLinks = allLinks.length;
    const uniqueUsers = new Set(allLinks.map(l => l.userEmail).filter(Boolean)).size;
    const recentActivity = allLinks.slice(0, 50);

    // 2. Fetch Inbox Tickets & Trends (Safely)
    let inbox: any[] = [];
    let trends: any[] = [];

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
                asinCounts[link.asin] = (asinCounts[link.asin] || 0) + (link.hits || 1);
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
        // Fallback to empty arrays so dashboard doesn't crash on DB issues
    }

    return NextResponse.json({
        totalLinks,
        uniqueUsers,
        recentActivity,
        inbox,
        trends
    });
}
