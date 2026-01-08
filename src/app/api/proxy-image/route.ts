
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

    // 3. Smart Scraping for Amazon Product Pages
    const isAmazonProduct = url.includes('amazon.com') || url.includes('amzn.to');

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        });

        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

        const contentType = response.headers.get('content-type') || '';

        // If it's an image, stream it (Normal Proxy Mode)
        if (contentType.startsWith('image/')) {
            return new NextResponse(response.body, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=604800, mutable' // 7 days cache
                }
            });
        }

        // If it's HTML (Amazon Page), extract the image (Scraper Mode)
        if (contentType.includes('text/html') && isAmazonProduct) {
            const html = await response.text();

            // Strategy 1: Dynamic Image Data (The Gold Standard - High Res Product Images)
            // Amazon often uses single quotes for this attribute: data-a-dynamic-image='{"url":[w,h],...}'
            // We regex to capture the JSON content inside either ' or " quotes.
            const dynamicMatch = html.match(/data-a-dynamic-image\s*=\s*(["'])({[^}]+})\1/);
            let imageUrl = null;

            if (dynamicMatch) {
                try {
                    // dynamicMatch[2] is the JSON string (e.g. {"http...":[1,2]})
                    // We must ensure it uses double quotes for JSON.parse
                    let jsonStr = dynamicMatch[2];

                    // If the original string used HTML entities (&quot;), decode them
                    if (jsonStr.includes('&quot;')) {
                        jsonStr = jsonStr.replace(/&quot;/g, '"');
                    }
                    // If it was raw single quotes from HTML, the JSON inside might still be valid or need tweaking? 
                    // Usually JSON keys are double quoted in Amazon's source, so just parsing might work if we have the block.

                    const images = JSON.parse(jsonStr);
                    if (images) {
                        imageUrl = Object.keys(images)[0];
                    }
                } catch (e) {
                    // console.error('JSON Parse Error', e);
                }
            }

            // Strategy 2: "Landing Image" (Main Product Image)
            // Look for the reliable id="landingImage"
            if (!imageUrl) {
                const landingMatch = html.match(/id="landingImage"[^>]+src="([^"]+)"/);
                if (landingMatch) imageUrl = landingMatch[1];
            }

            // Strategy 3: Open Graph Image (Fallback)
            if (!imageUrl) {
                const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
                if (ogMatch) imageUrl = ogMatch[1];
            }

            if (imageUrl) {
                // Recursively fetch the FOUND image to stream it (avoids CORS on client)
                const imageResponse = await fetch(imageUrl);
                return new NextResponse(imageResponse.body, {
                    headers: {
                        'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
                        'Cache-Control': 'public, max-age=604800, mutable'
                    }
                });
            }
        }

        // --- FALLBACK: REDIRECT TO WIDGET URL ---
        // If we failed to scrape (Captcha, etc.) or it wasn't an HTML page,
        // Redirect the client to the Amazon AdSystem Widget URL.
        // This lets the User's Browser try to fetch it directly (bypassing Server IP blocks).
        if (isAmazonProduct) {
            // Extract ASIN from URL if possible
            const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
            if (asinMatch) {
                const asin = asinMatch[1];
                const widgetUrl = `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&Format=_SL500_&ASIN=${asin}&MarketPlace=US&ID=AsinImage&WS=1&ServiceVersion=20070822`;
                return NextResponse.redirect(widgetUrl, 307); // Temporary Redirect
            }
        }

        return new NextResponse('Image not found', { status: 404 });

    } catch (e) {
        console.error('Proxy/Scrape Error:', e);
        // On error, also try the redirect fallback if possible
        if (url.includes('amazon') || url.includes('amzn')) {
            const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
            if (asinMatch) {
                return NextResponse.redirect(`https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&Format=_SL500_&ASIN=${asinMatch[1]}&MarketPlace=US&ID=AsinImage&WS=1&ServiceVersion=20070822`, 307);
            }
        }
        return new NextResponse('Error fetching resource', { status: 500 });
    }
}
