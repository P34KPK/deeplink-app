
import { redis } from '@/lib/redis';

// Force ignore SSL errors
if (typeof process !== 'undefined') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Proxify helper: Wraps external URLs to be fetched via our local API
const proxify = (u: string) => `/api/proxy-image?url=${encodeURIComponent(u)}`;

function extractAsin(url: string): string | null {
    const regex = /(?:\/dp\/|\/gp\/product\/|\/exec\/obidos\/asin\/|\/aw\/d\/|(?:\/|=))([A-Z0-9]{10})(?:$|\/|\?|&|%)/i;
    const match = url.match(regex);
    return match ? match[1].toUpperCase() : null;
}

// Helper to resolve short links
async function resolveShortUrl(shortUrl: string): Promise<string> {
    try {
        const res = await fetch(shortUrl, {
            method: 'GET', // GET is more reliable for redirects than HEAD
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
            }
        });
        return res.url;
    } catch (e) {
        console.error("Short URL Resolve Error", e);
        return shortUrl;
    }
}

export async function fetchAmazonMetadata(url: string, providedAsin?: string, force: boolean = false): Promise<{ image?: string; title?: string } | null> {
    const cacheKey = `metadata:v2:${url}`;

    // 1. Check Redis Cache
    if (redis && !force) {
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`[Metadata] Cache Hit for ${url}`);
                return JSON.parse(cached);
            }
        } catch (e) { console.warn("[Metadata] Redis Read Error", e); }
    }

    console.log(`[Metadata] Fetching: ${url}`);

    // If using a short link, let Microlink handle it naturally first, as it often has better IP reputation.
    // However, if Microlink fails, we might need ASIN.

    // 2. Try to extract ASIN locally (for long links)
    let asin = providedAsin || extractAsin(url);

    let finalTitle: string | undefined = undefined;
    let finalImage = null;

    // 3. Main Strategy: Microlink (Handles short URLs, Title, and Image)
    try {
        const microUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&meta=true&screenshot=true`;
        const res = await fetch(microUrl);

        if (res.ok) {
            const json = await res.json();
            const data = json.data;

            if (data) {
                // Get Title
                if (data.title && !data.title.includes('Amazon.com')) {
                    finalTitle = data.title;
                }

                // Get ASIN from resolved URL if needed
                if (!asin && data.url) {
                    asin = extractAsin(data.url);
                    console.log(`[Metadata] Extracted ASIN from Microlink URL: ${asin}`);
                }

                // Get Image (with Filter)
                const potentialImage = data.image?.url || data.screenshot?.url;
                const badKeywords = ['amazon_logo', 'prime_logo', 'nav-logo', 'captcha', 'signin', 'smile_logo'];

                if (potentialImage && !badKeywords.some(k => potentialImage.toLowerCase().includes(k))) {
                    finalImage = proxify(potentialImage);
                } else {
                    console.log(`[Metadata] Rejected generic image from Microlink: ${potentialImage}`);
                }
            }
        }
    } catch (e) {
        console.error("[Metadata] Microlink Error", e);
    }

    // 4. Fallback Strategy A: Bing (If Image Missing)
    // If Microlink failed to give an image (or we filtered it out), try Bing.
    // Only works if we have an ASIN (either from input or extracted from Microlink resolution)
    if (!finalImage && (asin || finalTitle)) {
        // Prefer extracting image using the Title if we found one (Much more accurate than ASIN)
        const query = finalTitle ? finalTitle : `${asin} product -logo`;
        const bingImage = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(query)}&w=800&h=800&c=7&rs=1&p=0`;
        try {
            const check = await fetch(bingImage, { method: 'HEAD' });
            if (check.ok) {
                finalImage = proxify(bingImage);
            }
        } catch (e) { }
    }

    // 5. Fallback Strategy B: Legacy Image (Last Resort)
    if (!finalImage && asin) {
        const legacyUrl = `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`;
        try {
            // Check content length to avoid 1x1 pixel
            const check = await fetch(legacyUrl, { method: 'HEAD' });
            if (check.ok) {
                const len = parseInt(check.headers.get('content-length') || '0');
                if (len > 1000) finalImage = proxify(legacyUrl);
            }
        } catch (e) { }
    }

    // 6. Finalize
    if (finalImage || finalTitle) {
        const result = { image: finalImage || undefined, title: finalTitle };
        // Cache valid results
        if (redis) await redis.set(cacheKey, JSON.stringify(result), 'EX', 60 * 60 * 24 * 7);
        return result;
    }

    // 7. Fail-Safe
    console.warn("[Metadata] All strategies failed.");
    return {
        image: proxify('https://placehold.co/600x400/18181b/ffffff?text=Auto+Fetch+Failed%0APlease+Upload+Manually'),
        title: undefined
    };
}
