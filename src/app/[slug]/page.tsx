import { getShortLink } from '@/lib/shortener';
import DeepLinkRedirect from '@/components/DeepLinkRedirect';
import { notFound } from 'next/navigation';

export default async function ShortLinkPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await getShortLink(slug);

    if (!data) {
        notFound();
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
