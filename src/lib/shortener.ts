import { redis } from '@/lib/redis';

export type ShortLinkData = {
    asin: string;
    domain: string;
    tag?: string;
    createdAt: number;
    title?: string;
    slug?: string;
    userId?: string; // Track who created it
    image?: string; // Custom or Scraped Image URL
};



// 6-character random slug
export function generateSlug(length = 6): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let slug = '';
    for (let i = 0; i < length; i++) {
        slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
}

export async function createShortLink(data: Omit<ShortLinkData, 'createdAt'>, customSlug?: string): Promise<string> {
    if (!redis) throw new Error("Redis not configured");
    let slug = customSlug;

    // If no custom slug, generate one and ensure uniqueness
    if (!slug) {
        let attempts = 0;
        while (attempts < 5) {
            const potentialSlug = generateSlug();
            const exists = await redis.exists(`shortlink:${potentialSlug}`);
            if (!exists) {
                slug = potentialSlug;
                break;
            }
            attempts++;
        }
        if (!slug) throw new Error('Failed to generate unique slug');
    } else {
        // Validation for custom slug
        if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
            throw new Error('Invalid characters in slug');
        }

        const exists = await redis.exists(`shortlink:${slug}`);
        if (exists) {
            throw new Error('Slug already taken');
        }
    }

    const record: ShortLinkData = {
        ...data,
        createdAt: Date.now()
    };

    await redis.set(`shortlink:${slug}`, JSON.stringify(record));
    return slug;
}

export async function getShortLink(slug: string): Promise<ShortLinkData | null> {
    if (!redis) return null;
    const data = await redis.get(`shortlink:${slug}`);
    return data ? JSON.parse(data) : null;
}
