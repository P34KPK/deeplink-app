'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

function RedirectContent() {
    const searchParams = useSearchParams();
    const asin = searchParams.get('asin');
    const tag = searchParams.get('tag');
    const domain = searchParams.get('domain') || 'com';

    const [status, setStatus] = useState('Opening Amazon...');

    // Construct URLs
    const webUrl = `https://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}`;
    const encodedWebUrl = encodeURIComponent(webUrl);

    // URI Schemes
    const appUrl = `amzn://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}`;

    // Android Intent (Strict 'amzn' Scheme)
    // We use scheme=amzn (instead of https) so the browser explicitly REJECTS it and hands it to the OS.
    // This forces the Amazon App to open because it's the only one registered for 'amzn'.
    const androidIntent = `intent://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}#Intent;package=com.amazon.mShop.android.shopping;scheme=amzn;end`;

    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        if (!asin) {
            setStatus('Invalid Link');
            return;
        }

        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const android = /android/i.test(userAgent);
        setIsAndroid(android);

        // Track Click
        fetch('/api/track', {
            method: 'POST',
            body: JSON.stringify({ asin, userAgent }),
            headers: { 'Content-Type': 'application/json' },
            keepalive: true
        }).catch(err => console.error('Tracking failed', err));

        const tryOpen = () => {
            if (android) {
                // Strict Android: Intent only. No JS fallback.
                window.location.href = androidIntent;
            } else {
                // iOS / Desktop needs JS fallback
                const start = Date.now();
                window.location.href = appUrl;

                setTimeout(() => {
                    if (Date.now() - start < 3000 && !document.hidden) {
                        window.location.href = webUrl;
                    }
                }, 2500);
            }
        };

        // Delay to ensure page is interactive
        const timer = setTimeout(() => {
            tryOpen();
        }, 500);

        return () => clearTimeout(timer);
    }, [asin, tag, domain, androidIntent, appUrl, webUrl]);

    // Manual Target Logic
    // Android gets the direct Intent. iOS gets the Scheme.
    const manualTarget = isAndroid ? androidIntent : appUrl;

    // Click Handler only needed for iOS fallback. 
    // Android is handled purely by the href={androidIntent} native behavior.
    const handleLinkClick = (e: React.MouseEvent) => {
        if (isAndroid) return;

        // iOS Logic
        // e.preventDefault(); // Let href work
        setTimeout(() => {
            if (!document.hidden) {
                window.location.href = webUrl;
            }
        }, 2500);
    };

    if (!asin) {
        return (
            <div className="text-center p-10 mt-20">
                <h1 className="text-xl text-white">Invalid Link</h1>
                <p className="text-gray-500 mt-2">Missing Product ID.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 space-y-8 animate-fade bg-[#050505]">
            <div className="matte-card p-10 max-w-sm w-full flex flex-col items-center border border-[#222]">
                <div className="relative w-32 h-16 mb-6">
                    <Image
                        src="/logo.png"
                        alt="DeepLinker Logo"
                        fill
                        className="object-contain mix-blend-screen"
                        priority
                    />
                </div>

                <h1 className="text-xl font-semibold mb-2 text-white">{status === 'Opening Amazon...' ? 'Redirecting...' : 'View Product'}</h1>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">
                    Opening Amazon App...
                </p>

                <a
                    href={manualTarget}
                    onClick={handleLinkClick}
                    className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform w-full max-w-xs block select-none cursor-pointer"
                >
                    Open Amazon App
                </a>

                <a
                    href={webUrl}
                    className="mt-6 text-gray-500 text-sm border-b border-gray-700 pb-0.5 hover:text-white hover:border-white transition-colors"
                >
                    Or continue to Website
                </a>
            </div>
        </div>
    );
}

export default function RedirectPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white bg-[#050505]">...</div>}>
            <RedirectContent />
        </Suspense>
    );
}
