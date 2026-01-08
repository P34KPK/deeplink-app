'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function InAppBrowserGuard({ children }: { children: React.ReactNode }) {
    const [isInApp, setIsInApp] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Safe check for pathname - if it's a deep link, DO NOT BLOCK
        if (pathname?.includes('/amzn/') || pathname?.includes('/go/')) return;

        // eslint-disable-next-line
        const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
        // Detect Facebook, Messenger, Instagram, LinkedIn, etc.
        const isFacebook = /FBAN|FBAV/i.test(ua);
        const isInstagram = /Instagram/i.test(ua);
        const isLinkedin = /LinkedIn/i.test(ua);

        // Only block if we truly suspect it will break OAuth (Mainly Google Auth in WebViews)
        if (isFacebook || isInstagram || isLinkedin) {
            requestAnimationFrame(() => setIsInApp(true));
        }
    }, [pathname]);

    if (isInApp) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center animate-fade">
                <div className="matte-card p-10 max-w-sm w-full flex flex-col items-center border border-white/10">
                    <div className="relative w-48 h-24 mb-8">
                        <Image
                            src="/logo.png"
                            alt="DeepLinkrs Logo"
                            fill
                            className="object-contain"
                            style={{ filter: 'brightness(0) invert(1)' }} // White logo
                            priority
                        />
                    </div>

                    <h1 className="text-xl font-bold mb-4 text-white">Browser Action Required</h1>
                    <p className="text-gray-400 mb-8 text-sm">
                        Google Security requires an external browser to sign in.
                    </p>

                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 w-full mb-6">
                        <p className="font-semibold text-sm mb-3 text-white">How to continue:</p>
                        <ol className="text-left text-sm space-y-3 list-decimal pl-4 text-gray-400">
                            <li>Tap the <span className="font-bold text-white">•••</span> or <span className="font-bold text-white">Share</span> icon.</li>
                            <li>Select <span className="font-bold text-white">Open in Browser</span> or <span className="font-bold text-white">Open in System Browser</span>.</li>
                        </ol>
                    </div>

                    <p className="text-xs text-gray-600 mt-4">
                        This protects your account security.
                    </p>

                    <button
                        onClick={() => setIsInApp(false)}
                        className="mt-8 text-xs text-gray-500 hover:text-white underline transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
