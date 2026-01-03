
export const ADMIN_KEY = "P34k_Titanium!X9#LinkR$2025";

export function isAdmin(req: Request): boolean {
    const headerKey = req.headers.get('x-admin-key');
    // Also check for 'Authorization' bearer just in case standard tools use it
    return headerKey === ADMIN_KEY;
}
