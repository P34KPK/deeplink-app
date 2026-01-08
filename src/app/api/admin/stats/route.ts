import { NextResponse } from 'next/server';
import { getLinks } from '@/lib/storage';
import { clerkClient } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/admin-auth';
import { getStats } from '@/lib/analytics';
import { redis } from '@/lib/redis';

export async function GET(req: Request) {
    // Secure Admin Check
    if (!isAdmin(req)) {
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

    try {
        if (redis) {
            const rawTickets = await redis.lrange('system:inbox', 0, 19);
            inbox = rawTickets.map(t => typeof t === 'string' ? JSON.parse(t) : t);
        }

        // --- REAL AMAZON TRENDS (MOVERS & SHAKERS) ---
        // Removed obsolete external scraper. Falling back to internal stats below.

        // Fallback to Internal Stats ONLY if Amazon failed or returned empty
        if (trends.length === 0) {
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
        }

    } catch (err) {
        console.error("Redis/Trends Error (Non-Fatal):", err);
    }

    // 4. Calculate User Roster (Server Side Aggregation on ALL links)
    const userMap: Record<string, any> = {};

    // Helper to get plan from Redis
    const getPlanFromRedis = async (userId: string) => {
        if (!redis) return 'Free Tier';
        const plan = await redis.get(`user:${userId}:plan`);
        if (plan === 'pro') return 'Pro Member';
        // Check legacy VIP list just in case
        return 'Free Tier';
    };

    // Fetch real users from Clerk
    try {
        const client = await clerkClient();
        const { data: formUsers } = await client.users.getUserList({ limit: 100 });

        // Parallel Plan Check
        const userPromises = formUsers.map(async (u) => {
            const email = u.emailAddresses[0]?.emailAddress;
            if (email) {
                let plan = await getPlanFromRedis(u.id);
                // Admin Override
                if (email === 'p34k.productions@gmail.com') plan = 'Admin / Founder';

                userMap[email] = {
                    email: email,
                    userId: u.id,
                    count: 0,
                    lastDate: u.lastSignInAt || u.createdAt,
                    status: 'Active',
                    plan: plan,
                    image: u.imageUrl
                };
            }
        });
        await Promise.all(userPromises);

    } catch (e: any) {
        console.error("Failed to fetch Clerk users", e);
        (global as any).clerkError = e.message || 'Unknown Clerk Error';
    }

    // Augment with link stats (for users not in Clerk list or to count links)
    // Note: If user was in Clerk list, we just update count/date. If not (guest), we create new entry.
    for (const link of allLinks) {
        const email = link.userEmail || 'Guest / Anonymous';
        if (!userMap[email]) {
            userMap[email] = {
                email: email,
                userId: link.userId,
                count: 0,
                lastDate: 0,
                status: 'Guest',
                plan: 'Free Tier'
            };
        }

        userMap[email].count++;
        // Update last activity if link creation is newer than login
        if (link.date && (!userMap[email].lastDate || link.date > userMap[email].lastDate)) {
            userMap[email].lastDate = link.date;
        }
    }

    // Convert to sorted array
    let users = Object.values(userMap).sort((a, b) => b.lastDate - a.lastDate);

    return NextResponse.json({
        totalLinks,
        uniqueUsers,
        recentActivity,
        inbox,
        trends,
        users,
        globalStats,
        debug: {
            clerkUsersFetched: Object.keys(userMap).length,
            clerkError: (global as any).clerkError
        }
    });
}
