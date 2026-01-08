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


export default clerkMiddleware(async (auth, req) => {
    // Custom Domain Logic (Multi-Tenancy)
    const url = req.nextUrl;
    const hostname = req.headers.get("host"); // e.g. "promo.sebastien.com" or "localhost:3000"

    // Define your main domains
    const mainDomains = ["localhost:3000", "deeplinkrs.app", "deeplinkrs.com", "www.deeplinkrs.com", "deeplink-app.vercel.app", "deeplink-app-seven.vercel.app"];
    const isCustomDomain = hostname && !mainDomains.some(d => hostname.includes(d));

    if (isCustomDomain) {
        // SECURITY: Prevent accessing Dashboard/Admin via Custom Domain
        // We only want to serve the Link (/[slug]) via custom domain.
        if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/command-center') || url.pathname.startsWith('/sign-in')) {
            const mainUrl = new URL(url.pathname, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
            return Response.redirect(mainUrl);
        }

        // Allow public access to everything else (likely the slug) on custom domain
        return;
    }

    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals, static files, AND /amzn routes
        '/((?!_next|amzn|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
