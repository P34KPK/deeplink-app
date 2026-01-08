
'use client';

import { ExternalLink, Copy, QrCode, Download, X, Edit } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';

interface LinkTreeWidgetProps {
    userId: string;
    username?: string;
    className?: string;
    onEditProfile?: () => void;
}

export default function LinkTreeWidget({ userId, username, className, onEditProfile }: LinkTreeWidgetProps) {
    const [showQr, setShowQr] = useState(false);
    const [handle, setHandle] = useState<string | null>(null);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    // Fetch handle
    useEffect(() => {
        if (!userId) return;
        fetch(`/api/public/u/${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data.user?.handle) setHandle(data.user.handle);
            })
            .catch(console.error);
    }, [userId]);

    const displayId = handle || userId;
    const bioUrl = `${origin}/linkinbio/${displayId}`;

    const copyLink = () => {
        navigator.clipboard.writeText(bioUrl);
        alert('Link copied to clipboard!');
    }

    const downloadQr = () => {
        const svg = document.getElementById("bio-qr");
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `qrcode-${username || userId}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = "data:image/svg+xml;base64," + btoa(svgData);
        }
    };

    return (
        <div className={`matte-card p-6 flex flex-col justify-between h-full border-t-4 border-t-pink-500 ${className} relative`}>
            {/* QR Modal Overlay */}
            {showQr && (
                <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 rounded-xl">
                    <button onClick={() => setShowQr(false)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-white font-bold mb-4">Scan to Shop</h3>
                    <div className="bg-white p-4 rounded-xl shadow-2xl mb-6">
                        <QRCode id="bio-qr" value={bioUrl} size={160} />
                    </div>
                    <button onClick={downloadQr} className="btn-primary w-full max-w-[200px] flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> Download PNG
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-500/10 rounded-lg cursor-pointer hover:bg-pink-500/20 transition-colors" onClick={() => setShowQr(true)} title="Show QR Code">
                        <QrCode className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground">My Bio Page</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Public Profile</p>
                    </div>
                </div>
                <div onClick={() => setShowQr(true)} className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:bg-green-500/20 border border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    LIVE
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center my-1 relative group/preview">
                <div className="w-24 h-32 border-2 border-zinc-700 bg-black rounded-lg p-2 flex flex-col gap-2 relative shadow-lg group-hover/preview:border-pink-500/50 transition-colors opacity-50 group-hover/preview:opacity-100 transition-all">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 mx-auto"></div>
                    <div className="h-1.5 w-16 bg-zinc-800 rounded-full mx-auto"></div>
                    <div className="h-1.5 w-12 bg-zinc-800 rounded-full mx-auto mb-1"></div>
                    <div className="h-6 w-full bg-zinc-800/50 rounded flex items-center justify-center text-[6px] text-zinc-500">LINK</div>
                    <div className="h-6 w-full bg-zinc-800/50 rounded flex items-center justify-center text-[6px] text-zinc-500">LINK</div>
                </div>

                {/* Theme Unlock Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity">
                    <button className="bg-black/80 backdrop-blur border border-white/20 text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-xl flex items-center gap-1.5 hover:bg-pink-600 hover:border-pink-500 transition-all transform hover:scale-105">
                        <span className="text-lg">🎨</span> Change Theme
                    </button>
                </div>

                <p className="text-[10px] text-zinc-500 mt-2 font-mono group-hover/preview:opacity-0 transition-opacity">LIVE PREVIEW</p>
            </div>

            <div className="bg-secondary/30 rounded-lg p-3 mb-4 flex items-center justify-between border border-white/5 group hover:border-pink-500/30 transition-colors">
                <code className="text-xs text-muted-foreground truncate flex-1 font-mono pr-2">
                    {origin}/linkinbio/<span className="text-foreground font-bold">{displayId}</span>
                </code>
                <button
                    onClick={copyLink}
                    className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-white transition-colors"
                    title="Copy URL"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto">
                <a
                    href={`/linkinbio/${displayId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 rounded-md text-xs font-bold flex items-center justify-center gap-2 bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-all shadow-sm active:scale-95"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="mt-0.5">View</span>
                </a>
                <button
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({ title: 'My Bio', url: bioUrl });
                        } else {
                            copyLink();
                        }
                    }}
                    className="h-9 rounded-md text-xs font-bold flex items-center justify-center gap-2 bg-gradient-to-b from-pink-500 to-pink-600 border border-pink-400 hover:border-pink-300 text-white shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
                >
                    <span className="mt-0.5">Share</span>
                </button>
            </div>
        </div>
    )
}
