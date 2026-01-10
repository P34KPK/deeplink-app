import { NextResponse } from 'next/server';
import { migrateToGranular } from '@/lib/storage';

export async function POST(req: Request) {
    try {
        const key = req.headers.get('x-admin-key');
        // Simple security check using ENV or fallback to current Master Key for immediate utility
        const SECRET = process.env.ADMIN_SECRET || 'P34k_Titanium!X9#LinkR$2025';

        if (key !== SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const result = await migrateToGranular();

        return NextResponse.json({
            success: true,
            message: `Migrated ${result.migrated} links to granular architecture.`,
            details: result
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
