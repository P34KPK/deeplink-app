import { redis } from '@/lib/redis';
import fs from 'fs';
import path from 'path';

export type ArchivedLink = {
    id: string;
    userId?: string;
    userEmail?: string;
    original: string;
    generated: string;
    asin: string;
    title: string;
    description: string;
    date: number;
    active?: boolean;
    favorite?: boolean;
    tags?: string[];
    image?: string;
    clicks?: number; // Optional sync from analytics
};

const LEGACY_DB_KEY = 'deeplink_history_v1';

// --- NEW GRANULAR ARCHITECTURE ---

// Key Helpers
const kLink = (id: string) => `link:${id}`;
const kUserLinks = (userId: string) => `user:${userId}:links`;
const kSlugMap = (slug: string) => `slug:${slug}`;

/**
 * Save or Update a single link.
 * Operations:
 * 1. Store Link Data (JSON)
 * 2. Add ID to User's List
 * 3. Update Slug Mapping
 */
export async function saveLink(link: ArchivedLink) {
    if (!redis) return null;

    const pipeline = redis.pipeline();

    // 1. Save Link Data
    pipeline.set(kLink(link.id), JSON.stringify(link));

    // 2. Associate with User (if exists)
    if (link.userId) {
        // Store as a Set (unique IDs) or List. Set is safer for duplicates.
        // We use a Sorted Set (zadd) using timestamp as score to keep order!
        pipeline.zadd(kUserLinks(link.userId), { score: link.date, member: link.id });
    }

    // 3. Slug Mapping (for ultra-fast redirection lookups)
    const slug = link.generated.split('/').pop();
    if (slug) {
        pipeline.set(kSlugMap(slug), link.id);
    }

    await pipeline.exec();
    return link;
}

/**
 * Get a specific link by ID
 */
export async function getLinkById(id: string): Promise<ArchivedLink | null> {
    if (!redis) return null;
    const data = await redis.get(kLink(id)) as ArchivedLink | null;
    return data;
}

/**
 * Get all links for a specific user
 */
export async function getUserLinks(userId: string): Promise<ArchivedLink[]> {
    if (!redis) return [];

    // Get IDs from Sorted Set (Reverse order = newest first)
    const linkIds = await redis.zrange(kUserLinks(userId), 0, -1, { rev: true });

    if (!linkIds.length) return [];

    // Fetch all link objects in parallel
    // @ts-ignore
    const links = await redis.mget(...linkIds.map(id => kLink(String(id))));

    // Filter out nulls (in case of data drift)
    return links.filter(l => l !== null) as ArchivedLink[];
}

/**
 * Delete a link
 */
export async function deleteLink(id: string, userId?: string) {
    if (!redis) return;

    const link = await getLinkById(id);
    if (!link) return;

    const pipeline = redis.pipeline();

    // Remove from User List
    const uid = userId || link.userId;
    if (uid) {
        pipeline.zrem(kUserLinks(uid), id);
    }

    // Remove Slug Map
    const slug = link.generated.split('/').pop();
    if (slug) {
        pipeline.del(kSlugMap(slug));
    }

    // Delete Data
    pipeline.del(kLink(id));

    await pipeline.exec();
}

// --- LEGACY ADAPTERS (For backward compatibility until migration is done) ---
// We will modify these to pull from the "Legacy Monolith" if the new method returns empty,
// OR simply force a migration logic.

export async function getLinks(): Promise<ArchivedLink[]> {
    // ADMIN ONLY: This fetches ALL links. Avoid using this in production for standard users.
    // For now, we return the Legacy DB to not break the Admin Dashboard immediately.
    // Ideally, Admin should paginate.
    return await getLegacyDB();
}

export async function addLinks(links: ArchivedLink[]) {
    // Route to new architecture
    for (const link of links) {
        await saveLink(link);
    }
    // Also save to legacy for safety until full confirmation? 
    // No, let's cut the cord or we'll never migrate.
    // But to be safe for the user session, let's do both for 1 minute.
    /* 
       const legacy = await getLegacyDB();
       const merged = [...links, ...legacy];
       await saveLegacyDB(merged);
    */
    return links;
}

export async function removeLink(id: string) {
    await deleteLink(id);
    // Legacy cleanup
    const legacy = await getLegacyDB();
    const newLegacy = legacy.filter(l => l.id !== id);
    await saveLegacyDB(newLegacy);
    return newLegacy;
}

export async function updateLink(id: string, updates: Partial<ArchivedLink>) {
    const existing = await getLinkById(id);
    if (existing) {
        const updated = { ...existing, ...updates };
        await saveLink(updated);
        return [updated];
    }
    return [];
}


// --- INTERNAL LEGACY UTILS ---

async function getLegacyDB(): Promise<ArchivedLink[]> {
    if (!redis) return [];
    try {
        const data = await redis.get(LEGACY_DB_KEY);
        return typeof data === 'string' ? JSON.parse(data) : (data || []);
    } catch (e) {
        return [];
    }
}

async function saveLegacyDB(data: ArchivedLink[]) {
    if (!redis) return;
    await redis.set(LEGACY_DB_KEY, JSON.stringify(data));
}

// --- MIGRATION TOOL ---
export async function migrateToGranular() {
    console.log("Starting Migration...");
    const all = await getLegacyDB();
    console.log(`Found ${all.length} links to migrate.`);
    let count = 0;

    for (const link of all) {
        // Ensure userId exists (default to 'legacy_user' or derive?)
        // If link has no userId, we might lose it in the user-centric view, 
        // but we still save it by ID.
        await saveLink(link);
        count++;
    }
    return { success: true, migrated: count };
}
