import { NextResponse } from 'next/server';
import { trackClick } from '@/lib/analytics';

export async function POST(request: Request) {
    try {
        const { asin, userAgent, slug, geo, referrer } = await request.json();

        if (!asin) {
            return NextResponse.json({ error: 'Missing ASIN' }, { status: 400 });
        }

        await trackClick(asin, userAgent || '', slug, geo, referrer);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
