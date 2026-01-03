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
    // Intelligent Geo-Redirect (Agent B)
    const [effectiveDomain, setEffectiveDomain] = useState(domain || 'com');
    const [flag, setFlag] = useState('🇺🇸'); // Default US
    const [isAndroid, setIsAndroid] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    const getLocalAmazonDomain = () => {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz.includes('Europe/London')) return { d: 'co.uk', f: '🇬🇧' };
            if (tz.includes('Europe/Berlin')) return { d: 'de', f: '🇩🇪' };
            if (tz.includes('Europe/Paris')) return { d: 'fr', f: '🇫🇷' };
            if (tz.includes('Europe/Rome')) return { d: 'it', f: '🇮🇹' };
            if (tz.includes('Europe/Madrid')) return { d: 'es', f: '🇪🇸' };
            if (tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver') || tz.startsWith('America/Montreal') || tz.includes('Canada')) return { d: 'ca', f: '🇨🇦' };
            if (tz.startsWith('Australia')) return { d: 'com.au', f: '🇦🇺' };
            if (tz.startsWith('Asia/Tokyo')) return { d: 'co.jp', f: '🇯🇵' };
            // Default to provided domain (usually .com)
            return { d: domain || 'com', f: '🇺🇸' };
        } catch (e) {
            return { d: domain || 'com', f: '🇺🇸' };
        }
    };

    // Construct URLs using Effective Domain
    const webUrl = `https://www.amazon.${effectiveDomain}/dp/${asin}${tag ? `?tag=${tag}` : ''}`;
    const encodedWebUrl = encodeURIComponent(webUrl);

    // URI Schemes
    const appUrl = `com.amazon.mobile.shopping.web://www.amazon.${effectiveDomain}/dp/${asin}${tag ? `?tag=${tag}` : ''}`;

    // Android Intent
    const androidIntent = `intent://www.amazon.${effectiveDomain}/dp/${asin}${tag ? `?tag=${tag}` : ''}#Intent;package=com.amazon.mShop.android.shopping;scheme=https;S.browser_fallback_url=${encodedWebUrl};end`;

    useEffect(() => {
        if (!asin) return;

        // 1. Detect Environment
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const android = /android/i.test(userAgent);
        const ios = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

        setIsAndroid(android);
        setIsIOS(ios);

        // 2. Detect Country (Geo-Redirect)
        const { d, f } = getLocalAmazonDomain();
        setEffectiveDomain(d);
        setFlag(f);

        // Note: URLs (webUrl, appUrl) will update on next render when string state changes.
        // We trigger the redirect logic ONLY after domain is settled or if we want to proceed immediately.
        // To be safe, we let the state update first, then this effect re-runs? 
        // No, we need a separate effect or just check if effectiveDomain matches detection.
        // Actually, for speed, let's use the local 'd' variable for the Initial Redirect if we want it instant.
        // But to keep it React-clean, we'll let the re-render handle the updated URLs.

    }, [asin]); // Run once on mount to detect

    // 3. Trigger Redirect when URLs correspond to the effective domain
    useEffect(() => {
        if (!asin) return;

        const performRedirect = () => {
            // Track Click (Background) - Send only once? We might send duplicates if re-rendering. 
            // Ideally tracking should be in the mount effect. Moving it back there is safer?
            // Actually, tracking the *final* destination is better.

            if (isAndroid) {
                window.location.href = androidIntent;
            } else if (isIOS && effectiveDomain !== 'pending') { // Wait for detection?
                window.location.replace(appUrl);
                setTimeout(() => {
                    if (!document.hidden) window.location.href = webUrl;
                }, 2500);
            } else {
                // Desktop
                window.location.replace(webUrl);
            }
        };

        // Small delay to allow UI to show "Redirecting to Canada..."
        const timer = setTimeout(() => {
            performRedirect();
        }, 800); // 800ms delay for user to see the "Smart" action

        return () => clearTimeout(timer);

    }, [effectiveDomain, androidIntent, appUrl, webUrl, isAndroid, isIOS, asin]);

    // Legacy tracking (moved to mount to avoid double-count, or keep here?)
    // Let's keep tracking separate to avoid duplicate counts during re-renders.
    useEffect(() => {
        if (asin) {
            fetch('/api/track', {
                method: 'POST',
                body: JSON.stringify({ asin, userAgent: navigator.userAgent, slug }),
                headers: { 'Content-Type': 'application/json' },
                keepalive: true
            }).catch(err => console.error('Tracking failed', err));
        }
    }, [asin, slug]);

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

                <h1 className="text-xl font-semibold mb-2 text-foreground">Redirecting to {flag}...</h1>
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
