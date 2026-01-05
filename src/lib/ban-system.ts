import { redis } from '@/lib/redis';

export async function banUser(identifier: string) {
    if (!redis || !identifier) return;
    // Add to banned set
    await redis.sadd('system:banned_users', identifier);
}

export async function unbanUser(identifier: string) {
    if (!redis || !identifier) return;
    await redis.srem('system:banned_users', identifier);
}

export async function isBanned(identifier: string): Promise<boolean> {
    if (!redis || !identifier) return false;
    const result = await redis.sismember('system:banned_users', identifier);
    return result === 1;
}
