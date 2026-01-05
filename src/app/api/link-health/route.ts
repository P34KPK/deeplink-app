import { NextResponse } from 'next/server';
import { fetchAmazonMetadata } from '@/lib/metadata-fetcher';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

        // 1. Precise Check (Scraping)
        const metadata = await fetchAmazonMetadata(url);

        if (metadata) {
            return NextResponse.json({ status: 'alive', code: 200 });
        }

        // 2. Fallback Check (Status Code)
        // If scraping failed (null), it might be a 404 OR a captcha/block.
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (res.status === 404) {
                return NextResponse.json({ status: 'dead', code: 404 });
            }

            // A 503 or 200 (with captcha) means the link EXISTS, so it's technically "alive" (not broken).
            return NextResponse.json({ status: 'alive', code: res.status });

        } catch (e) {
            return NextResponse.json({ status: 'dead', code: 0 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
