import type { NextConfig } from "next";

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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.google.com https://*.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://img.clerk.com; font-src 'self'; connect-src 'self' https://*.vercel.app https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com https://*.google.com; worker-src 'self' blob:;",
          }
        ],
      },
    ];
  },
};

export default nextConfig;
