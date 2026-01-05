import { NextResponse } from 'next/server';
import { addLinks } from '@/lib/storage';
import { nanoid } from 'nanoid';

export async function GET(req: Request) {
    // Generate dummy data for VIPs
    const dummyLinks = [
        {
            id: nanoid(8),
            userEmail: 'p34k.productions@gmail.com',
            userId: 'user_p34k_admin_001',
            original: 'https://www.amazon.com/dp/B08N5LWY43',
            generated: 'https://amzn.to/3xyz123',
            asin: 'B08N5LWY43',
            title: 'Sony Alpha 7S III Full-frame Interchangeable Lens Mirrorless Camera',
            description: 'Professional video camera.',
            date: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
            hits: 1240,
            active: true
        },
        {
            id: nanoid(8),
            userEmail: 'p34k.productions@gmail.com',
            userId: 'user_p34k_admin_001',
            original: 'https://www.amazon.com/dp/B09H22N8V7',
            generated: 'https://amzn.to/3abc456',
            asin: 'B09H22N8V7',
            title: 'Rode Wireless GO II Dual Channel Wireless Microphone System',
            description: 'Compact wireless mic.',
            date: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
            hits: 850,
            active: true
        },
        {
            id: nanoid(8),
            userEmail: 'stacyadds@gmail.com',
            userId: 'user_stacy_pro_002',
            original: 'https://www.amazon.com/dp/B07W5JKB8Z',
            generated: 'https://amzn.to/3def789',
            asin: 'B07W5JKB8Z',
            title: 'Neewer 2-Pack Dimmable 5600K USB LED Video Light',
            description: 'Lighting setup.',
            date: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
            hits: 340,
            active: true
        },
        {
            id: nanoid(8),
            userEmail: 'stacyadds@gmail.com',
            userId: 'user_stacy_pro_002',
            original: 'https://www.amazon.com/dp/B01MT2288M',
            generated: 'https://amzn.to/3ghi012',
            asin: 'B01MT2288M',
            title: 'Elgato Stream Deck MK.2',
            description: 'Studio controller.',
            date: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
            hits: 2100,
            active: true
        }
    ];

    await addLinks(dummyLinks);

    return NextResponse.json({
        success: true,
        message: 'Seeded 4 dummy links for VIP users',
        seeded: dummyLinks
    });
}
