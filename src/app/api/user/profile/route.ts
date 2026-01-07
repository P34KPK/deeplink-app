import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/lib/profile-service';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getUserProfile(userId);
    // Return default if null
    return NextResponse.json(profile || {
        userId,
        username: '',
        bio: '',
        socials: {}
    });
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        // Validation could go here
        const updated = await saveUserProfile(userId, body);
        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }
}
