import DeepLinkRedirect from '@/components/DeepLinkRedirect';
import { notFound } from 'next/navigation';
import { Redis } from '@upstash/redis';
import { getLinks } from '@/lib/storage';
import { getStats } from '@/lib/analytics';
import Link from 'next/link';
import { Metadata } from 'next';

const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;
const redis = (redisUrl && redisToken)
    ? new Redis({ url: redisUrl, token: redisToken })
    : { get: async () => null }; // Mock to prevent crash

// --- AGENT A: Social Preview Generator ---
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = await getShortLink(slug);

    if (!data) return { title: 'Link Information' };

    // Construct Image URLs - STATIC CARD STRATEGY
    // This guarantees a professional 100% success rate display on Facebook/Meta.
    const baseUrl = 'https://deeplink-app-seven.vercel.app';
    const socialCardUrl = `${baseUrl}/social-preview.png`;

    return {
        title: data.title || `View Deal on Amazon`,
        description: `Tap to open this limited time offer in the Amazon App. Secure link by DeepLinkrs.`,
        openGraph: {
            title: data.title || `⚡️ View Deal on Amazon`,
            description: 'Tap to view exclusive price in App',
            images: [
                {
                    url: socialCardUrl,
                    width: 1200,
                    height: 630,
                    alt: 'View Deal'
                }
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `View Deal`,
            description: 'Tap to open in Amazon App',
            images: [socialCardUrl],
        }
    };
}

export default async function ShortLinkPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await getShortLink(slug);

    if (!data) {
        notFound();
    }

    // --- ENFORCE LIMITS ---
    if (data.userId) {
        // 1. Get Plan
        const planKey = `user:${data.userId}:plan`;
        const plan = await redis.get(planKey) || 'free';

        // Admin Override
        const links = await getLinks();
        const userEmail = links.find(l => l.userId === data.userId)?.userEmail;
        const isOwner = userEmail === 'p34k.productions@gmail.com';

        if (plan === 'free' && !isOwner) {
            // 2. Count Usage
            const userLinks = links.filter(l => l.userId === data.userId);
            const stats = await getStats();

            let totalClicks = 0;
            for (const link of userLinks) {
                const linkSlug = link.generated.split('/').pop();
                if (linkSlug && stats.statsBySlug[linkSlug]) {
                    totalClicks += stats.statsBySlug[linkSlug];
                }
            }

            if (totalClicks >= 200) {
                return (
                    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 text-center">
                        <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-xl max-w-md">
                            <h1 className="text-2xl font-bold text-red-500 mb-4">Link Inactive</h1>
                            <p className="text-gray-300 mb-6">
                                The owner of this link has reached their monthly traffic limit.
                            </p>
                            <Link href="/" className="text-sm text-gray-500 hover:text-white underline">
                                Create your own deep links
                            </Link>
                        </div>
                    </div>
                );
            }
        }
    }

    return (
        <DeepLinkRedirect
            asin={data.asin}
            tag={data.tag}
            domain={data.domain}
            slug={slug}
        />
    );
}
