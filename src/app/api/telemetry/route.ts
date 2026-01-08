import { NextResponse } from 'next/server';
import { trackClick } from '@/lib/analytics';

export async function POST(request: Request) {
    try {
        const { asin, userAgent, slug, geo, referrer } = await request.json();

        if (!asin) {
            return NextResponse.json({ error: 'Missing ASIN' }, { status: 400 });
        }

        console.log(`[Track Debug] Tracking click for ASIN: ${asin}, Slug: ${slug}, Geo: ${geo}`);
        await trackClick(asin, userAgent || '', slug, geo, referrer);
        console.log(`[Track Debug] Track success`);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
