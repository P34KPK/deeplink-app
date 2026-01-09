import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that do not require authentication
const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
    '/api/uploadthing(.*)',
    '/api/public(.*)',
    '/go/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    const url = req.nextUrl;

    // 🔴 1. BYPASS: Explicitly allow Webhooks
    if (url.pathname.startsWith('/api/webhooks')) {
        return NextResponse.next();
    }

    // 2. FORCE HTTPS (Production Only)
    const hostname = req.headers.get("host");
    if (process.env.NODE_ENV === "production" && hostname && !hostname.includes("localhost")) {
        const proto = req.headers.get("x-forwarded-proto");
        if (proto === "http") {
            return NextResponse.redirect(`https://${hostname}${url.pathname}${url.search}`, 301);
        }
    }

    // 3. Protected Routes
    const isProtectedRoute = createRouteMatcher([
        '/dashboard(.*)',
        '/admin(.*)',
        '/api/links(.*)',
        '/api/user(.*)'
    ]);

    if (isProtectedRoute(req)) {
        const { userId, redirectToSignIn } = await auth();
        if (!userId) {
            return redirectToSignIn();
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
