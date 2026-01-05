import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
    try {
        if (!redis) {
            return new NextResponse("Redis not configured", { status: 503 });
        }
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
