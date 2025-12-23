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
        <main className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
            {/* Matrix/Code Background Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="flex items-center justify-between mb-8 animate-in slide-in-from-top-10 fade-in duration-700">
                    <h1 className="text-2xl font-bold font-mono border-l-4 border-green-500 pl-4 tracking-tighter">
                        <span className="text-green-500">&gt;</span> SYSTEM_DASHBOARD
                    </h1>
                    <Link href="/" className="text-xs font-mono text-green-700 hover:text-green-500 transition-colors">
                        [EXIT_TERMINAL]
                    </Link>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="matte-card p-6 border border-[#222] animate-in zoom-in-95 fade-in duration-700 delay-100 relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500/20 group-hover:bg-green-500 transition-colors duration-500"></div>
                        <h3 className="text-[10px] text-green-500/70 font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Total_Interactions
                        </h3>
                        <div className="text-4xl font-bold text-white font-mono tabular-nums">
                            {stats.totalClicks.toString().padStart(4, '0')}
                        </div>
                    </div>

                    <div className="matte-card p-6 border border-[#222] col-span-2 animate-in zoom-in-95 fade-in duration-700 delay-200 relative overflow-hidden">
                        <h3 className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-4">Device_Fingerprinting</h3>
                        <div className="grid grid-cols-4 gap-4 text-center">
                            {Object.entries(stats.devices).map(([device, count], i) => (
                                <div key={device} className="group cursor-default">
                                    <div className="text-2xl font-semibold mb-1 font-mono text-gray-300 group-hover:text-green-400 transition-colors">
                                        {count}
                                    </div>
                                    <div className="text-[10px] text-gray-600 uppercase font-mono">{device}</div>
                                </div>
                            ))}
                        </div>

                        {/* Progress Bar with data effect */}
                        <div className="mt-6 flex h-1 w-full bg-[#111] overflow-hidden">
                            <div style={{ width: `${(stats.devices.android / (stats.totalClicks || 1)) * 100}%` }} className="bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.5)]" />
                            <div style={{ width: `${(stats.devices.ios / (stats.totalClicks || 1)) * 100}%` }} className="bg-white/20" />
                            <div style={{ width: `${(stats.devices.desktop / (stats.totalClicks || 1)) * 100}%` }} className="bg-white/10" />
                        </div>
                    </div>
                </div>

                {/* Top Links Table */}
                <div className="matte-card px-6 py-6 border border-[#222] animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300">
                    <h3 className="text-sm font-mono text-gray-400 mb-6 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        DATA_LOGS :: TOP_TARGETS
                    </h3>

                    {stats.topLinks.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-[#222] rounded bg-black/50">
                            <p className="text-green-900 font-mono text-xs typing-effect">WAITING_FOR_INCOMING_TRAFFIC...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">
                                    <tr>
                                        <th className="pb-3 pl-2 font-normal"># ID</th>
                                        <th className="pb-3 font-normal">Target_ASIN</th>
                                        <th className="pb-3 text-right pr-2 font-normal">Hits</th>
                                        <th className="pb-3 w-20"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-mono">
                                    {stats.topLinks.map((link, index) => (
                                        <tr key={link.asin} className="border-b border-[#222]/30 last:border-0 hover:bg-[#111] transition-colors group">
                                            <td className="py-3 pl-2 text-gray-600">{String(index + 1).padStart(2, '0')}</td>
                                            <td className="py-3 text-green-500/80 group-hover:text-green-400 transition-colors">{link.asin}</td>
                                            <td className="py-3 pr-2 text-right text-gray-300">{link.count}</td>
                                            <td className="py-3 text-right">
                                                <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
                                                    <div style={{ width: `${Math.min((link.count / (stats.topLinks[0].count || 1)) * 100, 100)}%` }} className="h-full bg-green-900 group-hover:bg-green-600 transition-all duration-500"></div>
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
