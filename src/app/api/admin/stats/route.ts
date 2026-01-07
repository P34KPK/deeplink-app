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

    // Known VIPs / Subscriptions (Manual Override)
    // Known VIPs / Subscriptions (Manual Override)
    const VIP_PLANS: Record<string, string> = {
        'p34k.productions@gmail.com': 'Admin / Founder',
        'stacyadds@gmail.com': 'Pro Member',
    };

    /*
    // Fetch real users from Clerk
    try {
        const client = await clerkClient();
        const { data: formUsers } = await client.users.getUserList({ limit: 100 });

        formUsers.forEach(u => {
            const email = u.emailAddresses[0]?.emailAddress;
            if (email) {
                userMap[email] = {
                    email: email,
                    userId: u.id,
                    count: 0,
                    lastDate: u.lastSignInAt || u.createdAt,
                    status: 'Active',
                    plan: VIP_PLANS[email] || 'Free Tier',
                    image: u.imageUrl
                };
            }
        });
    } catch (e: any) {
        console.error("Failed to fetch Clerk users", e);
        (global as any).clerkError = e.message || 'Unknown Clerk Error';

        // Fallback: Populate with specific users if failing (Local Dev Mode without Keys)
        if (!userMap['p34k.productions@gmail.com']) {
            userMap['p34k.productions@gmail.com'] = { email: 'p34k.productions@gmail.com', userId: 'user_p34k_fallback', count: 0, lastDate: 1735689600000, status: 'Active (Fallback)', plan: 'Admin / Founder' };
        }
    }
    */

    // Augment with link stats
    allLinks.forEach(link => {
        const email = link.userEmail || 'Guest / Anonymous';
        if (!userMap[email]) {
            // If user not in Clerk (e.g. guest or deleted), created ad-hoc entry
            userMap[email] = {
                email: email,
                userId: link.userId, // Keep one ID for reference
                count: 0,
                lastDate: 0,
                status: 'Guest',
                plan: VIP_PLANS[email] || 'Free Tier'
            };
        }

        userMap[email].count++;
        // Update last activity if link creation is newer than login
        if (link.date && link.date > userMap[email].lastDate) {
            userMap[email].lastDate = link.date;
        }
    });

    // FORCE VIPs (Safety Net)
    // If they were missed by Clerk OR Link scanning, force them in now.
    const FORCE_USERS = [
        { email: 'p34k.productions@gmail.com', id: 'user_p34k_admin', plan: 'Admin / Founder' },
        { email: 'stacyadds@gmail.com', id: 'user_stacy_pro', plan: 'Pro Member' }
    ];

    FORCE_USERS.forEach(force => {
        if (!userMap[force.email]) {
            userMap[force.email] = {
                email: force.email,
                userId: force.id,
                count: 0,
                lastDate: Date.now(),
                status: 'Active (Forced)',
                plan: force.plan
            };
        }
    });

    // Convert to sorted array
    let users = Object.values(userMap).sort((a, b) => b.lastDate - a.lastDate);

    // EMERGENCY DEBUG: HARDCODE IF EMPTY
    // No debug users
    if (users.length === 0) {
        // Keeping it empty is correct behavior for fresh install
    }

    return NextResponse.json({
        totalLinks,
        uniqueUsers,
        recentActivity,
        inbox,
        trends,
        users,
        globalStats,
        debug: {
            clerkUsersFetched: Object.keys(userMap).length, // simple proxy
            clerkError: (global as any).clerkError
        }
    });
}
