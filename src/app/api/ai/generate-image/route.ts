import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const prompt = searchParams.get('prompt');
    const seed = searchParams.get('seed') || Math.floor(Math.random() * 1000000).toString();

    if (!prompt) {
        return new NextResponse('Prompt required', { status: 400 });
    }

    const externalUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&n=${seed}&model=turbo`;

    try {
        const response = await fetch(externalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://pollinations.ai/',
            }
        });

        if (!response.ok) {
            throw new Error(`Upstream error: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type') || 'image/jpeg';

        return new NextResponse(response.body, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Proxy Error:', error);
        return new NextResponse('Failed to fetch image', { status: 500 });
    }
}
