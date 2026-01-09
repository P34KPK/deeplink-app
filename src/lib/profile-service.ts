import { redis } from '@/lib/redis';

export interface UserProfile {
    userId: string;
    username: string; // "Influencer Picks"
    handle?: string;  // "influencerpicks"
    bio: string;      // "Curated deals..."
    avatarUrl?: string; // Optional custom image
    backgroundImage?: string; // Custom background image URL
    socials: {
        instagram?: string;
        tiktok?: string;
        youtube?: string;
        website?: string;
        facebook?: string; // Added to match dashboard usage
        [key: string]: string | undefined;
    };
    theme?: string; // Hex code or gradient identifier
    appAppearance?: 'light' | 'dark' | 'system';
    amazonTag?: string; // e.g. user-20
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!redis || !userId) return null;
    try {
        const raw = await redis.get(`user:profile:${userId}`);
        const profile = raw ? JSON.parse(raw) : null;
        return profile;
    } catch (e) {
        console.error('Failed to fetch profile', e);
        return null;
    }
}

export async function saveUserProfile(userId: string, data: Partial<UserProfile>) {
    if (!redis || !userId) return undefined;

    // Get existing to merge
    const existing = await getUserProfile(userId) || {
        userId,
        username: 'My Store',
        bio: 'Welcome to my curated shop!',
        socials: {
            instagram: '', // Default empty strings to prevent undefined issues
            tiktok: '',
            youtube: '',
            facebook: ''
        }
    };

    const updated: UserProfile = {
        ...existing,
        ...data,
        socials: {
            ...existing.socials,
            ...(data.socials || {})
        },
        userId // Ensure ID is immutable match
    };

    // GENERATE HANDLE / SLUG
    // If username is present, create a URL-safe slug
    if (updated.username) {
        const slug = updated.username
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
            .substring(0, 30); // Max length

        if (slug.length > 2) {
            // Save lookup: user:handle:sebastien -> user_2...
            await redis.set(`user:handle:${slug}`, userId);
            updated.handle = slug; // Store handle in profile for frontend use
        }
    }

    await redis.set(`user:profile:${userId}`, JSON.stringify(updated));
    return updated;
}

export async function getUserIdByHandle(handle: string): Promise<string | null> {
    if (!redis) return null;
    // 1. Check if it's a direct ID (simple check)
    if (handle.startsWith('user_')) return handle;

    // 2. Lookup handle
    const userId = await redis.get(`user:handle:${handle.toLowerCase()}`);
    return userId || null;
}
