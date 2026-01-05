import { redis } from '@/lib/redis';

export type ArchivedLink = {
    id: string;
    userId?: string; // New: Owner ID
    userEmail?: string; // New: Owner Email for display
    original: string;
    generated: string;
    asin: string;
    title: string;
    description: string;
    date: number;
    active?: boolean; // New: On/Off toggle
    favorite?: boolean; // New: Favorite toggle
    tags?: string[]; // New: Agent A - Organization
    image?: string; // New: Social Preview Image
};

const DB_KEY = 'deeplink_history_v1';

async function getDB(): Promise<ArchivedLink[]> {
    let data: ArchivedLink[] | null = null;

    // 1. Try Redis
    if (redis) {
        try {
            const redisData = await redis.get(DB_KEY) as string | null | object;
            if (redisData) {
                if (typeof redisData === 'string') {
                    data = JSON.parse(redisData);
                } else {
                    data = redisData as ArchivedLink[];
                }
            }
        } catch (error) {
            console.warn('Failed to fetch history from Redis', error);
        }
    }

    // 2. Fallback to Local Backup if Redis is empty or failed
    if (!data || data.length === 0) {
        try {
            const backupPath = path.join(process.cwd(), 'data', 'backups', 'links_latest.json');
            if (fs.existsSync(backupPath)) {
                const fileContent = fs.readFileSync(backupPath, 'utf8');
                data = JSON.parse(fileContent);
                console.log('Restored data from local backup');

                // Optional: Heal Redis immediately
                if (redis && data) {
                    await redis.set(DB_KEY, JSON.stringify(data));
                }
            }
        } catch (fsError) {
            console.warn('Failed to read local backup', fsError);
        }
    }

    return data || [];
}

import fs from 'fs';
import path from 'path';

async function saveDB(data: ArchivedLink[]) {
    // 1. Always save to Local Backup (Source of Truth)
    try {
        const backupDir = path.join(process.cwd(), 'data', 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Save 'latest' version
        fs.writeFileSync(path.join(backupDir, 'links_latest.json'), JSON.stringify(data, null, 2));

        // Optional: Save timestamped version every hour/day? 
        // For now, let's just keep 'latest' to avoid disk spam, 
        // but maybe a 'daily' one if we really want history.

    } catch (fsError) {
        console.error('Failed to write local backup', fsError);
    }

    // 2. Save to Redis (Cache / Cloud)
    if (redis) {
        try {
            await redis.set(DB_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to Redis', error);
        }
    }
}

export async function getLinks() {
    return await getDB();
}

export async function addLinks(links: ArchivedLink[]) {
    const history = await getDB();
    // Filter out duplicates based on ID
    const newLinks = links.filter(l => !history.some(h => h.id === l.id));

    if (newLinks.length === 0) return history;

    // Prepend new links
    const newHistory = [...newLinks, ...history];
    await saveDB(newHistory);
    return newHistory;
}

export async function addLink(link: ArchivedLink) {
    return await addLinks([link]);
}

export async function removeLink(id: string) {
    const history = await getDB();
    const newHistory = history.filter(l => l.id !== id);
    await saveDB(newHistory);
    return newHistory;
}

export async function updateLink(id: string, updates: Partial<ArchivedLink>) {
    const history = await getDB();
    const newHistory = history.map(l => l.id === id ? { ...l, ...updates } : l);
    await saveDB(newHistory);
    return newHistory;
}
