import { kv } from '@vercel/kv';

export type ArchivedLink = {
    id: string;
    original: string;
    generated: string;
    asin: string;
    title: string;
    description: string;
    date: number;
};

const DB_KEY = 'deeplink_history_v1';

async function getDB(): Promise<ArchivedLink[]> {
    try {
        const data = await kv.get<ArchivedLink[]>(DB_KEY);
        return data || [];
    } catch (error) {
        console.warn('Failed to fetch history from KV, returning empty', error);
        return [];
    }
}

async function saveDB(data: ArchivedLink[]) {
    try {
        await kv.set(DB_KEY, data);
    } catch (error) {
        console.error('Failed to save history to KV', error);
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
