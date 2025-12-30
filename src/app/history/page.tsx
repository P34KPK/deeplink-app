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
        fetch('/api/links')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setHistory(data);
                }
            })
            .catch(err => console.error('Failed to parse history', err));

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

    const deleteLink = async (id: string) => {
        try {
            const res = await fetch(`/api/links?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                const updatedHistory = await res.json();
                setHistory(updatedHistory);
            }
        } catch (e) {
            console.error('Failed to delete link', e);
        }
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
                                    <div className="p-4 pb-2">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                                            <span className="text-[10px] text-gray-500 whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{item.description}</p>
                                        <div className="text-xs text-gray-600 font-mono truncate bg-[#0a0a0a] p-2 rounded border border-[#222] mb-2 select-all">
                                            {item.generated}
                                        </div>
                                    </div>

                                    {/* Action Toolbar */}
                                    <div className="bg-[#111] px-4 py-2 border-t border-[#222] flex items-center justify-between">

                                        {/* Stats Button */}
                                        <button
                                            onClick={() => toggleStats(item.id)}
                                            className={`flex items-center gap-2 text-xs font-medium transition-colors ${expandedStatsId === item.id ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                                            title="View Analytics"
                                        >
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#222] border border-[#333] group-hover:border-gray-600 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                                <span>Stats ({totalClicks})</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`ml-1 transition-transform ${expandedStatsId === item.id ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </div>
                                        </button>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => copyLink(item.generated)}
                                                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-[#222] transition-colors"
                                                title="Copy Link"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 0 0 1 2-2h9a2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                            <button
                                                onClick={() => deleteLink(item.id)}
                                                className="p-1.5 text-red-900 hover:text-red-500 rounded hover:bg-[#222] transition-colors"
                                                title="Delete"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
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
