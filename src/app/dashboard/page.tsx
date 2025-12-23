'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Stats = {
    totalClicks: number;
    devices: {
        android: number;
        ios: number;
        desktop: number;
        other: number;
    };
    topLinks: { asin: string; count: number }[];
};

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">Loading stats...</div>;
    }

    if (!stats) {
        return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">Failed to load stats.</div>;
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto animate-fade">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                    <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">
                        &larr; Back to Generator
                    </Link>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="matte-card p-6 border border-[#222]">
                        <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">Total Clicks</h3>
                        <div className="text-4xl font-bold text-white">{stats.totalClicks}</div>
                    </div>

                    <div className="matte-card p-6 border border-[#222] col-span-2">
                        <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4">Device Breakdown</h3>
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-semibold mb-1">{stats.devices.android}</div>
                                <div className="text-xs text-gray-500">Android</div>
                            </div>
                            <div>
                                <div className="text-2xl font-semibold mb-1">{stats.devices.ios}</div>
                                <div className="text-xs text-gray-500">iOS</div>
                            </div>
                            <div>
                                <div className="text-2xl font-semibold mb-1">{stats.devices.desktop}</div>
                                <div className="text-xs text-gray-500">Desktop</div>
                            </div>
                            <div>
                                <div className="text-2xl font-semibold mb-1">{stats.devices.other}</div>
                                <div className="text-xs text-gray-500">Other</div>
                            </div>
                        </div>

                        {/* Simple Bar Visualization */}
                        <div className="mt-4 flex h-2 rounded-full overflow-hidden w-full bg-[#111]">
                            <div style={{ width: `${(stats.devices.android / (stats.totalClicks || 1)) * 100}%` }} className="bg-green-500/50" />
                            <div style={{ width: `${(stats.devices.ios / (stats.totalClicks || 1)) * 100}%` }} className="bg-blue-500/50" />
                            <div style={{ width: `${(stats.devices.desktop / (stats.totalClicks || 1)) * 100}%` }} className="bg-gray-500/50" />
                        </div>
                    </div>
                </div>

                {/* Top Links Table */}
                <div className="matte-card px-6 py-6 border border-[#222]">
                    <h3 className="text-lg font-medium mb-6">Top Performing Products (ASIN)</h3>

                    {stats.topLinks.length === 0 ? (
                        <p className="text-gray-500 text-sm">No clicks recorded yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs text-gray-500 uppercase border-b border-[#222]">
                                    <tr>
                                        <th className="pb-3 pl-2">Rank</th>
                                        <th className="pb-3">Product ASIN</th>
                                        <th className="pb-3 text-right pr-2">Clicks</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {stats.topLinks.map((link, index) => (
                                        <tr key={link.asin} className="border-b border-[#222]/50 last:border-0 hover:bg-[#111] transition-colors">
                                            <td className="py-3 pl-2 text-gray-500 font-mono">#{index + 1}</td>
                                            <td className="py-3 font-mono text-gray-300">{link.asin}</td>
                                            <td className="py-3 pr-2 text-right font-semibold">{link.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
