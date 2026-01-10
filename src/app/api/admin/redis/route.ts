import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { isAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
    if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const pattern = searchParams.get('pattern') || '*';
    const cursor = searchParams.get('cursor') || '0';
    const type = searchParams.get('type') || 'string';

    try {
        if (!redis) throw new Error("Redis not connected");

        // Scan keys
        const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });

        // Optionally fetch values (expensive, so limit to first 10 or make partial)
        const detailedKeys = [];
        for (const key of keys) {
            const ttl = await redis.ttl(key);
            const type = await redis.type(key);
            detailedKeys.push({ key, type, ttl });
        }

        return NextResponse.json({ cursor: nextCursor, keys: detailedKeys });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });

        if (redis) await redis.del(key);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
