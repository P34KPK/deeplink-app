import { NextResponse } from 'next/server';
import { fetchAmazonMetadata } from '@/lib/metadata-fetcher';

export async function POST(req: Request) {
    try {
        const { url, prompt, asin } = await req.json();

        if (!url || !prompt) {
            return NextResponse.json({ error: 'URL and Prompt are required' }, { status: 400 });
        }

        // 1. Try to Fetch Product Image from Amazon (Optional Enhancement)
        let productImage = null;
        try {
            // Only try checking metadata if it looks like a product URL
            if (url.includes('amazon') || url.includes('amzn')) {
                const metadata = await fetchAmazonMetadata(url, asin);
                if (metadata && metadata.image) {
                    productImage = metadata.image;
                }
            }
        } catch (e) {
            console.warn("Metadata fetch failed, proceeding with text-to-image only.");
        }

        const seed = Math.floor(Math.random() * 1000000);

        // 2. Pollinations AI Construction
        // If we have an image, we use it as a base (Img2Img).
        // If not, we do pure Text-to-Image.

        let finalUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&n=${seed}&model=turbo`;

        if (productImage) {
            finalUrl += `&image=${encodeURIComponent(productImage)}`;
        }

        // We return both the original extracted image (if any) and the AI result URL.
        return NextResponse.json({
            originalImage: productImage,
            aiUrl: finalUrl
        });

    } catch (error) {
        console.error('Mockup API Error:', error);
        return NextResponse.json({ error: 'Failed to generate mockup' }, { status: 500 });
    }
}
