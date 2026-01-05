import { NextResponse } from 'next/server';
import { getLinks, addLink, addLinks, removeLink, updateLink, ArchivedLink } from '@/lib/storage';
import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/admin-auth';

export async function GET() {
    const user = await currentUser();

    // If user is not logged in, return empty
    if (!user) return NextResponse.json([]);

    const links = await getLinks();

    // Filter links to only show those owned by the user (ID or Email match)
    const userEmail = user.emailAddresses[0]?.emailAddress;

    const userLinks = links.filter(l => {
        const idMatch = l.userId === user.id;
        const emailMatch = userEmail && l.userEmail && l.userEmail.toLowerCase() === userEmail.toLowerCase();
        return idMatch || emailMatch;
    });

    console.log(`[API/Links] User: ${user.id} (${userEmail})`);
    console.log(`[API/Links] Total Links in DB: ${links.length}`);
    console.log(`[API/Links] Links found for user: ${userLinks.length}`);

    return NextResponse.json(userLinks);
}

export async function POST(req: Request) {
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
            // Note: addLinks simply appends. Filtering is done on GET.
            const updatedHistory = await addLinks(enrichedLinks);
            // We return ONLY the user's links to update their view immediately
            return NextResponse.json(updatedHistory.filter(l => l.userId === user.id));
        } else {
            const link: ArchivedLink = body;
            if (!link.id || !link.generated) {
                return NextResponse.json({ error: 'Invalid link data' }, { status: 400 });
            }
            const linkWithUser = enrichLink(link);
            const updatedHistory = await addLink(linkWithUser);
            return NextResponse.json(updatedHistory.filter(l => l.userId === user.id));
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

        // Security Check: Verify ownership or Admin Status
        const allLinks = await getLinks();
        const targetLink = allLinks.find(l => l.id === id);

        if (!targetLink) {
            return NextResponse.json({ error: 'Link not found' }, { status: 404 });
        }

        // Allow if owner OR Admin
        if (targetLink.userId !== userId && !isAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized: You do not own this link' }, { status: 403 });
        }

        const updatedHistory = await removeLink(id);
        return NextResponse.json(updatedHistory);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        // Update in DB (imported from storage)
        // We need to import updateLink first! Added to imports.
        const { userId } = await auth();

        // Security Check
        const allLinks = await getLinks();
        const targetLink = allLinks.find(l => l.id === id);

        if (!targetLink) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (targetLink.userId !== userId && !isAdmin(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const updatedHistory = await updateLink(id, updates);

        return NextResponse.json({ success: true, link: updatedHistory.find((l: any) => l.id === id) });
    } catch (e) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
