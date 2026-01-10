import { cookies } from 'next/headers';

// SECURITY: Move this to .env.local in production!
export const ADMIN_KEY = process.env.ADMIN_KEY;

/**
 * Verifies if the request is authenticated as Admin.
 * Checks: 
 * 1. 'x-admin-key' Header
 * 2. 'deeplink_secure_session' Cookie (Login)
 */
export async function isAdmin(req: Request): Promise<boolean> {
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey) return false; // Fail safe if no key configured

    const headerKey = req.headers.get('x-admin-key');
    if (headerKey === adminKey) return true;

    // Check Secure Session Cookie
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('deeplink_secure_session');
        // In a real app, verify JWT signature here used in /api/auth/login
        if (session && session.value === 'valid_session') return true;
    } catch (e) {
        // Ignore cookie errors
    }

    return false;
}
