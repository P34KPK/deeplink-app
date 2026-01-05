import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';
import { isAdmin } from '@/lib/admin-auth';

const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

const redis = (redisUrl && redisToken)
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;

export async function GET(req: Request) {
    if (!isAdmin(req)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const status = {
        redis: false,
        local: false,
        lastBackup: null as string | null,
        redisCount: 0,
        localCount: 0,
        synced: false
    };

    // 1. Check Local Backup
    try {
        const backupPath = path.join(process.cwd(), 'data', 'backups', 'links_latest.json');
        if (fs.existsSync(backupPath)) {
            status.local = true;
            const stats = fs.statSync(backupPath);
            status.lastBackup = stats.mtime.toISOString();

            const fileContent = fs.readFileSync(backupPath, 'utf8');
            const data = JSON.parse(fileContent);
            status.localCount = Array.isArray(data) ? data.length : 0;
        }
    } catch (e) {
        console.error('Local backup check failed', e);
    }

    // 2. Check Redis
    if (redis) {
        try {
            // Check connection by getting the key
            const data = await redis.get('deeplink_history_v1');
            status.redis = true;
            // @ts-ignore
            const items = data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];
            status.redisCount = Array.isArray(items) ? items.length : 0;
        } catch (e) {
            console.error('Redis check failed', e);
        }
    }

    // 3. Sync Status
    if (status.redis && status.local) {
        status.synced = status.redisCount === status.localCount;
    }

    return NextResponse.json(status);
}
