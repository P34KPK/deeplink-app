import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        try {
            const response = await fetch(url, {
                method: 'HEAD',
                redirect: 'follow', // fetch will follow redirects automatically by default in Node environment usually, but explicit 'follow' helps.
            });

            // If we are lucky, the response.url is the final destination
            return NextResponse.json({ fullUrl: response.url });
        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            return NextResponse.json({ error: 'Failed to expand URL' }, { status: 500 });
        }

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
