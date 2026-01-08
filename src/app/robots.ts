import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.deeplinkrs.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/dashboard/', '/admin/'], // Protect internal/private routes
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
