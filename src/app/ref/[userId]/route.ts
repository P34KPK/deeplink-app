
import { NextRequest, NextResponse } from 'next/server';
import { trackAffiliateClick } from '@/lib/analytics';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;

    if (userId) {
        // Track the click asynchronously
        trackAffiliateClick(userId);
    }

    const url = request.nextUrl.clone();
    url.pathname = '/'; // Redirect to home

    const response = NextResponse.redirect(url);

    if (userId) {
        // Set cookie for attribution (30 days)
        response.cookies.set('deeplink_ref', userId, {
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
            httpOnly: true, // Secure enough for now
        });
    }

    return response;
}
