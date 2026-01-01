import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export async function POST(req: Request) {
    try {
        const { message } = await req.json();
        const user = await currentUser();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const report = {
            id: crypto.randomUUID(),
            userId: user?.id || 'anonymous',
            email: user?.primaryEmailAddress?.emailAddress || 'Anonymous',
            message,
            timestamp: Date.now(),
            status: 'open'
        };

        // Store in a generic list 'reports:bugs'
        // Using lpush to add to the head of the list
        await redis.lpush('reports:bugs', JSON.stringify(report));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Bug report error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
