"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsStandalone(true);
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

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
            // Try native share sheet first (best UX)
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'DeepLinkrs',
                        text: 'Check out DeepLinkrs - The #1 Amazon Deep Linking Tool',
                        url: window.location.href,
                    });
                    // If share successful/opened, we can show a hint or just let them proceed
                    return;
                } catch (err) {
                    // User cancelled or failed, show manual instructions
                    console.log("Share failed/cancelled", err);
                    setShowIOSInstructions(true);
                }
            } else {
                setShowIOSInstructions(true);
            }
        } else if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setInstallPrompt(null);
            }
        } else {
            alert("To install, look for the 'Install' icon in your browser address bar or settings.");
        }
    };

    if (!isMounted || isStandalone) return null;
    if (!installPrompt && !isIOS) return null;

    return (
        <>
            <div className="matte-card p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="relative w-14 h-14 shrink-0 rounded-2xl overflow-hidden shadow-lg border border-border/50">
                        <Image src="/app_icon.png" alt="DeepLinkrs App Icon" width={56} height={56} className="object-cover w-full h-full" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg mb-1">Get the App</h3>
                        <p className="text-sm text-muted-foreground leading-snug">
                            Install DeepLinkrs on your {isIOS ? 'iPhone or iPad' : 'device'} for instant access.
                        </p>
                    </div>

                    <div className="shrink-0 mt-3 md:mt-0 w-full md:w-auto">
                        <button onClick={handleInstallClick} className="btn-primary w-full md:w-auto flex items-center justify-center gap-2 py-2 px-4 shadow-md active:scale-95">
                            {isIOS ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            <span>{isIOS ? 'Add to Home Screen' : 'Install App'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {showIOSInstructions && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                    onClick={() => setShowIOSInstructions(false)}
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', margin: 0 }}
                >
                    <div
                        className="bg-[#18181b] border border-white/10 p-6 rounded-3xl shadow-2xl max-w-sm w-full relative animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setShowIOSInstructions(false)} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 transition-colors">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center space-y-6 pt-2">
                            <div className="w-20 h-20 bg-black/40 rounded-2xl mx-auto flex items-center justify-center border border-white/5 shadow-inner">
                                <Share className="w-8 h-8 text-blue-500" />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Install for iOS</h3>
                                <p className="text-base text-zinc-400">Tap the <span className="text-blue-500 font-bold">Share</span> button</p>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-4 text-left space-y-4">
                                <div className="flex items-center gap-4 text-white">
                                    <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-blue-600 text-sm font-bold">1</span>
                                    <span>Find the <Share className="w-4 h-4 inline mx-1 text-blue-400 mb-1" /> icon below or at top</span>
                                </div>
                                <div className="flex items-center gap-4 text-white">
                                    <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-blue-600 text-sm font-bold">2</span>
                                    <span>Select <span className="font-bold">"Add to Home Screen"</span></span>
                                </div>
                            </div>

                            <button onClick={() => setShowIOSInstructions(false)} className="w-full py-3.5 bg-white text-black font-bold rounded-xl active:scale-95 transition-transform">Close</button>
                        </div>
                    </div>

                    {/* Bouncing Arrow Pointing to Bottom Browser Bar */}
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white flex flex-col items-center animate-bounce z-[10000] pointer-events-none">
                        <span className="text-sm font-medium mb-2 drop-shadow-md">Tap here</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 drop-shadow-md"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
