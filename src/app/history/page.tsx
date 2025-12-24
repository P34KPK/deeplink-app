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
                            const totalClicks = linkStats ? linkStats.total || linkStats.count || 0 : 0;

                            return (
                                <div key={item.id} className="matte-card p-0 overflow-hidden flex flex-col group hover:border-[#333] transition-colors">

                                    {/* Link Details Section */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-xs text-gray-600 font-mono truncate bg-[#0a0a0a] p-2 rounded border border-[#222] mb-2 select-all">
                                            {item.generated}
                                        </div>
                                    </div>

                                    {/* HIGH CONTRAST TOOLBAR - FOR DEBUGGING */}
                                    <div className="bg-[#111] border-t border-[#222] p-2 flex items-center justify-between">

                                        {/* THE BIG BLUE BUTTON */}
                                        <button
                                            onClick={() => toggleStats(item.id)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase px-4 py-2 rounded shadow-lg flex items-center gap-2"
                                            style={{ border: '2px solid white' }}
                                        >
                                            <span className="text-lg">📊</span>
                                            <span>Stats ({totalClicks})</span>
                                        </button>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => copyLink(item.generated)} className="p-2 bg-[#222] hover:bg-[#333] rounded text-gray-300 text-xs">Copy</button>
                                            <button onClick={() => deleteLink(item.id)} className="p-2 bg-[#222] hover:bg-red-900/50 rounded text-red-400 text-xs">Delete</button>
                                        </div>
                                    </div>

                                    {/* Expanded Stats Panel */}
                                    {expandedStatsId === item.id && (
                                        <div className="bg-black border-t border-[#222] p-4 text-center">
                                            <h4 className="text-gray-400 text-xs uppercase tracking-widest mb-4">Device Breakdown</h4>

                                            {linkStats ? (
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-[#111] p-3 rounded border border-[#333]">
                                                        <div className="text-2xl font-bold text-white">{linkStats.android || 0}</div>
                                                        <div className="text-[10px] text-gray-500 mt-1">ANDROID</div>
                                                    </div>
                                                    <div className="bg-[#111] p-3 rounded border border-[#333]">
                                                        <div className="text-2xl font-bold text-white">{linkStats.ios || 0}</div>
                                                        <div className="text-[10px] text-gray-500 mt-1">IOS</div>
                                                    </div>
                                                    <div className="bg-[#111] p-3 rounded border border-[#333]">
                                                        <div className="text-2xl font-bold text-white">{linkStats.desktop || 0}</div>
                                                        <div className="text-[10px] text-gray-500 mt-1">DESKTOP</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 text-sm">No data recorded yet.</div>
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
