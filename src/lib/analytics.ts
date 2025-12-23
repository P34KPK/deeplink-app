import { kv } from '@vercel/kv';

type AnalyticsData = {
    totalClicks: number;
    devices: {
        android: number;
        ios: number;
        desktop: number;
        other: number;
    };
    topLinks: Record<string, number>; // ASIN -> count
};

const defaultData: AnalyticsData = {
    totalClicks: 0,
    devices: { android: 0, ios: 0, desktop: 0, other: 0 },
    topLinks: {},
};

const DB_KEY = 'deeplink_analytics_v1';

async function getDB(): Promise<AnalyticsData> {
    try {
        const data = await kv.get<AnalyticsData>(DB_KEY);
        return data || defaultData;
    } catch (error) {
        console.warn('Failed to fetch from KV, returning default data', error);
        return defaultData;
    }
}

async function saveDB(data: AnalyticsData) {
    try {
        await kv.set(DB_KEY, data);
    } catch (error) {
        console.error('Failed to save to KV', error);
    }
}

export async function trackClick(asin: string, userAgent: string) {
    const data = await getDB();

    // 1. Total Clicks
    data.totalClicks += 1;

    // 2. Device Type
    const ua = userAgent.toLowerCase();
    if (ua.includes('android')) {
        data.devices.android += 1;
    } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
        data.devices.ios += 1;
    } else if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) {
        data.devices.desktop += 1;
    } else {
        data.devices.other += 1;
    }

    // 3. Top Links
    if (!data.topLinks[asin]) {
        data.topLinks[asin] = 0;
    }
    data.topLinks[asin] += 1;

    await saveDB(data);
}

export async function getStats() {
    return await getDB();
}
