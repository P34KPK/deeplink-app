
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

// Fix SSL issues
if (typeof process !== 'undefined') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');
    if (!url) return new NextResponse('Missing URL', { status: 400 });

    // 1. Security: Prevent Hotlinking 
    const referer = req.headers.get('referer');
    const host = req.headers.get('host') || '';
    if (referer && !referer.includes(host) && !referer.includes('localhost')) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // 2. Circuit Breaker (The Fuse) - Protects Vercel Bandwidth Bill
    if (redis) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const usageKey = `system:proxy_usage:${today}`;
            const count = await redis.incr(usageKey);
            if (count === 1) await redis.expire(usageKey, 86400 * 2); // Keep 48h

            // ALERT THRESHOLD (Log to Vercel Logs -> Email if configured)
            if (count === 4000) {
                console.warn(`[ALERT] Proxy Usage nearing limit: ${count}/5000`);
            }

            // HARD LIMIT (The Fuse)
            if (count > 5000) {
                console.error(`[CRITICAL] Proxy Daily Limit Exceeded: ${count}`);
                return new NextResponse('Daily Image Quota Exceeded. Upgrade Plan or Check Usage.', { status: 429 });
            }
        } catch (e) {
            // Fail open (allow request) if Redis fails, but log it
            console.error("Rate Limit Error", e);
        }
    }

    try {
        // Fetch the external image (Amazon, Bing, etc.)
        // masking the requester as a standard browser
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // No referrer = bypasses hotlink checks
            }
        });

        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

        // Stream the image back to the client
        // This bypasses CORS, Referrer policies, and Mixed Content warnings on the frontend
        return new NextResponse(response.body, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                'Cache-Control': 'public, max-age=86400, mutable'
            }
        });
    } catch (e) {
        console.error('Proxy Error:', e);
        return new NextResponse('Error fetching image', { status: 500 });
    }
}
