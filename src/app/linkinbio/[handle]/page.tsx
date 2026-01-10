import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getLinks } from '@/lib/storage';
import { getUserProfile, getUserIdByHandle } from '@/lib/profile-service';
import { isBanned } from '@/lib/ban-system';
import BioPageClient from './BioPageClient';

// --- DATA FETCHING (Server Side) ---
async function getBioData(handle: string) {
    let userId = handle;

    // 1. Resolve Handle
    if (userId && !userId.startsWith('user_')) {
        const resolved = await getUserIdByHandle(userId);
        if (resolved) userId = resolved;
        else return null; // Handle not found
    }

    if (!userId) return null;

    // 2. Check Ban Status
    if (await isBanned(userId)) {
        return { banned: true };
    }

    // 3. Fetch Profile
    const profileData = await getUserProfile(userId);
    const defaultProfile = {
        username: "My Recommendations",
        bio: "Curated Amazon deals & favorite products.",
        avatar: null,
        socials: {},
        isVerified: false
    };

    const userProfile = {
        ...defaultProfile,
        ...profileData,
        avatar: profileData?.avatarUrl || null
    };

    // 4. Fetch Links
    const allLinks = await getLinks();
    const userLinks = allLinks
        .filter((l) => l.userId === userId && l.active !== false)
        .sort((a, b) => b.date - a.date);

    return {
        user: userProfile,
        links: userLinks,
        banned: false
    };
}

// --- SEO METADATA ---
export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
    const { handle } = await params;
    const data = await getBioData(handle);

    if (!data || data.banned) {
        return {
            title: 'Profile Not Found',
            description: 'This profile does not exist or has been suspended.'
        };
    }

    const { user } = data;
    const title = `${user.username} | My Amazon Picks`;
    const description = user.bio || `Check out ${user.username}'s favorite products and deals on Amazon.`;

    // Use profile avatar or a default OG image
    const images = user.avatar ? [user.avatar] : ['/social-preview.png'];

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: images,
            type: 'profile',
        },
        twitter: {
            card: 'summary',
            title: title,
            description: description,
            images: images,
        }
    };
}

// --- PAGE COMPONENT ---
export default async function UserBioPage({ params }: { params: Promise<{ handle: string }> }) {
    const { handle } = await params;
    const data = await getBioData(handle);

    if (!data) {
        return notFound();
    }

    if (data.banned) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white p-8 text-center">
                <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-xl max-w-md">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Account Suspended</h1>
                    <p className="text-gray-300">
                        This profile is currently unavailable due to a violation of our terms of service.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <BioPageClient
            initialUser={data.user}
            initialLinks={data.links}
        />
    );
}
