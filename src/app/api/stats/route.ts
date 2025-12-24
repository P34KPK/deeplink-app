import { NextResponse } from 'next/server';
import { getStats } from '@/lib/analytics';

export async function GET() {
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
        ...stats,
        topLinks: sortedLinks
    });
}
