import { redis } from '@/lib/redis';

export type AnalyticsData = {
    totalClicks: number;
    globalLastClick: number;
    devices: { android: number; ios: number; desktop: number; other: number };
    dailyClicks: Record<string, number>;
    statsBySlug: Record<string, number>;
    topLinks: Record<string, { total: number; android: number; ios: number; desktop: number; lastClick: number }>;
    locations: Record<string, number>;
    browsers: Record<string, number>;
    referrers: Record<string, number>;
};

// V2 Keys
const KEYS = {
    TOTAL_CLICKS: 'v2:stats:global:clicks',
    LAST_CLICK: 'v2:stats:global:last_click',
    DEVICES: 'v2:stats:global:devices',
    LOCATIONS: 'v2:stats:global:locations',
    BROWSERS: 'v2:stats:global:browsers',
    REFERRERS: 'v2:stats:global:referrers',
    DAILY: 'v2:stats:history:daily',
    SLUGS: 'v2:stats:slugs', // Hash: slug -> count
    ASIN_RANK: 'v2:stats:rank:asins', // ZSET: score=clicks, member=asin
    ASIN_DATA: (asin: string) => `v2:stats:asin:${asin}`, // Hash: last_click, android, ios...
    AFFILIATE: (userId: string) => `user:${userId}:affiliate`, // Hash: clicks, sales, earnings
    SLUG_DAILY: (slug: string) => `v2:stats:history:slug:${slug}`, // Hash: date -> count
    ASIN_LOCATIONS: (asin: string) => `v2:stats:asin:${asin}:locations`, // Hash: country -> count
    ASIN_REFERRERS: (asin: string) => `v2:stats:asin:${asin}:referrers` // Hash: domain -> count
};

export async function trackClick(asin: string, userAgent: string, slug?: string, geo?: string, referrer?: string) {
    if (!redis) return;

    const pipeline = redis.pipeline();
    const timestamp = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // 1. Global Counters
    pipeline.incr(KEYS.TOTAL_CLICKS);
    pipeline.set(KEYS.LAST_CLICK, timestamp);
    pipeline.hincrby(KEYS.DAILY, today, 1);

    // 2. Slug Stats
    if (slug) {
        pipeline.hincrby(KEYS.SLUGS, slug, 1);
        pipeline.hincrby(KEYS.SLUG_DAILY(slug), today, 1);
    }

    // 3. User Agent Parsing
    const ua = userAgent.toLowerCase();
    let device = 'other';
    if (ua.includes('android')) device = 'android';
    else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) device = 'ios';
    else if (ua.includes('mac') || ua.includes('windows') || ua.includes('linux')) device = 'desktop';

    pipeline.hincrby(KEYS.DEVICES, device, 1);

    // 4. Browser & Geo
    let browser = 'Other';
    if (ua.includes('instagram')) browser = 'Instagram App';
    else if (ua.includes('fbav')) browser = 'Facebook App';
    else if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('edge')) browser = 'Edge';
    pipeline.hincrby(KEYS.BROWSERS, browser, 1);

    if (geo && geo !== 'unknown') {
        pipeline.hincrby(KEYS.LOCATIONS, geo.toUpperCase(), 1);
        pipeline.hincrby(KEYS.ASIN_LOCATIONS(asin), geo.toUpperCase(), 1);
    }

    if (referrer) {
        try {
            const hostname = new URL(referrer).hostname.replace('www.', '');
            pipeline.hincrby(KEYS.REFERRERS, hostname, 1);
            pipeline.hincrby(KEYS.ASIN_REFERRERS(asin), hostname, 1);
        } catch { }
    }

    // 5. ASIN Individual Stats
    const asinKey = KEYS.ASIN_DATA(asin);
    pipeline.hset(asinKey, 'last_click', timestamp);
    pipeline.hincrby(asinKey, 'total', 1);
    pipeline.hincrby(asinKey, device, 1); // Increment specific device count for this ASIN
    pipeline.hincrby(asinKey, browser, 1); // Increment specific browser count for this ASIN

    // 6. ASIN Leaderboard
    pipeline.zincrby(KEYS.ASIN_RANK, 1, asin);

    await pipeline.exec();
}

export async function getStats(): Promise<AnalyticsData> {
    if (!redis) return {
        totalClicks: 0, globalLastClick: 0, devices: { android: 0, ios: 0, desktop: 0, other: 0 },
        dailyClicks: {}, statsBySlug: {}, topLinks: {}, locations: {}, browsers: {}, referrers: {}
    };

    // Parallel Fetching
    const [
        totalClicks,
        lastClick,
        devicesRaw,
        dailyRaw,
        slugsRaw,
        locationsRaw,
        browsersRaw,
        referrersRaw,
        topAsins // ZRange (top 100?)
    ] = await Promise.all([
        redis.get(KEYS.TOTAL_CLICKS),
        redis.get(KEYS.LAST_CLICK),
        redis.hgetall(KEYS.DEVICES),
        redis.hgetall(KEYS.DAILY),
        redis.hgetall(KEYS.SLUGS),
        redis.hgetall(KEYS.LOCATIONS),
        redis.hgetall(KEYS.BROWSERS),
        redis.hgetall(KEYS.REFERRERS),
        redis.zrevrange(KEYS.ASIN_RANK, 0, 99, 'WITHSCORES') // Top 100
    ]);

    // Reconstruct Top Links Logic
    // We need to fetch details for these top ASINs
    const topLinks: AnalyticsData['topLinks'] = {};

    // topAsins is [asin, score, asin, score...]
    if (topAsins && topAsins.length > 0) {
        const asinIds = [];
        for (let i = 0; i < topAsins.length; i += 2) {
            asinIds.push(topAsins[i]);
        }

        // Fetch details for each ASIN in parallel pipeline
        const asinPipe = redis.pipeline();
        asinIds.forEach(id => asinPipe.hgetall(KEYS.ASIN_DATA(id)));
        const asinDetails = await asinPipe.exec();

        asinIds.forEach((id, idx) => {
            const details = asinDetails?.[idx]?.[1] as any || {};
            topLinks[id] = {
                total: parseInt(details.total || '0'),
                android: parseInt(details.android || '0'),
                ios: parseInt(details.ios || '0'),
                desktop: parseInt(details.desktop || '0'),
                lastClick: parseInt(details.last_click || '0')
            };
        });
    }

    return {
        totalClicks: parseInt(totalClicks as string || '0'),
        globalLastClick: parseInt(lastClick as string || '0'),
        devices: {
            android: parseInt(devicesRaw?.android || '0'),
            ios: parseInt(devicesRaw?.ios || '0'),
            desktop: parseInt(devicesRaw?.desktop || '0'),
            other: parseInt(devicesRaw?.other || '0'),
        },
        dailyClicks: convertToIntMap(dailyRaw as Record<string, string>),
        statsBySlug: convertToIntMap(slugsRaw as Record<string, string>),
        locations: convertToIntMap(locationsRaw as Record<string, string>),
        browsers: convertToIntMap(browsersRaw as Record<string, string>),
        referrers: convertToIntMap(referrersRaw as Record<string, string>),
        topLinks
    };
}

function convertToIntMap(raw: Record<string, string> | null | undefined) {
    if (!raw) return {};
    const res: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
        res[k] = parseInt(v);
    }
    return res;
}

export async function trackAffiliateClick(userId: string) {
    if (!redis || !userId) return;
    try {
        await redis.hincrby(KEYS.AFFILIATE(userId), 'clicks', 1);
    } catch (e) {
        console.error('Affiliate click track error', e);
    }
}

export async function trackAffiliateSale(userId: string, commission: number = 1.00) {
    if (!redis || !userId) return;
    try {
        const key = KEYS.AFFILIATE(userId);
        const pipe = redis.pipeline();
        pipe.hincrby(key, 'sales', 1);
        pipe.hincrbyfloat(key, 'earnings', commission);
        await pipe.exec();
    } catch (e) {
        console.error('Affiliate sale track error', e);
    }
}

export async function getAffiliateStats(userId: string) {
    if (!redis || !userId) return { clicks: 0, sales: 0, earnings: 0 };
    try {
        const data = await redis.hgetall(KEYS.AFFILIATE(userId)) as any;
        return {
            clicks: parseInt(data?.clicks || '0'),
            sales: parseInt(data?.sales || '0'),
            earnings: parseFloat(data?.earnings || '0')
        };
    } catch (e) {
        return { clicks: 0, sales: 0, earnings: 0 };
    }
}

export async function getSlugDailyHistory(slugs: string[]): Promise<Record<string, number>> {
    if (!redis || slugs.length === 0) return {};
    try {
        const pipeline = redis.pipeline();
        slugs.forEach(slug => pipeline.hgetall(KEYS.SLUG_DAILY(slug)));
        const results = await pipeline.exec();

        const aggregated: Record<string, number> = {};
        results?.forEach((res) => {
            if (!res) return;
            const [err, days] = res;
            if (!err && days) {
                Object.entries(days as Record<string, string>).forEach(([date, count]) => {
                    aggregated[date] = (aggregated[date] || 0) + parseInt(count);
                });
            }
        });
        return aggregated;
    } catch (e) {
        console.error("Error fetching slug history", e);
        return {};
    }
}

export async function getUserDeviceStats(asins: string[]) {
    if (!redis || asins.length === 0) return { android: 0, ios: 0, desktop: 0, other: 0 };
    try {
        const pipeline = redis.pipeline();
        asins.forEach(asin => pipeline.hgetall(KEYS.ASIN_DATA(asin)));
        const results = await pipeline.exec();

        const stats = { android: 0, ios: 0, desktop: 0, other: 0 };
        results?.forEach((res) => {
            if (!res) return;
            const [err, data] = res as [any, any];
            if (!err && data) {
                stats.android += parseInt(data.android || '0');
                stats.ios += parseInt(data.ios || '0');
                stats.desktop += parseInt(data.desktop || '0');
                stats.other += parseInt(data.other || '0');
            }
        });
        return stats;
    } catch (e) {
        console.error("Error fetching device stats", e);
        return { android: 0, ios: 0, desktop: 0, other: 0 };
    }
}

export async function getUserBrowserStats(asins: string[]) {
    if (!redis || asins.length === 0) return {};
    try {
        const pipeline = redis.pipeline();
        asins.forEach(asin => pipeline.hgetall(KEYS.ASIN_DATA(asin)));
        const results = await pipeline.exec();

        const stats: Record<string, number> = {
            'Instagram App': 0, 'Facebook App': 0, 'Chrome': 0,
            'Safari': 0, 'Firefox': 0, 'Edge': 0, 'Other': 0
        };

        results?.forEach((res) => {
            if (!res) return;
            const [err, data] = res as [any, any];
            if (!err && data) {
                Object.keys(stats).forEach(browser => {
                    if (data[browser]) {
                        stats[browser] += parseInt(data[browser]);
                    }
                });
            }
        });
        return stats;
    } catch (e) {
        console.error("Error fetching browser stats", e);
        return {};
    }
}

export async function getUserLocationStats(asins: string[]): Promise<Record<string, number>> {
    if (!redis || asins.length === 0) return {};
    try {
        const pipeline = redis.pipeline();
        asins.forEach(asin => pipeline.hgetall(KEYS.ASIN_LOCATIONS(asin)));
        const results = await pipeline.exec();

        const stats: Record<string, number> = {};
        results?.forEach((res) => {
            if (!res) return;
            const [err, data] = res as [any, any];
            if (!err && data) {
                Object.entries(data as Record<string, string>).forEach(([country, count]) => {
                    stats[country] = (stats[country] || 0) + parseInt(count);
                });
            }
        });
        return stats;
    } catch (e) {
        console.error("Error fetching location stats", e);
        return {};
    }
}

export async function getUserReferrerStats(asins: string[]): Promise<Record<string, number>> {
    if (!redis || asins.length === 0) return {};
    try {
        const pipeline = redis.pipeline();
        asins.forEach(asin => pipeline.hgetall(KEYS.ASIN_REFERRERS(asin)));
        const results = await pipeline.exec();

        const stats: Record<string, number> = {};
        results?.forEach((res) => {
            if (!res) return;
            const [err, data] = res as [any, any];
            if (!err && data) {
                Object.entries(data as Record<string, string>).forEach(([domain, count]) => {
                    stats[domain] = (stats[domain] || 0) + parseInt(count);
                });
            }
        });
        return stats;
    } catch (e) {
        console.error("Error fetching referrer stats", e);
        return {};
    }
}
