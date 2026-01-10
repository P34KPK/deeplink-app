import { NextResponse } from 'next/server';
import { migrateToGranular } from '@/lib/storage';

import { isAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
    try {
        if (!(await isAdmin(req))) {
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
