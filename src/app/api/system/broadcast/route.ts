import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        if (!redis) return NextResponse.json(null);

        const raw = await redis.get('system:broadcast');
        if (!raw) return NextResponse.json(null);

        return NextResponse.json(JSON.parse(raw));
    } catch (e) {
        return NextResponse.json(null, { status: 500 });
    }
}
