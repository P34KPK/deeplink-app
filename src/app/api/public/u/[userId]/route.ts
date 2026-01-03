
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Safe initialization
const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;
const redis = (redisUrl && redisToken)
    ? new Redis({ url: redisUrl, token: redisToken })
    : { smembers: async () => [], pipeline: () => ({ hgetall: () => { }, exec: async () => [] }), hgetall: async () => null }; // Mock for safety

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        if (!userId) {
            return new NextResponse("User ID is required", { status: 400 });
        }

        // 1. Fetch Profile Data (Dynamic)
        // @ts-ignore
        const profile = await redis.hgetall(`user:${userId}:profile`);

        // Default / Mock Data
        const defaultProfile = {
            username: "P34K",
            bio: "Curated Amazon deals & favorite products.",
            avatar: "/logo.png",
            isVerified: true
        };

        // Merge saved profile with defaults
        const userProfile = {
            ...defaultProfile,
            ...profile,
        };

        if (userId === 'p34k' || userId === 'P34K') {
            // VIP: P34K Special Bypass for LINKS ONLY (Data is now dynamic)
            return NextResponse.json({
                user: userProfile,
                links: [
                    { id: '1', title: 'Sony WH-1000XM5 Noise Canceling', generated: 'https://amzn.to/3EXAMPLE', hits: 1542, date: Date.now() },
                    { id: '2', title: 'MacBook Pro M3 Max (Space Black)', generated: 'https://amzn.to/3TEST', hits: 890, date: Date.now() - 100000 },
                    { id: '3', title: 'Logitech MX Master 3S', generated: 'https://amzn.to/MOUSE', hits: 420, date: Date.now() - 200000 },
                ]
            });
        }

        // 1. Get List of Link IDs for this User
        // @ts-ignore
        const userLinkIds = await redis.smembers(`user:${userId}:links`);

        if (!userLinkIds || userLinkIds.length === 0) {
            return NextResponse.json({ links: [], user: null });
        }

        // 2. Fetch details for each link
        // Optimization: Pipeline for speed
        // @ts-ignore
        const pipeline = redis.pipeline();
        // @ts-ignore
        userLinkIds.forEach((id) => pipeline.hgetall(`link:${id}`));
        // @ts-ignore
        const results = await pipeline.exec();

        // 3. Filter and Format
        const links = results
            .map((link: any) => link)
            .filter((link: any) => link && link.active !== false) // Only show ACTIVE links
            .sort((a: any, b: any) => b.date - a.date); // Newest first

        return NextResponse.json({
            user: userProfile,
            links: links
        });

    } catch (error) {
        console.error("Profile Fetch Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
