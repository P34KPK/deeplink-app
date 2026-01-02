import { NextResponse } from 'next/server';
import { getLinks } from '@/lib/storage';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // 1. Get All Links
    const allLinks = await getLinks();

    // 2. Filter by User
    const userLinks = allLinks.filter(l => l.userId === userId);

    // 3. Enrich with Click Counts
    const enrichedLinks = await Promise.all(userLinks.map(async (link) => {
        const slug = link.generated.split('/').pop();
        let hits = 0;
        if (slug) {
            const c = await redis.get(`shortlink:${slug}:clicks`);
            hits = c ? parseInt(c, 10) : 0;
        }
        return { ...link, hits };
    }));

    return NextResponse.json(enrichedLinks);
}
