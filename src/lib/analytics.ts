import { kv } from '@vercel/kv';

type AnalyticsData = {
    totalClicks: number;
    globalLastClick: number; // For "Last Activity" KPI
    devices: {
        android: number;
        ios: number;
        desktop: number;
        other: number;
    };
    // Agent A: Time Series (YYYY-MM-DD -> Count)
    dailyClicks: Record<string, number>;
    // Upgrade: Store stats per unique Slug (for independent link tracking)
    statsBySlug: Record<string, number>;
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
    globalLastClick: 0,
    devices: { android: 0, ios: 0, desktop: 0, other: 0 },
    dailyClicks: {},
    statsBySlug: {},
    topLinks: {},
};

const DB_KEY = 'deeplink_analytics_v3'; // Bump version for new schema

async function getDB(): Promise<AnalyticsData> {
    try {
        const data = await kv.get<AnalyticsData>(DB_KEY);
        // Merge with defaultData to ensure new fields exist if migrating
        if (data) {
            return {
                ...defaultData,
                ...data,
                dailyClicks: data.dailyClicks || {}, // Ensure safety
                statsBySlug: data.statsBySlug || {},
            };
        }
        return defaultData;
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

export async function trackClick(asin: string, userAgent: string, slug?: string) {
    const data = await getDB();

    // 1. Total Clicks & Global Timestamp
    data.totalClicks += 1;
    data.globalLastClick = Date.now();

    // 2. Daily Clicks (Agent A)
    const today = new Date().toISOString().split('T')[0];
    data.dailyClicks[today] = (data.dailyClicks[today] || 0) + 1;

    // 3. Stats by Slug (Independent Link Tracking)
    if (slug) {
        data.statsBySlug[slug] = (data.statsBySlug[slug] || 0) + 1;
    }

    // 4. Determine Device
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

    // 5. Per-Link Stats (ASIN)
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
