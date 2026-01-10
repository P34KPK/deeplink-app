import { NextResponse } from 'next/server';
import { getUserLinks } from '@/lib/storage'; // Optimized Storage
import { getUserProfile, getUserIdByHandle } from '@/lib/profile-service';
import { isBanned } from '@/lib/ban-system';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        let { userId } = await params;

        // Resolve Handle if applicable
        if (userId && !userId.startsWith('user_')) {
            const resolved = await getUserIdByHandle(userId);
            if (resolved) userId = resolved;
        }

        if (!userId) {
            return new NextResponse("User ID is required", { status: 400 });
        }

        if (await isBanned(userId)) {
            return new NextResponse("This account has been suspended due to policy violations.", { status: 403 });
        }

        // 1. Fetch Profile Data (Dynamic from Redis if available)
        const profileData = await getUserProfile(userId);

        // Default / Mock Profile
        const defaultProfile = {
            username: "My Recommendations",
            bio: "Curated Amazon deals & favorite products.",
            avatar: null, // Frontend uses placeholder if null
            socials: {},
            isVerified: false
        };

        const userProfile = {
            ...defaultProfile,
            ...profileData,
            avatar: profileData?.avatarUrl || null
        };

        // 2. Fetch Links using Optimized Granular Lookup (O(1))
        // This is now instant and scalable
        const userLinks = await getUserLinks(userId);

        // Filter out inactive links if necessary (handled by frontend usually, but good to have)
        const activeLinks = userLinks.filter(l => l.active !== false);

        return NextResponse.json({
            user: userProfile,
            links: activeLinks
        });

    } catch (error) {
        console.error("Profile Fetch Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
