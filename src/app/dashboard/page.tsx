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
            <div className="max-w-4xl mx-auto space-y-8 animate-fade">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#222] pb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Analytics</h1>
                        <p className="text-gray-500 text-sm mt-1">Real-time performance stats</p>
                    </div>
                    <Link href="/" className="text-sm bg-[#111] hover:bg-[#222] px-4 py-2 rounded-lg border border-[#222] transition-colors text-gray-300">
                        Back to Home
                    </Link>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Clicks Card */}
                    <div className="matte-card p-6 flex flex-col justify-between h-full">
                        <h3 className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-2">Total Clicks</h3>
                        <div className="text-4xl font-bold text-white leading-tight">
                            {stats.totalClicks.toLocaleString()}
                        </div>
                    </div>

                    {/* Devices Breakdown Card */}
                    <div className="matte-card p-6 col-span-2">
                        <h3 className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-6">Device Breakdown</h3>

                        <div className="grid grid-cols-4 gap-4 text-center">
                            {Object.entries(stats.devices).map(([device, count]) => (
                                <div key={device} className="flex flex-col items-center">
                                    <span className="text-2xl font-bold text-white mb-1">{count}</span>
                                    <span className="text-xs text-gray-500 uppercase">{device}</span>
                                </div>
                            ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-8 flex h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
                            <div style={{ width: `${(stats.devices.android / (stats.totalClicks || 1)) * 100}%` }} className="bg-white" title="Android" />
                            <div style={{ width: `${(stats.devices.ios / (stats.totalClicks || 1)) * 100}%` }} className="bg-gray-500" title="iOS" />
                            <div style={{ width: `${(stats.devices.desktop / (stats.totalClicks || 1)) * 100}%` }} className="bg-gray-700" title="Desktop" />
                            <div style={{ width: `${(stats.devices.other / (stats.totalClicks || 1)) * 100}%` }} className="bg-gray-800" title="Other" />
                        </div>
                    </div>
                </div>

                {/* Top Links Table */}
                <div className="matte-card p-0 overflow-hidden">
                    <div className="p-6 border-b border-[#222]">
                        <h3 className="text-lg font-semibold text-white">Top Performing Links</h3>
                    </div>

                    {stats.topLinks.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No click data available yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#0a0a0a] text-xs text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Rank</th>
                                        <th className="px-6 py-4 font-medium">Product ASIN</th>
                                        <th className="px-6 py-4 font-medium text-right">Total Hits</th>
                                        <th className="px-6 py-4 w-1/3">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-[#222]">
                                    {stats.topLinks.map((link, index) => (
                                        <tr key={link.asin} className="hover:bg-[#111] transition-colors">
                                            <td className="px-6 py-4 text-gray-500 font-medium">#{index + 1}</td>
                                            <td className="px-6 py-4 text-white font-mono text-xs">{link.asin}</td>
                                            <td className="px-6 py-4 text-right text-gray-300 font-semibold">{link.count}</td>
                                            <td className="px-6 py-4">
                                                <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        style={{ width: `${Math.min((link.count / (stats.topLinks[0].count || 1)) * 100, 100)}%` }}
                                                        className="h-full bg-white transition-all duration-500"
                                                    ></div>
                                                </div>
                                            </td>
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
