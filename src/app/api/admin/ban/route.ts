import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { banUser } from '@/lib/ban-system';

export async function POST(req: Request) {
    if (!isAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { email, userId } = await req.json();

        if (!email && !userId) {
            return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
        }

        if (userId) await banUser(userId);
        if (email) await banUser(email);

        return NextResponse.json({ success: true, message: 'Hammer Down!' });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
