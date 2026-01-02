import { NextResponse } from 'next/server';
import { getLinks, addLink, addLinks, removeLink, ArchivedLink } from '@/lib/storage';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
    const { userId } = await auth();
    const links = await getLinks();

    // If user is not logged in, return empty (or handle as public if desired, but here we want private)
    if (!userId) return NextResponse.json([]);

    // Filter links to only show those owned by the user
    // Legacy links (no userId) are considered "orphan" or could be shown to everyone (optional)
    // For now, let's show only owned links + links they just created (handled by frontend state mostly)
    // Or strictly: only match userId.
    const userLinks = links.filter(l => l.userId === userId);
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
        const { updateLink } = require('@/lib/storage');
        const updatedHistory = await updateLink(id, updates);

        return NextResponse.json({ success: true, link: updatedHistory.find((l: any) => l.id === id) });
    } catch (e) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
