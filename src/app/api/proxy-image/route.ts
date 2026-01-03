
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new NextResponse('Missing URL', { status: 400 });
    }

    try {
        // Fetch the image from Amazon acting like a browser
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            return new NextResponse('Image Fetch Failed', { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400' // Cache heavily
            }
        });
    } catch (error) {
        console.error("Proxy Error", error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
