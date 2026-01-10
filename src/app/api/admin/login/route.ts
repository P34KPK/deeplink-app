import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_KEY } from '@/lib/admin-auth';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        if (password === ADMIN_KEY) {
            const cookieStore = await cookies();
            cookieStore.set('admin_token', password, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 7 Days
                path: '/',
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid Password' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Login Failed' }, { status: 500 });
    }
}
