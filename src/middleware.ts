import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Debug log to verify middleware is running
    console.log(`[Middleware] Checking path: ${path}`);

    // Define paths that MUST be protected (Admin only)
    // We use specific checks to avoid blocking public links by accident
    const isProtectedRoute =
        path === '/' ||                       // The main generator page
        path.startsWith('/dashboard') ||      // The analytics dashboard
        path.startsWith('/history');          // The history page

    const token = request.cookies.get('deeplink_secure_session')?.value;

    // If trying to access a protected route without being logged in
    if (isProtectedRoute && !token) {
        console.log(`[Middleware] Access denied to ${path}, redirecting to login`);
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If already logged in and trying to go to login, send to home
    if (path === '/login' && token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Exclude static files and API routes that don't need protection
    // But INCLUDE the root / and other pages
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/track (public tracking)
         * - go (public redirects)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - logo.png (public logo)
         */
        '/((?!api/track|go|_next/static|_next/image|favicon.ico|logo.png).*)',
    ],
};
