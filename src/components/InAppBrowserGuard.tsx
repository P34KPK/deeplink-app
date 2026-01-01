'use client';

import { useEffect, useState } from 'react';

export default function InAppBrowserGuard({ children }: { children: React.ReactNode }) {
    const [isInApp, setIsInApp] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
        // Detect Facebook, Messenger, Instagram, LinkedIn, etc.
        // FBAN/FBAV = Facebook/Messenger
        // Instagram = Instagram
        // Line, Twitter, etc. often have similar issues with Google OAuth.
        const isFacebook = /FBAN|FBAV/i.test(ua);
        const isInstagram = /Instagram/i.test(ua);
        const isLinkedin = /LinkedIn/i.test(ua);

        // Only block if we truly suspect it will break OAuth (Mainly Google Auth in WebViews)
        if (isFacebook || isInstagram || isLinkedin) {
            setIsInApp(true);
        }
    }, []);

    if (isInApp) {
        return (
            <div className="fixed inset-0 z-[9999] bg-background text-foreground flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </div>
                <h1 className="text-2xl font-bold mb-4">Browser Action Required</h1>
                <p className="text-muted-foreground mb-8 max-w-sm">
                    Google Security prevents signing in from inside this app (Messenger/Instagram/Facebook).
                </p>
                <div className="bg-secondary/50 p-6 rounded-xl border border-border max-w-sm w-full">
                    <p className="font-semibold text-sm mb-2">How to continue:</p>
                    <ol className="text-left text-sm space-y-3 list-decimal pl-4 text-muted-foreground">
                        <li>Tap the <span className="font-bold text-foreground">•••</span> or <span className="font-bold text-foreground">Share</span> icon (usually top right or bottom).</li>
                        <li>Select <span className="font-bold text-foreground">Open in Browser</span> or <span className="font-bold text-foreground">Open in Safari/Chrome</span>.</li>
                    </ol>
                </div>
                <button
                    onClick={() => setIsInApp(false)}
                    className="mt-8 text-xs text-muted-foreground hover:text-foreground underline"
                >
                    I understand, let me try anyway
                </button>
            </div>
        );
    }

    return <>{children}</>;
}
