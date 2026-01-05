
import { load } from 'cheerio';

// Standard User Agents to rotate slightly (or just use one good one)
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function fetchAmazonMetadata(url: string, asin?: string): Promise<{ image?: string; title?: string } | null> {
    try {
        console.log(`[MetadataFetcher] Attempting to scrape: ${url}`);

        // 1. Try generic scraping
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout to not delay redirects

        const res = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            signal: controller.signal,
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            console.warn(`[MetadataFetcher] Failed to fetch. Status: ${res.status}`);
            // Fallback: If scraping fails, maybe try construction if we have ASIN?
            // But we know construction is flaky.
            return null;
        }

        const html = await res.text();
        const $ = load(html);

        // 2. Parse Open Graph Tags
        const ogImage = $('meta[property="og:image"]').attr('content');
        const ogTitle = $('meta[property="og:title"]').attr('content');

        // 3. Parse Amazon Specifics (sometimes they use different IDs)
        const landingImage = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
        const productTitle = $('#productTitle').text().trim();

        const image = ogImage || landingImage;
        const title = ogTitle || productTitle;

        if (image) {
            console.log(`[MetadataFetcher] Success! Found image: ${image}`);
            return { image, title };
        }

    } catch (error) {
        console.warn(`[MetadataFetcher] Error scraping:`, error);
    }

    return null;
}
