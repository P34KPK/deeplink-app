import { getShortLink } from '@/lib/shortener';
import DeepLinkRedirect from '@/components/DeepLinkRedirect';
import { notFound } from 'next/navigation';
import Redis from 'ioredis';
import { getLinks } from '@/lib/storage';
import { getStats } from '@/lib/analytics';
import Link from 'next/link';
import { Metadata } from 'next';

const redis = new Redis(process.env.REDIS_URL || '');

// --- AGENT A: Social Preview Generator ---
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const data = await getShortLink(slug);

    if (!data) return { title: 'Link Information' };

    // Construct Image URLs - Using External Proxy (wsrv.nl) to bypass geo/bot blocks
    const baseUrl = 'https://deeplink-app-seven.vercel.app';
    const amazonBase = `https://images-na.ssl-images-amazon.com/images/P/${data.asin}.01._LZZZZZZZ_.jpg`;

    // 1. External Proxy (High Success Rate for FB)
    const imgExternalProxy = `https://wsrv.nl/?url=${encodeURIComponent(amazonBase)}&w=600&h=600&fit=contain&output=jpg`;

    // 2. Direct Backup (m.media often works if ssl fails)
    const imgDirect = `https://m.media-amazon.com/images/I/${data.asin}.jpg`;

    // 3. Fallback
    const fallback = `${baseUrl}/logo.png`;

    return {
        title: data.title || `View Product on Amazon`,
        description: `Check out this product on Amazon! ${data.tag ? 'Affiliate Link included.' : ''}`,
        openGraph: {
            title: data.title || `View Product on Amazon`,
            description: 'Check to view details',
            images: [imgExternalProxy, imgDirect, fallback],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `View Product`,
            description: 'Tap to open in Amazon App',
            images: [imageUrl],
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
