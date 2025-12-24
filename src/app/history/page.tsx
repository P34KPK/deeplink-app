'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ArchivedLink = {
    id: string;
    original: string;
    generated: string;
    asin: string;
    title: string;
    description: string;
    date: number;
};

export default function HistoryPage() {
    const [history, setHistory] = useState<ArchivedLink[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('deepLinkHistory');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse history', e);
            }
        }
        setLoading(false);
    }, []);

    const deleteLink = (id: string) => {
        const newHistory = history.filter(link => link.id !== id);
        setHistory(newHistory);
        localStorage.setItem('deepLinkHistory', JSON.stringify(newHistory));
    };

    const copyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        alert('Link copied!');
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
            <div className="max-w-2xl mx-auto space-y-8 animate-fade">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#222] pb-6">
                    <div>
                        <h1 className="text-2xl font-bold">My Links</h1>
                        <p className="text-gray-500 text-sm mt-1">Local history on this device</p>
                    </div>
                    <Link href="/" className="text-sm bg-[#111] hover:bg-[#222] px-4 py-2 rounded-lg border border-[#222] transition-colors">
                        Back to Home
                    </Link>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">No links generated on this device yet.</p>
                        <Link href="/" className="text-white underline">Create your first link</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <div key={item.id} className="matte-card p-5 flex flex-col gap-4">

                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-lg text-white">{item.title}</h3>
                                        <p className="text-sm text-gray-500">{item.description}</p>
                                        <p className="text-xs text-gray-600 mt-1">{new Date(item.date).toLocaleDateString()} &bull; {new Date(item.date).toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                <div className="bg-black/50 p-3 rounded border border-[#222] font-mono text-xs text-green-500 break-all select-all">
                                    {item.generated}
                                </div>

                                <div className="flex gap-3 mt-2">
                                    <button
                                        onClick={() => copyLink(item.generated)}
                                        className="flex-1 bg-white text-black font-bold py-3 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        Copy Link
                                    </button>
                                    <button
                                        onClick={() => deleteLink(item.id)}
                                        className="bg-[#111] text-red-500 border border-[#222] px-4 py-3 rounded-lg hover:bg-red-900/10 transition-colors"
                                        title="Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                    <Link
                                        href={item.generated.replace(window.location.origin, '')}
                                        className="bg-[#111] text-gray-300 border border-[#222] px-4 py-3 rounded-lg hover:bg-[#222] transition-colors flex items-center justify-center"
                                        title="Test Link"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                    </Link>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
