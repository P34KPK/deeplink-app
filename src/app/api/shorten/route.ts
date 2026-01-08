import { NextResponse } from 'next/server';
import { createShortLink } from '@/lib/shortener';
import { addLink, getLinks, ArchivedLink } from '@/lib/storage'; // Import storage methods
import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/admin-auth';
import { getUserProfile } from '@/lib/profile-service';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || '');

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        const body = await req.json();
        const { asin, domain, tag, title, slug, isManualAdmin, image } = body;

        if (!asin) {
            return NextResponse.json({ error: 'Missing ASIN' }, { status: 400 });
        }

        // --- AUTH & QUOTA CHECK ---
        let userId = user?.id;
        let userEmail = user?.primaryEmailAddress?.emailAddress;

        // SECURITY FIX: Only allow "isManualAdmin" status if the request has the Admin Key Headers
        const isVerifiedAdmin = isManualAdmin && isAdmin(req);

        // Retrieve Plan
        let plan = 'free';
        if (userId) {
            const planKey = `user:${userId}:plan`;
            const storedPlan = await redis.get(planKey);
            if (storedPlan) plan = storedPlan;
            if (userEmail === 'p34k.productions@gmail.com') plan = 'pro';
        }

        // Allow images for all users (Frontend handles Locking of Custom Uploads)
        // We want Free users to have the Amazon Product Image.
        const finalImage = image || undefined;

        // If not authenticated and not a verified admin, BLOCK.
        if (!userId && !isVerifiedAdmin) {
            return NextResponse.json({
                error: 'Authentication Required. Please Sign In to create links.'
            }, { status: 401 });
        }

        if (userId && plan === 'free' && !isVerifiedAdmin) {
            // Free users can't use custom aliases
            if (slug) {
                return NextResponse.json({
                    error: 'Custom aliases are a PRO feature.'
                }, { status: 403 });
            }

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

        let finalTag = tag;
        // Fallback: If no tag found in link, and user is logged in, use their Profile Tag
        if (!finalTag && userId) {
            try {
                const profile = await getUserProfile(userId);
                if (profile?.amazonTag) {
                    finalTag = profile.amazonTag;
                    // Clean up tag (remove ?tag= prefix if user pasted accidently)
                    finalTag = finalTag.replace(/^.*tag=/, '');
                }
            } catch (e) { }
        }

        const newSlug = await createShortLink({
            asin,
            domain: domain || 'com',
            tag: finalTag,
            title,
            userId: userId || undefined,
            image: finalImage
        }, slug);

        // Use configured domain if available, otherwise fallback to request origin (localhost)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
        // Inject 'amzn' prefix for trust, e.g., domain.com/amzn/slug
        const shortUrl = `${baseUrl}/amzn/${newSlug}`;

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
            date: Date.now(),
            image: finalImage
        };

        // If it's the Admin doing it manually, we might want to tag it?
        // For now we just save it. if userId is undefined (Admin w/o Clerk), it saves as "Orphan" link.
        // Ideally Admin Dashboard should pass a dummy userId or we use the Master Key user.

        await addLink(linkObj);

        return NextResponse.json({
            shortUrl,
            slug: newSlug,
            usage: plan === 'free' ? '20 max' : 'unlimited',
            link: linkObj // Return the full object so frontend doesn't need to save it again
        });

    } catch (e: any) {
        console.error("Shorten Error", e);
        return NextResponse.json({ error: e.message || 'Failed to shorten' }, { status: 500 });
    }
}
