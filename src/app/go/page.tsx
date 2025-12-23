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
    const appUrl = `amzn://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}`;
    const androidIntent = `intent://www.amazon.${domain}/dp/${asin}${tag ? `?tag=${tag}` : ''}#Intent;package=com.amazon.mShop.android.shopping;scheme=https;end`;

    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        if (!asin) {
            setStatus('Invalid Link');
            return;
        }

        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        const android = /android/i.test(userAgent);
        setIsAndroid(android);

        const tryOpen = () => {
            const start = Date.now();

            if (android) {
                window.location.href = androidIntent;
            } else {
                window.location.href = appUrl;
            }

            setTimeout(() => {
                if (Date.now() - start < 2000) {
                    setStatus('Tap below to open');
                }
            }, 1500);
        };

        const timer = setTimeout(() => {
            tryOpen();
        }, 500);

        return () => clearTimeout(timer);
    }, [asin, tag, domain, androidIntent, appUrl]);

    const handleManualClick = () => {
        if (isAndroid) {
            window.location.href = androidIntent;
        } else {
            window.location.href = appUrl;
        }

        setTimeout(() => {
            window.location.href = webUrl;
        }, 500);
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
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 border border-[#222]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white">
                        <path d="M15.903 16.86a4.5 4.5 0 0 1-2.458.74c-1.806 0-3.35-1.05-3.35-2.28 0-1.22 1.544-2.27 3.35-2.27 1.805 0 3.35 1.05 3.35 2.27 0 .3-.095.59-.267.85l-.625-.31zM22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10z" />
                    </svg>
                </div>

                <h1 className="text-xl font-semibold mb-2 text-white">{status === 'Opening Amazon...' ? 'Redirecting...' : 'View Product'}</h1>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">
                    Opening Amazon App...
                </p>

                <button
                    onClick={handleManualClick}
                    className="btn-primary w-full"
                >
                    Open App
                </button>

                <a href={webUrl} className="mt-6 text-xs text-gray-600 hover:text-gray-400 transition-colors">
                    Continue in Browser
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
