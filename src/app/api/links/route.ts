import { NextResponse } from 'next/server';
import { getLinks, getUserLinks, getLinkById, saveLink, addLinks, removeLink, deleteLink, updateLink, ArchivedLink } from '@/lib/storage';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/admin-auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET() {
    const user = await currentUser();

    if (!user) return NextResponse.json([]);

    // 🚀 SCALABLE: Fetch ONLY this user's links
    const userLinks = await getUserLinks(user.id);

    console.log(`[API/Links] Fetched ${userLinks.length} links for ${user.id}`);

    return NextResponse.json(userLinks);
}

export async function POST(req: Request) {
    const limiter = await rateLimit(req, { limit: 30, windowMs: 60 * 1000 });
    if (!limiter.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

    try {
        const user = await currentUser();
        const body = await req.json();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const enrichLink = (link: ArchivedLink) => ({
            ...link,
            userId: user.id,
            userEmail: user.primaryEmailAddress?.emailAddress
        });

        if (Array.isArray(body)) {
            const enrichedLinks = body.map(enrichLink);
            await addLinks(enrichedLinks);

            // Return fresh list
            const freshList = await getUserLinks(user.id);
            return NextResponse.json(freshList);
        } else {
            const link: ArchivedLink = body;
            if (!link.id || !link.generated) {
                return NextResponse.json({ error: 'Invalid link data' }, { status: 400 });
            }
            const linkWithUser = enrichLink(link);
            await saveLink(linkWithUser);

            // Return fresh list
            const freshList = await getUserLinks(user.id);
            return NextResponse.json(freshList);
        }
    } catch (error) {
        console.error("API Error", error);
        return NextResponse.json({ error: 'Failed to add link' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Security Check
        const targetLink = await getLinkById(id);

        if (!targetLink) {
            return NextResponse.json({ error: 'Link not found' }, { status: 404 });
        }

        // Allow if owner OR Admin
        if (targetLink.userId !== userId && !(await isAdmin(req))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Use new optimized delete
        await deleteLink(id, targetLink.userId || userId);

        // Return updated list
        const remaining = await getUserLinks(userId);
        return NextResponse.json(remaining);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const targetLink = await getLinkById(id);

        if (!targetLink) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (targetLink.userId !== userId && !(await isAdmin(req))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await updateLink(id, updates);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
