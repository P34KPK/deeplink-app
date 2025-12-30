import { NextResponse } from 'next/server';
import { createShortLink } from '@/lib/shortener';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { asin, domain, tag, title, slug } = body;

        if (!asin) {
            return NextResponse.json({ error: 'Missing ASIN' }, { status: 400 });
        }

        const newSlug = await createShortLink({
            asin,
            domain: domain || 'com',
            tag,
            title
        }, slug);

        const baseUrl = new URL(req.url).origin; // dynamically get host
        const shortUrl = `${baseUrl}/${newSlug}`;

        return NextResponse.json({ shortUrl, slug: newSlug });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to shorten' }, { status: 500 });
    }
}
