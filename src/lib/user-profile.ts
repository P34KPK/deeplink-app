import { redis } from '@/lib/redis';

export type UserProfile = {
    userId: string;
    username: string; // "Influencer Picks"
    bio: string;      // "Curated deals..."
    avatarUrl?: string; // Optional custom image
    backgroundImage?: string; // Custom background image URL
    socials: {
        instagram?: string;
        tiktok?: string;
        youtube?: string;
        website?: string;
        facebook?: string; // Added to match dashboard usage
    };
    theme?: 'dark' | 'light' | 'gradient'; // Basic theme preference
};

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
    if (!redis || !userId) return;

    // Get existing to merge
    const existing = await getUserProfile(userId) || {
        userId,
        username: 'My Store',
        bio: 'Welcome to my curated shop!',
        socials: {}
    };

    const updated = {
        ...existing,
        ...data,
        socials: {
            ...existing.socials,
            ...(data.socials || {})
        },
        userId // Ensure ID is immutable match
    };

    await redis.set(`user:profile:${userId}`, JSON.stringify(updated));
    return updated;
}
