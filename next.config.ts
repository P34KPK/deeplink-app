import type { NextConfig } from "next";
// restart dev server

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            // Allow scripts from 'self' and 'unsafe-inline' (needed for Next.js in some cases) and 'unsafe-eval' (for dev)
            // Ideally, strict CSP is better, but can break apps easily.
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.google.com https://*.gstatic.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://img.clerk.com https://*.stripe.com https://m.media-amazon.com https://images-na.ssl-images-amazon.com; font-src 'self'; connect-src 'self' https://*.vercel.app https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://api.stripe.com; frame-src 'self' https://challenges.cloudflare.com https://*.google.com https://js.stripe.com https://hooks.stripe.com; worker-src 'self' blob:;",
          }
        ],
      },
    ];
  },
};

export default nextConfig;
