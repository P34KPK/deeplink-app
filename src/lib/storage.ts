import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

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
};

const DB_KEY = 'deeplink_history_v1';

async function getDB(): Promise<ArchivedLink[]> {
    try {
        const data = await redis.get(DB_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.warn('Failed to fetch history from Redis, returning empty', error);
        return [];
    }
}

async function saveDB(data: ArchivedLink[]) {
    try {
        await redis.set(DB_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save history to Redis', error);
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
