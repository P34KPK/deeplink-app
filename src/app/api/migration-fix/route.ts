import { NextResponse } from 'next/server';
import { migrateToGranular } from '@/lib/storage';

// Public route temporarily for migration
export async function GET(req: Request) {
    try {
        console.log("Starting Migration via Emergency Route...");
        const result = await migrateToGranular();
        return NextResponse.json({
            success: true,
            message: 'MIGRATION SUCCESSFUL',
            details: result
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
