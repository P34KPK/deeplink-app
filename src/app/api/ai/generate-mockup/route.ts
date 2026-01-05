import { NextResponse } from 'next/server';
import { fetchAmazonMetadata } from '@/lib/metadata-fetcher';

export async function POST(req: Request) {
    try {
        const { url, prompt } = await req.json();

        if (!url || !prompt) {
            return NextResponse.json({ error: 'URL and Prompt are required' }, { status: 400 });
        }

        // 1. Fetch Product Image from Amazon
        const metadata = await fetchAmazonMetadata(url);

        if (!metadata || !metadata.image) {
            return NextResponse.json({ error: 'Could not fetch product image from Amazon' }, { status: 404 });
        }

        const productImage = metadata.image;
        const seed = Math.floor(Math.random() * 1000000);

        // 2. Pollinations AI Construction
        // We use the image URL as a reference for Pollinations (if supported) or we construct a prompt.
        // Pollinations supports `https://image.pollinations.ai/prompt/...?n=...&model=...&image=URL` for img2img.
        // We will try to use the product image as a base.

        // Strategy: "Product photography of [Product] in [Prompt]" is risky without Inpainting.
        // Better Strategy described by user: "Scan photo, apply prompt". This is Img2Img.

        // We construct the URL to use the product image as input.
        // Note: Pollinations might not robustly support `image=` parameter for all models, but let's try standard approach.
        // If Img2Img fails, we might need a more advanced specialized API, but let's try this free one first.

        const finalUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&n=${seed}&model=turbo&image=${encodeURIComponent(productImage)}`;

        // We return both the original extracted image (for debug) and the AI result URL.
        return NextResponse.json({
            originalImage: productImage,
            aiUrl: finalUrl
        });

    } catch (error) {
        console.error('Mockup API Error:', error);
        return NextResponse.json({ error: 'Failed to generate mockup' }, { status: 500 });
    }
}
