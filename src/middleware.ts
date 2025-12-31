import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
// 1. /api/track (Analytics)
// 2. /api/links (If needed public, but usually protected. Keeping protected for now)
// 3. /go/... (If you used 'go' prefix)
// 4. /sign-in, /sign-up
// 5. Short links: We need to allow access to /[slug] which are short links.
//    However, usually short links are at root.
//    We can make the dashboard and root protected, but we must be careful not to block dynamic short links.
//    STRATEGY: Protect specific routes (dashboard, admin, root generator) and leave others public, OR protect everything and exclude short links.
//    Let's protect critical paths.

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    // '/admin(.*)', // Custom Auth handled in page
    '/api/links(.*)', // Protect link management API
]);

// Note: We leave the root '/' public -> Private later? 
// The user wants a SaaS, so usually the landing page is public, but the "App" is private.
// For now, let's protect the Dashboard and Admin, but keep the Generator public OR protect it to require login to CREATE links.
// User said "membership", so creating links should be protected.

const isPublicRoute = createRouteMatcher([
    '/api/track',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)',
    // We assume any other route like /AbC12 is a public short link
]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
    // Optional: Protect root '/' if you want only members to create links
    // if (req.nextUrl.pathname === '/') await auth.protect();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
