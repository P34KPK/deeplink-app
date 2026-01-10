"use client";

import { useEffect, useState } from "react";
import { Download, Monitor, Share, Smartphone, PlusSquare, X } from "lucide-react";
import Image from "next/image";

export default function InstallAppWidget() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        // Check if already installed/standalone
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsStandalone(true);
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Listen for install prompt (Android/Chrome)
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
        } else if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setInstallPrompt(null);
            }
        } else {
            // Fallback IF for some reason prompt is null but not iOS (e.g. Firefox or disallowed)
            // Or if user dismissed it previously.
            alert("To install, look for the 'Install' icon in your browser address bar or settings.");
        }
    };

    // Don't show if already installed
    if (!isMounted || isStandalone) return null;

    // Only show if we can install (have prompt) OR if it's iOS
    if (!installPrompt && !isIOS) return null;

    return (
        <div className="matte-card p-4 relative overflow-hidden group">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Icon Preview */}
                <div className="relative w-14 h-14 shrink-0 rounded-2xl overflow-hidden shadow-lg border border-border/50">
                    <Image
                        src="/app_icon.png"
                        alt="DeepLinkrs App Icon"
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                    />
                </div>

                <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg mb-1">Get the App</h3>
                    <p className="text-sm text-muted-foreground leading-snug">
                        Install DeepLinkrs on your {isIOS ? 'iPhone or iPad' : 'device'} for instant access.
                    </p>
                </div>

                <div className="shrink-0 mt-3 md:mt-0 w-full md:w-auto">
                    <button
                        onClick={handleInstallClick}
                        className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 py-2 px-4 shadow-md active:scale-95"
                    >
                        {isIOS ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                        <span>{isIOS ? 'Add to Home Screen' : 'Install App'}</span>
                    </button>
                </div>
            </div>

            {/* iOS Instructions Modal/Overlay INSIDE the widget or fixed */}
            {showIOSInstructions && (
                <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 animate-in fade-in zoom-in-95 duration-200">
                    <button
                        onClick={() => setShowIOSInstructions(false)}
                        className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full text-muted-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="space-y-3 max-w-[90%]">
                        <p className="font-medium text-foreground">Tap the Share button</p>
                        <div className="flex justify-center text-blue-500">
                            <Share className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-foreground">Then select <span className="font-bold">"Add to Home Screen"</span></p>
                        <div className="flex justify-center text-foreground">
                            <PlusSquare className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
