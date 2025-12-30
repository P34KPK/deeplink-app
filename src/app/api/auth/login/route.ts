import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const ipAttempts = new Map<string, { count: number; firstAttempt: number }>();

export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();

        // Rate Limiting Logic
        const record = ipAttempts.get(ip);
        if (record) {
            if (now - record.firstAttempt > RATE_LIMIT_WINDOW) {
                // Reset window
                ipAttempts.set(ip, { count: 1, firstAttempt: now });
            } else if (record.count >= MAX_ATTEMPTS) {
                return NextResponse.json(
                    { message: 'Too many login attempts. Please try again later.' },
                    { status: 429 }
                );
            } else {
                record.count++;
            }
        } else {
            ipAttempts.set(ip, { count: 1, firstAttempt: now });
        }

        const body = await request.json();
        const { username, password } = body;

        // Use Environment Variables
        const validUser = process.env.ADMIN_USER;
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!validUser || !passwordHash) {
            console.error('Missing ADMIN_USER or ADMIN_PASSWORD_HASH env vars');
            return NextResponse.json(
                { message: 'Server configuration error' },
                { status: 500 }
            );
        }

        const isUserValid = username === validUser;
        const isPasswordValid = await bcrypt.compare(password, passwordHash);

        if (isUserValid && isPasswordValid) {
            // Reset attempts on success
            ipAttempts.delete(ip);

            const response = NextResponse.json({ success: true });

            response.cookies.set('deeplink_secure_session', 'valid_session', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            return response;
        } else {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }
    } catch (e) {
        console.error('Login error:', e);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
