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
    const [stats, setStats] = useState<any>(null); // Store global analytics data
    const [loading, setLoading] = useState(true);
    const [expandedStatsId, setExpandedStatsId] = useState<string | null>(null);

    useEffect(() => {
        // Load History
        const saved = localStorage.getItem('deeplink_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse history', e);
            }
        }

        // Load Stats from API
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load stats', err);
                setLoading(false);
            });
    }, []);

    const deleteLink = (id: string) => {
        const newHistory = history.filter(link => link.id !== id);
        setHistory(newHistory);
        localStorage.setItem('deeplink_history', JSON.stringify(newHistory));
    };

    const copyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        alert('Link copied!');
    };

    const toggleStats = (id: string) => {
        setExpandedStatsId(expandedStatsId === id ? null : id);
    };

    // Helper to find stats for a specific ASIN
    const getLinkStats = (asin: string) => {
        if (!stats || !stats.topLinks) return null;
        return stats.topLinks.find((l: any) => l.asin === asin);
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
            <div className="max-w-2xl mx-auto space-y-8 animate-fade">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#222] pb-6">
                    <div>
                        <h1 className="text-2xl font-bold">My Links</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage links and view performance</p>
                    </div>
                    <Link href="/" className="text-sm bg-[#111] hover:bg-[#222] px-4 py-2 rounded-lg border border-[#222] transition-colors">
                        Back to Home
                    </Link>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading history and stats...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-4">No links generated on this device yet.</p>
                        <Link href="/" className="text-white underline">Create your first link</Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => {
                            const linkStats = getLinkStats(item.asin);
                            const totalClicks = linkStats ? linkStats.total || linkStats.count || 0 : 0; // Handle V1/V2 structure

                            return (
                                <div key={item.id} className="matte-card p-4 flex flex-col gap-4 group hover:border-[#333] transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-white">{item.title}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-2">{item.description} &bull; {new Date(item.date).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-600 font-mono truncate">{item.generated}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Stats Toggle Button */}
                                            <button
                                                onClick={() => toggleStats(item.id)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-all ${expandedStatsId === item.id ? 'bg-white text-black border-white' : 'bg-[#111] text-gray-400 border-[#222] hover:text-white'}`}
                                                title="View Stats"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                                {totalClicks}
                                            </button>

                                            <div className="w-px h-6 bg-[#222] mx-1"></div>

                                            <button
                                                onClick={() => copyLink(item.generated)}
                                                className="p-2 text-gray-400 hover:text-white bg-[#111] hover:bg-[#222] rounded-md border border-[#222]"
                                                title="Copy Link"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                            <button
                                                onClick={() => deleteLink(item.id)}
                                                className="p-2 text-red-900 hover:text-red-500 bg-[#111] hover:bg-[#222] rounded-md border border-[#222]"
                                                title="Delete"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                            <Link
                                                href={item.generated.replace(window.location.origin, '')}
                                                className="p-2 text-gray-400 hover:text-white bg-[#111] hover:bg-[#222] rounded-md border border-[#222]"
                                                title="Test Link"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Expanded Stats Panel */}
                                    {expandedStatsId === item.id && (
                                        <div className="mt-2 pt-4 border-t border-[#222] px-1 animate-in slide-in-from-top-2 fade-in duration-300">
                                            {linkStats ? (
                                                <div className="grid grid-cols-3 gap-2 text-center">
                                                    <div className="bg-[#111] rounded p-2 border border-[#222]">
                                                        <span className="block text-xl font-bold text-white mb-1">{linkStats.android || 0}</span>
                                                        <span className="text-[10px] uppercase text-gray-500">Android</span>
                                                    </div>
                                                    <div className="bg-[#111] rounded p-2 border border-[#222]">
                                                        <span className="block text-xl font-bold text-white mb-1">{linkStats.ios || 0}</span>
                                                        <span className="text-[10px] uppercase text-gray-500">iOS</span>
                                                    </div>
                                                    <div className="bg-[#111] rounded p-2 border border-[#222]">
                                                        <span className="block text-xl font-bold text-white mb-1">{linkStats.desktop || 0}</span>
                                                        <span className="text-[10px] uppercase text-gray-500">Desktop</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-2 text-xs text-gray-500">
                                                    No traffic recorded for this specific link yet.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
