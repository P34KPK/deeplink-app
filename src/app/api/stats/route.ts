import { NextResponse } from 'next/server';
import { getStats } from '@/lib/analytics';

export async function GET() {
    const stats = await getStats();

    // Convert topLinks object to sorted array
    const sortedLinks = Object.entries(stats.topLinks)
        .map(([asin, count]) => ({ asin, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10

    return NextResponse.json({
        ...stats,
        topLinks: sortedLinks
    });
}
