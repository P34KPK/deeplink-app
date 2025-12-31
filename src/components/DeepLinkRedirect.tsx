'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface DeepLinkRedirectProps {
    asin: string;
    tag?: string | null;
    domain?: string | null;
    slug: string;
}

export default function DeepLinkRedirect({ asin, tag, domain = 'com', slug }: DeepLinkRedirectProps) {
    const [status, setStatus] = useState('Opening Amazon...');
    const [isAndroid, setIsAndroid] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    // Construct URLs
    const webUrl = `https://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}`;
    const encodedWebUrl = encodeURIComponent(webUrl);

    // URI Schemes
    // Standard App Scheme
    const appUrl = `amzn://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}`;

    // Android Intent
    // Note: We remove the browser_fallback_url to prevent auto-fallback to browser if we want to force app.
    // However, intents usually need a fallback. Keeping it but relying on Logic to prefer app.
    const androidIntent = `intent://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}#Intent;package=com.amazon.mShop.android.shopping;scheme=https;S.browser_fallback_url=${encodedWebUrl};end`;

    useEffect(() => {
        if (!asin) return;

        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const android = /android/i.test(userAgent);
        const ios = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

        setIsAndroid(android);
        setIsIOS(ios);

        // Track Click (Background)
        fetch('/api/track', {
            method: 'POST',
            body: JSON.stringify({ asin, userAgent, slug }),
            headers: { 'Content-Type': 'application/json' },
            keepalive: true
        }).catch(err => console.error('Tracking failed', err));

        // Aggressive Auto-Redirect (APP ONLY on Mobile)
        const tryOpen = () => {
            if (android) {
                window.location.href = androidIntent;
            } else if (ios) {
                // Try App Scheme
                window.location.replace(appUrl);

                // FALLBACK: If app doesn't open within 2.5s, go to web
                // Note: If app opens, the browser enters background and this timer usually pauses
                // But modern iOS might behave differently. 
                // The "Continue to Website" button is the safest backup, but auto-fallback helps.
                setTimeout(() => {
                    // Check if page is still visible (user didn't leave)
                    if (!document.hidden) {
                        window.location.href = webUrl;
                    }
                }, 2500);

            } else {
                // Desktop
                window.location.replace(webUrl);
            }
        };

        // Fire immediately
        tryOpen();

    }, [asin, tag, domain, androidIntent, appUrl, webUrl, slug]);

    const handleManualClick = () => {
        if (isAndroid) {
            window.location.href = androidIntent;
        } else if (isIOS) {
            window.location.href = appUrl;
            setTimeout(() => { window.location.href = webUrl; }, 2000); // Manual fallback too
        } else {
            window.location.href = webUrl;
        }
    };

    if (!asin) {
        return (
            <div className="text-center p-10 mt-20">
                <h1 className="text-xl text-foreground">Invalid Link</h1>
                <p className="text-muted-foreground mt-2">Missing Product ID.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 space-y-8 animate-fade bg-background text-foreground">
            <div className="matte-card p-10 max-w-sm w-full flex flex-col items-center">
                <div className="relative w-32 h-16 mb-6">
                    {/* Dynamic Logo Strategy */}
                    <Image
                        src="/logo.png"
                        alt="DeepLinkrs Logo"
                        fill
                        className="object-contain logo-dynamic"
                        priority
                    />
                </div>

                <h1 className="text-xl font-semibold mb-2 text-white">{status === 'Opening Amazon...' ? 'Redirecting...' : 'View Product'}</h1>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">
                    Opening Amazon App...
                </p>

                <button
                    onClick={handleManualClick}
                    className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform w-full max-w-xs"
                >
                    Open Amazon App
                </button>

                <a href={webUrl} className="mt-6 text-gray-500 text-sm border-b border-gray-700 pb-0.5 hover:text-white hover:border-white transition-colors">
                    Or continue to Website
                </a>
            </div>
        </div>
    );
}
