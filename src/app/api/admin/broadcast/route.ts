import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
    if (!(await isAdmin(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { message, type } = await req.json(); // type: 'info', 'warning', 'urgent'

        if (!redis) return NextResponse.json({ error: 'Redis unavail' }, { status: 500 });

        // Store in Redis with 24h expiry
        await redis.set('system:broadcast', JSON.stringify({ message, type, date: Date.now() }));
        await redis.expire('system:broadcast', 86400);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (redis) await redis.del('system:broadcast');
    return NextResponse.json({ success: true });
}
