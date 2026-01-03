import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.REDIS_URL || '',
    token: process.env.REDIS_TOKEN || '',
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, email } = body;

        if (!message) {
            return new NextResponse("Message required", { status: 400 });
        }

        const ticketId = Math.random().toString(36).substr(2, 9);
        const ticket = {
            id: ticketId,
            msg: message,
            user: email || 'Anonymous',
            date: Date.now(),
            status: 'open'
        };

        // Push to the FRONT of the list (LPUSH) so admins see new stuff first
        await redis.lpush('system:inbox', JSON.stringify(ticket));

        return NextResponse.json({ success: true, ticketId });
    } catch (error) {
        console.error("Report Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
