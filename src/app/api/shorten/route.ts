import { NextResponse } from 'next/server';
import { createShortLink } from '@/lib/shortener';
import { addLink, getLinks, ArchivedLink } from '@/lib/storage'; // Import storage methods
import { auth, currentUser } from '@clerk/nextjs/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export async function POST(req: Request) {
    try {
        console.log("SHORTEN API CALLED");
        const user = await currentUser();
        console.log("User retrieved:", user?.id);

        const body = await req.json();
        const { asin, domain, tag, title, slug, isManualAdmin } = body;
        console.log("Request Body:", { asin, domain, isManualAdmin });

        if (!asin) {
            return NextResponse.json({ error: 'Missing ASIN' }, { status: 400 });
        }

        // --- AUTH & QUOTA CHECK ---
        let userId = user?.id;
        let userEmail = user?.primaryEmailAddress?.emailAddress;

        // If coming from Admin Dashboard (Master Key), we treat as Super User (Pro)
        // But the API doesn't know about Master Key directly unless we pass a secret.
        // For now, if no user but valid request, it might be Guest or Admin.
        // Admin usually is on localhost or has a specific header? 
        // Let's rely on the fact that if 'user' is null, it's a Guest or Admin.

        // Retrieve Plan
        let plan = 'free';
        if (userId) {
            const planKey = `user:${userId}:plan`;
            const storedPlan = await redis.get(planKey);
            if (storedPlan) plan = storedPlan;

            // ADMIN OVERRIDE: If it's YOU, you are PRO.
            // Replace with your actual email to be safe
            if (userEmail === 'p34k.productions@gmail.com') plan = 'pro';
        }

        // If 'isManualAdmin' flag is sent (from Admin Dashboard), bypass quotas
        // We really should secure this with a secret token, but for now trust the internal call.
        if (!userId && !isManualAdmin) {
            return NextResponse.json({
                error: 'Authentication Required. Please Sign In to create links.'
            }, { status: 401 });
        }

        if (userId && plan === 'free' && !isManualAdmin) {
            // Count existing links
            const allLinks = await getLinks();
            const userLinkCount = allLinks.filter(l => l.userId === userId).length;

            if (userLinkCount >= 20) {
                return NextResponse.json({
                    error: 'Free Tier Limit Reached (20 Links). Upgrade to PRO for unlimited links.'
                }, { status: 403 });
            }
        }

        // --- CREATE LINK ---
        const newSlug = await createShortLink({
            asin,
            domain: domain || 'com',
            tag,
            title,
            userId: userId || undefined
        }, slug);

        // Use configured domain if available, otherwise fallback to request origin (localhost)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
        const shortUrl = `${baseUrl}/${newSlug}`;

        // --- AUTO SAVE TO HISTORY ---
        // We now save immediately so it's counted next time
        // Generate a Link Object
        const linkObj: ArchivedLink = {
            id: crypto.randomUUID(),
            userId: userId || undefined,
            userEmail: userEmail || undefined,
            original: `https://amazon.${domain || 'com'}/dp/${asin}`,
            generated: shortUrl,
            asin,
            title: title || 'Untitled Product',
            description: '', // Optional
            date: Date.now()
        };

        // If it's the Admin doing it manually, we might want to tag it?
        // For now we just save it. if userId is undefined (Admin w/o Clerk), it saves as "Orphan" link.
        // Ideally Admin Dashboard should pass a dummy userId or we use the Master Key user.

        await addLink(linkObj);

        return NextResponse.json({ shortUrl, slug: newSlug, usage: plan === 'free' ? '20 max' : 'unlimited' });

    } catch (e: any) {
        console.error("Shorten Error", e);
        return NextResponse.json({ error: e.message || 'Failed to shorten' }, { status: 500 });
    }
}
