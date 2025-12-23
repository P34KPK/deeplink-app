import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'analytics-db.json');

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

function getDB(): AnalyticsData {
    try {
        if (!fs.existsSync(DB_PATH)) {
            fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        return defaultData;
    }
}

function saveDB(data: AnalyticsData) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Failed to save analytics', error);
    }
}

export async function trackClick(asin: string, userAgent: string) {
    const data = getDB();

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

    saveDB(data);
}

export async function getStats() {
    return getDB();
}
