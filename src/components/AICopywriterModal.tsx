'use client';

import { useState } from 'react';
import { Sparkles, Copy, RefreshCw, X } from 'lucide-react';

interface AICopywriterModalProps {
    title: string;
    link: string;
    onClose: () => void;
}

export default function AICopywriterModal({ title, link, onClose }: AICopywriterModalProps) {
    const [loading, setLoading] = useState(false);
    const [captions, setCaptions] = useState<string[]>([]);

    const generateCaptions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai/generate-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: title, context: 'Amazon Affiliate Product Promotion' })
            });
            const data = await res.json();
            if (data.captions) {
                setCaptions(data.captions);
            }
        } catch (error) {
            console.error('Failed to generate captions', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate on mount? No, let user click "Magic".
    // Actually, auto-generate is smoother.
    useState(() => {
        generateCaptions();
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Caption copied!');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                        <h2 className="text-lg font-bold text-white">AI Caption Generator</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="space-y-4">
                            <div className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
                            <div className="h-24 bg-white/5 rounded-xl animate-pulse delay-100"></div>
                            <div className="h-24 bg-white/5 rounded-xl animate-pulse delay-200"></div>
                        </div>
                    ) : (
                        captions.map((cap, idx) => (
                            <div key={idx} className="bg-zinc-950 border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition-colors group relative">
                                <p className="text-sm text-zinc-300 whitespace-pre-line">{cap}</p>
                                <button
                                    onClick={() => copyToClipboard(cap)}
                                    className="absolute top-2 right-2 p-2 bg-zinc-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600 hover:text-white text-zinc-400"
                                    title="Copy"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-zinc-950 flex justify-end">
                    <button
                        onClick={generateCaptions}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Regenerate
                    </button>
                </div>
            </div>
        </div>
    );
}
