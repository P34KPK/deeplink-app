import { cookies } from 'next/headers';

// SECURITY: Move this to .env.local in production!
export const ADMIN_KEY = process.env.ADMIN_KEY || "P34k_Titanium!X9#LinkR$2025";

/**
 * Verifies if the request is authenticated as Admin.
 * Checks: 
 * 1. 'x-admin-key' Header
 * 2. 'admin_token' Cookie (HttpOnly)
 */
export async function isAdmin(req: Request): Promise<boolean> {
    const headerKey = req.headers.get('x-admin-key');

    if (headerKey === ADMIN_KEY) return true;

    // Check Cookie
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token');
        if (token && token.value === ADMIN_KEY) return true;
    } catch (e) {
        // Ignore cookie errors in non-standard contexts
    }

    return false;
}
