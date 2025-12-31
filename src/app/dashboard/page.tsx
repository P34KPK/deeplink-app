'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

type Stats = {
    totalClicks: number;
    globalLastClick: number;
    devices: {
        android: number;
        ios: number;
        desktop: number;
        other: number;
    };
    dailyClicks: Record<string, number>;
    statsBySlug: Record<string, number>;
    topLinks: {
        asin: string;
        total: number;
        android: number;
        ios: number;
        desktop: number;
        lastClick: number;
    }[];
};

type ArchivedLink = {
    id: string;
    asin: string;
    title: string;
};

// Colors for Pie Chart
const COLORS = ['#FFFFFF', '#666666', '#333333', '#999999'];

import { useAuth } from "@clerk/nextjs";
// ... imports

export default function Dashboard() {
    const { isSignedIn, isLoaded } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [history, setHistory] = useState<ArchivedLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgradeRequired, setUpgradeRequired] = useState(false);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        const fetchData = async () => {
            try {
                // Fetch Stats and Link History in parallel
                const [statsRes, historyRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/links')
                ]);

                if (statsRes.status === 403) {
                    setUpgradeRequired(true);
                    setLoading(false);
                    return;
                }

                if (!statsRes.ok) throw new Error("Failed to fetch stats");
                if (!historyRes.ok) throw new Error("Failed to fetch links");

                const statsData = await statsRes.json();
                const historyData = await historyRes.json();

                setStats(statsData);
                if (Array.isArray(historyData)) {
                    setHistory(historyData);
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isLoaded, isSignedIn]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground animate-pulse">Loading analytics...</div>;
    }

    if (upgradeRequired) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
                <div className="matte-card p-10 max-w-2xl w-full text-center border-primary/20 bg-gradient-to-br from-background to-secondary/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500"></div>

                    <div className="mb-6 flex justify-center">
                        <div className="bg-primary/10 p-4 rounded-full">
                            <BarChart3 className="w-12 h-12 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold mb-4">Unlock Professional Analytics</h1>
                    <p className="text-muted-foreground mb-8 text-lg">
                        Gain deep insights into your audience with real-time tracking, device breakdown, and unlimited history.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
                        <div className="p-4 rounded bg-secondary/50 border border-border">
                            <span className="block text-primary font-bold mb-1">Unlimited Links</span>
                            <span className="text-xs text-muted-foreground">Remove the 20-link limit.</span>
                        </div>
                        <div className="p-4 rounded bg-secondary/50 border border-border">
                            <span className="block text-primary font-bold mb-1">Full History</span>
                            <span className="text-xs text-muted-foreground">Access your entire archive.</span>
                        </div>
                        <div className="p-4 rounded bg-secondary/50 border border-border">
                            <span className="block text-primary font-bold mb-1">Device Stats</span>
                            <span className="text-xs text-muted-foreground">Know where clicks come from.</span>
                        </div>
                    </div>

                    <button className="btn-primary w-full md:w-auto text-lg px-8 py-3 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all">
                        Upgrade to PRO - $15/mo
                    </button>

                    <div className="mt-6">
                        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (!stats) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Failed to load analytics.</div>;
    }

    return (
        <main className="min-h-screen bg-background text-foreground p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8 animate-fade">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Real-time performance metrics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block mr-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Last Activity</p>
                            <p className="text-sm font-mono text-primary">{getLastActivity()}</p>
                        </div>
                        <Link href="/" className="btn-primary text-sm px-4 py-2">
                            Back to Generator
                        </Link>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Clicks */}
                    <div className="matte-card p-6 flex flex-col justify-center">
                        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Total Clicks</h3>
                        <div className="text-4xl font-bold">{stats.totalClicks.toLocaleString()}</div>
                    </div>

                    {/* Chart: Daily Performance (Agent A) */}
                    <div className="matte-card p-6 col-span-1 md:col-span-2 flex flex-col">
                        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-4">Daily Performance (Last 7 Days)</h3>
                        <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fff" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="clicks" stroke="#fff" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart: Devices (Agent B) */}
                    <div className="matte-card p-6 flex flex-col items-center justify-center">
                        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2 w-full text-left">Devices</h3>
                        <div className="h-40 w-full relative">
                            {deviceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={deviceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {deviceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No data</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* My Links Performance Table */}
                <div className="matte-card overflow-hidden">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-card/50">
                        <h3 className="text-lg font-semibold">My Links Performance</h3>
                    </div>

                    {history.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No links generated yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/30 text-xs text-muted-foreground uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Date</th>
                                        <th className="px-6 py-4 font-medium">Link Alias</th>
                                        <th className="px-6 py-4 font-medium">Product</th>
                                        <th className="px-6 py-4 font-medium text-right">Total Hits</th>
                                        <th className="px-6 py-4 w-1/4">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-border">
                                    {[...history].reverse().map((link) => {
                                        // Extract slug from generated URL (last part)
                                        const slug = link.generated.split('/').pop() || '';
                                        const hits = stats.statsBySlug[slug] || 0;
                                        const maxHits = Math.max(...Object.values(stats.statsBySlug), 1);

                                        return (
                                            <tr key={link.id} className="hover:bg-secondary/20 transition-colors group">
                                                <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                                                    {new Date(link.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <a href={link.generated} target="_blank" className="text-primary hover:underline font-medium">
                                                        /{slug}
                                                    </a>
                                                    {link.description && (
                                                        <div className="text-xs text-muted-foreground mt-0.5">{link.description}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground text-base mb-0.5">
                                                        {link.title}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-mono opacity-50">
                                                        ASIN: {link.asin}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-block px-2 py-1 rounded font-bold text-xs min-w-[30px] text-center ${hits > 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                                                        {hits}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            style={{ width: `${Math.min((hits / maxHits) * 100, 100)}%` }}
                                                            className="h-full bg-primary transition-all duration-500"
                                                        ></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
