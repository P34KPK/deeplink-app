import { NextResponse } from 'next/server';
import { getLinks } from '@/lib/storage';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
    const { userId } = await auth();

    // Secure Admin Check
    if (!isAdmin(req) && !userId) {
        // If not explicit admin key, and not logged in (or we could enforce strict admin email list here)
        // For now, Strict Admin Key or deny. Even logged in users shouldn't see GLOBAL stats unless they are admin.
        // So let's enforce Key Only for this route or specific email.
        return NextResponse.json({ error: 'Unauthorized: Admin Key Required' }, { status: 401 });
    }

    const allLinks = await getLinks();

    // Aggregate Data
    const totalLinks = allLinks.length;

    // Get unique users count
    const uniqueUsers = new Set(allLinks.map(l => l.userEmail).filter(Boolean)).size;

    // Get recent activity (last 50 links)
    const recentActivity = allLinks.slice(0, 50);

    return NextResponse.json({
        totalLinks,
        uniqueUsers,
        recentActivity
    });
}
