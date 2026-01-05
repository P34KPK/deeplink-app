'use client';

import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { WifiOff, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function OfflineStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Initial check
        Network.getStatus().then(status => setIsOnline(status.connected));

        // Listen for changes
        const listener = Network.addListener('networkStatusChange', status => {
            setIsOnline(status.connected);
        });

        return () => {
            listener.then(l => l.remove());
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <WifiOff className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You are offline</h2>
            <p className="text-zinc-400 max-w-md mb-8">
                We can't sync your new links or stats right now. But don't worry, your existing links still redirect for your users!
            </p>

            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 max-w-sm w-full mb-8">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <QrCode className="w-4 h-4 text-pink-500" />
                    Offline Tools
                </h3>
                <p className="text-xs text-zinc-500 mb-4">You can still generate QR codes for links you remember.</p>
                <Link href="/" className="btn-primary w-full text-sm py-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
                    Go to Generator (Limited)
                </Link>
            </div>

            <button
                onClick={() => window.location.reload()}
                className="text-sm text-zinc-500 hover:text-white underline"
            >
                Try to reconnect
            </button>
        </div>
    );
}
