'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function RedirectContent() {
    const searchParams = useSearchParams();
    const asin = searchParams.get('asin');
    const tag = searchParams.get('tag');
    const domain = searchParams.get('domain') || 'com';

    const [status, setStatus] = useState('Opening Amazon...');

    // Construct URLs
    const webUrl = `https://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}`;

    // URI Schemes
    // iOS/General fallback
    const appUrl = `amzn://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}`;

    // Android Intent (Fallback to browser if app not installed)
    const androidIntent = `intent://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}#Intent;package=com.amazon.mShop.android.shopping;scheme=https;end`;

    useEffect(() => {
        if (!asin) {
            setStatus('Invalid Link Parameters');
            return;
        }

        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const isAndroid = /android/i.test(userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

        // Auto-redirect logic
        const tryOpen = () => {
            const start = Date.now();

            if (isAndroid) {
                window.location.href = androidIntent;
            } else {
                // Try simple scheme
                window.location.href = appUrl;
            }

            // Fallback check
            setTimeout(() => {
                if (Date.now() - start < 2000) {
                    // If we are still here (page didn't hide/change), show button or redirect web
                    // We won't auto web redirect to keep the user ability to click 'Open App' again
                    // unless we are sure they don't have the app.
                    setStatus('Tap below to open');
                }
            }, 1500);
        };

        // Delay slightly to render UI
        const timer = setTimeout(() => {
            tryOpen();
        }, 500);

        return () => clearTimeout(timer);
    }, [asin, tag, domain, androidIntent, appUrl]);

    const handleManualClick = () => {
        window.location.href = appUrl; // Try app first
        setTimeout(() => {
            window.location.href = webUrl; // Fallback to web
        }, 500);
    };

    if (!asin) {
        return (
            <div className="text-center p-10">
                <h1 className="text-2xl text-red-400">Invalid Link Code</h1>
                <p className="text-gray-400">Missing ASIN.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 space-y-8 animate-entrance">
            <div className="glass-card p-10 max-w-md w-full flex flex-col items-center">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                    {/* Amazon-ish Icon purely CSS/SVG */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5c-2.5 0-4.71-1.28-6-3.22.03-.09.11-.16.21-.16l.8-.02c.18 0 .34.11.41.27 1.05 2.11 3.53 2.63 4.58 2.63 2.15 0 3.73-1.09 3.73-2.6 0-1.63-1.89-2.16-4.08-2.16-1.07 0-2.32.22-3.14.58l-.66-3.13c2.41-.75 5.56-.83 6.94-.83 2.76 0 4.63 1.48 4.63 3.99 0 3.19-2.9 4.65-7.42 4.65z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold mb-2">{status === 'Opening Amazon...' ? 'Opening App...' : 'View Product'}</h1>
                <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                    Redirecting you to Amazon...
                </p>

                <button
                    onClick={handleManualClick}
                    className="btn-primary w-full text-lg shadow-xl shadow-purple-900/40"
                >
                    Open in Amazon App
                </button>

                <a href={webUrl} className="mt-6 text-sm text-gray-500 underline hover:text-white transition-colors">
                    Continue to Browser instead
                </a>
            </div>
        </div>
    );
}

export default function RedirectPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
            <RedirectContent />
        </Suspense>
    );
}
