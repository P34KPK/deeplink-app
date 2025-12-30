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

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [history, setHistory] = useState<ArchivedLink[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Stats and Link History in parallel
                const [statsRes, historyRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/links')
                ]);

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
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading analytics...</div>;
    }

    if (!stats) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Failed to load analytics.</div>;
    }

    // --- AGENT A: Prepare Time Series Data ---
    // Fill in missing days for the last 7 days to have a nice chart
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    };

    const chartData = getLast7Days().map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: stats.dailyClicks[date] || 0
    }));

    // --- AGENT B: Prepare Device Data ---
    const deviceData = [
        { name: 'Android', value: stats.devices.android },
        { name: 'iOS', value: stats.devices.ios },
        { name: 'Desktop', value: stats.devices.desktop },
        { name: 'Other', value: stats.devices.other },
    ].filter(d => d.value > 0);

    // --- AGENT C: Helper to find title ---
    const getProductTitle = (asin: string) => {
        const match = history.find(h => h.asin === asin);
        return match ? match.title : `ASIN: ${asin}`;
    };

    // --- AGENT D: Format Last Activity ---
    const getLastActivity = () => {
        if (!stats.globalLastClick) return 'Never';
        const diff = Date.now() - stats.globalLastClick;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

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

                {/* Top Links Table */}
                <div className="matte-card overflow-hidden">
                    <div className="p-6 border-b border-border flex justify-between items-center bg-card/50">
                        <h3 className="text-lg font-semibold">Top Performing Products</h3>
                    </div>

                    {stats.topLinks.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No click data available yet. Start sharing links!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/30 text-xs text-muted-foreground uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Rank</th>
                                        <th className="px-6 py-4 font-medium">Product</th>
                                        <th className="px-6 py-4 font-medium text-right">Total Hits</th>
                                        <th className="px-6 py-4 font-medium text-center">Breakdown</th>
                                        <th className="px-6 py-4 w-1/4">Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-border">
                                    {stats.topLinks.map((link, index) => (
                                        <tr key={link.asin} className="hover:bg-secondary/20 transition-colors group">
                                            <td className="px-6 py-4 text-muted-foreground font-mono">#{index + 1}</td>
                                            <td className="px-6 py-4">
                                                {/* AGENT C: Product Title */}
                                                <div className="font-medium text-foreground text-base mb-0.5">
                                                    {getProductTitle(link.asin)}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono opacity-50 group-hover:opacity-100 transition-opacity">
                                                    ASIN: {link.asin}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-block bg-white text-black px-2 py-1 rounded font-bold text-xs min-w-[30px] text-center">
                                                    {link.total}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-foreground">{link.android}</span>
                                                        <span className="scale-75 opacity-70">AND</span>
                                                    </div>
                                                    <div className="w-px bg-border h-8"></div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-foreground">{link.ios}</span>
                                                        <span className="scale-75 opacity-70">IOS</span>
                                                    </div>
                                                    <div className="w-px bg-border h-8"></div>
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-foreground">{link.desktop}</span>
                                                        <span className="scale-75 opacity-70">DSK</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            style={{ width: `${Math.min((link.total / (stats.topLinks[0].total || 1)) * 100, 100)}%` }}
                                                            className="h-full bg-white transition-all duration-500"
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground text-right block">
                                                        Last click: {link.lastClick ? new Date(link.lastClick).toLocaleString() : 'N/A'}
                                                    </span>
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
