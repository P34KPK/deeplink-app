import { kv } from '@vercel/kv';

type AnalyticsData = {
    totalClicks: number;
    devices: {
        android: number;
        ios: number;
        desktop: number;
        other: number;
    };
    // Upgrade: Store full breakdown per ASIN
    topLinks: Record<string, {
        total: number;
        android: number;
        ios: number;
        desktop: number;
        lastClick: number;
    }>;
};

const defaultData: AnalyticsData = {
    totalClicks: 0,
    devices: { android: 0, ios: 0, desktop: 0, other: 0 },
    topLinks: {},
};

const DB_KEY = 'deeplink_analytics_v2'; // Bump version to start fresh with new structure

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

    // Determine Device
    const ua = userAgent.toLowerCase();
    let isAndroid = false;
    let isIos = false;
    let isDesktop = false;

    if (ua.includes('android')) {
        isAndroid = true;
        data.devices.android += 1;
    } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
        isIos = true;
        data.devices.ios += 1;
    } else if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) {
        isDesktop = true;
        data.devices.desktop += 1;
    } else {
        data.devices.other += 1;
    }

    // 2. Per-Link Stats (ASIN)
    if (!data.topLinks[asin]) {
        data.topLinks[asin] = { total: 0, android: 0, ios: 0, desktop: 0, lastClick: 0 };
    }

    const linkStats = data.topLinks[asin];
    linkStats.total += 1;
    linkStats.lastClick = Date.now();

    if (isAndroid) linkStats.android += 1;
    else if (isIos) linkStats.ios += 1;
    else if (isDesktop) linkStats.desktop += 1;

    // Save
    await saveDB(data);
}

export async function getStats() {
    return await getDB();
}
