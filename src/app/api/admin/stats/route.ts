
import { NextResponse } from 'next/server';
import { getLinks } from '@/lib/storage';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
    const { userId } = await auth();
    const user = await currentUser();

    // Check if Admin (Simple check: You can hardcode your email here for security)
    // Replace 'YOUR_EMAIL' with your actual email if you want to lock it down
    // const ADMIN_EMAILS = ['your-email@example.com'];
    // if (!user || !user.primaryEmailAddress || !ADMIN_EMAILS.includes(user.primaryEmailAddress.emailAddress)) { ... }

    // For now, assumed authorized if they can access this route (Middleware protection recommended)
    // For now, assumed authorized if they can access this route (Middleware protection recommended)
    // if (!userId) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

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
