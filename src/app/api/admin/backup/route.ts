import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { isAdmin } from '@/lib/admin-auth';

// Initialize Redis (ioredis for compatibility)
const redisUrl = process.env.REDIS_URL;
const redis = redisUrl ? new Redis(redisUrl) : new Redis();

// Encryption Configuration
const ALGORITHM = 'aes-256-cbc';
// In a real scenario, this key should be in .env.local and rotated/managed securely.
// For this session, we'll auto-generate one if missing, or use a fixed app secret.
// Using a derived key from a fixed secret for demonstration/stability unless configured.
const SECRET_KEY = process.env.BACKUP_ENCRYPTION_KEY || 'P34k_Titanium_Backup_Secret_Key_2025_!!';
// Ensure key is 32 bytes
const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);

function encrypt(text: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        content: encrypted
    };
}

export async function POST(req: Request) {
    if (!(await isAdmin(req))) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log('[Backup] Starting secure backup sequence...');
        const backupData: any = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            data: {}
        };

        // 1. Fetch Core Data Sets
        const history = await redis.get('deeplink_history_v1');
        if (history) backupData.data.history = JSON.parse(history);

        const analytics = await redis.get('deeplink_analytics_v3');
        if (analytics) backupData.data.analytics = JSON.parse(analytics);

        // 2. Fetch All Individual Shortlinks (Scan keys)
        // Note: In production with millions of keys, SCAN should be used iteratively.
        // For this scale, keys('*') is acceptable but risky. switching to scan stream is better practice.
        const keys = await redis.keys('shortlink:*');
        if (keys.length > 0) {
            const shortlinks: any = {};
            // Batch get
            if (keys.length > 0) {
                const values = await redis.mget(keys);
                keys.forEach((k, i) => {
                    if (values[i]) {
                        try {
                            shortlinks[k] = JSON.parse(values[i]!);
                        } catch (e) {
                            shortlinks[k] = values[i];
                        }
                    }
                });
            }
            backupData.data.shortlinks = shortlinks;
        }

        // 3. Fetch User Plans/Profiles
        // Heuristic: Scan for user:*
        const userKeys = await redis.keys('user:*');
        if (userKeys.length > 0) {
            const userData: any = {};
            const userValues = await redis.mget(userKeys);
            userKeys.forEach((k, i) => {
                if (userValues[i]) userData[k] = userValues[i];
            });
            backupData.data.users = userData;
        }

        // 4. Encrypt
        const jsonContent = JSON.stringify(backupData);
        const encrypted = encrypt(jsonContent);

        // 5. Stream to Client (Download) instead of FileSystem
        const fileName = `secure_backup_${Date.now()}.enc`;

        // File Format: IV::CONTENT
        const fileContent = `${encrypted.iv}::${encrypted.content}`;

        console.log(`[Backup] Success: Streaming ${fileName} to client`);

        return new NextResponse(fileContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'x-item-count': JSON.stringify({
                    history: Array.isArray(backupData.data.history) ? backupData.data.history.length : 0,
                    shortlinks: keys.length,
                    users: userKeys.length
                })
            }
        });

    } catch (error: any) {
        console.error('[Backup] Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
