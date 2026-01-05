import { NextResponse } from 'next/server';
import { getLinks } from '@/lib/storage'; // Standardized Storage
import { getUserProfile } from '@/lib/user-profile';
import { isBanned } from '@/lib/ban-system';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

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

        // 2. Fetch Links from Main Storage (JSON Blob)
        // This ensures compatibility with the Dashboard and Link Generator
        const allLinks = await getLinks();

        const userLinks = allLinks
            .filter((l) => l.userId === userId && l.active !== false)
            .sort((a, b) => b.date - a.date);

        return NextResponse.json({
            user: userProfile,
            links: userLinks
        });

    } catch (error) {
        console.error("Profile Fetch Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 }); // Fix JSON validity
    }
}
