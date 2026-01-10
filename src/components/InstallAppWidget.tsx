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

            {/* iOS Instructions Modal/Overlay - Fixed to screen for better visibility */}
            {showIOSInstructions && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowIOSInstructions(false)}>
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative mb-8 md:mb-0" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setShowIOSInstructions(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center space-y-4 pt-2">
                            <div className="w-16 h-16 bg-zinc-800 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                                <Share className="w-8 h-8 text-blue-500" />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Install for iOS</h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    To install this app, tap the <span className="text-blue-400 font-bold">Share</span> button in your browser menu bar.
                                </p>
                            </div>

                            <div className="bg-black/40 rounded-lg p-4 text-left space-y-3">
                                <div className="flex items-center gap-3 text-zinc-300 text-sm">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-bold">1</span>
                                    <span>Tap the <Share className="w-4 h-4 inline mx-1 text-blue-500" /> Share icon</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-300 text-sm">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-bold">2</span>
                                    <span>Scroll down and select <br /><span className="font-bold text-white">"Add to Home Screen"</span> <PlusSquare className="w-4 h-4 inline mx-1" /></span>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowIOSInstructions(false)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors mt-2"
                            >
                                Got it
                            </button>
                        </div>

                        {/* Pointing Arrow Animation for bottom bar */}
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white animate-bounce md:hidden">
                            ⬇
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
