import { NextResponse } from 'next/server';
import { getLinks, addLink, addLinks, removeLink, ArchivedLink } from '@/lib/storage';

export async function GET() {
    const links = await getLinks();
    return NextResponse.json(links);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (Array.isArray(body)) {
            const updatedHistory = await addLinks(body);
            return NextResponse.json(updatedHistory);
        } else {
            const link: ArchivedLink = body;
            if (!link.id || !link.generated) {
                return NextResponse.json({ error: 'Invalid link data' }, { status: 400 });
            }
            const updatedHistory = await addLink(link);
            return NextResponse.json(updatedHistory);
        }
    } catch (error) {
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
