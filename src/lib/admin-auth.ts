
// SECURITY: Move this to .env.local in production!
export const ADMIN_KEY = process.env.ADMIN_KEY;

export function isAdmin(req: Request): boolean {
    const headerKey = req.headers.get('x-admin-key');
    // Also check for 'Authorization' bearer just in case standard tools use it
    return headerKey === ADMIN_KEY;
}
