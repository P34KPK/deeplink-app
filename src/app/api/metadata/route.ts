
import { NextResponse } from 'next/server';
import { fetchAmazonMetadata } from '@/lib/metadata-fetcher';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const metadata = await fetchAmazonMetadata(url);

        if (!metadata) {
            return NextResponse.json({ error: 'Could not fetch metadata' }, { status: 404 });
        }

        return NextResponse.json(metadata);

    } catch (error) {
        console.error('Metadata API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }
}
