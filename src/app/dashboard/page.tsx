'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, Activity, Link as LinkIcon } from 'lucide-react';

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
    plan?: 'free' | 'pro'; // Added for plan type
    limits?: {
        clicks: number;
        links: number;
    };
    usage?: {
        clicks: number;
        links: number;
    };
};

type ArchivedLink = {
    id: string;
    asin: string;
    title: string;
    generated?: string; // Added for free plan table
    description?: string; // Added for free plan table
    date: string; // Added for free plan table
};

// Colors for Pie Chart
const COLORS = ['#FFFFFF', '#666666', '#333333', '#999999'];

import { useAuth } from "@clerk/nextjs";
// ... imports

export default function Dashboard() {
    const { isSignedIn, isLoaded } = useAuth();
    const [stats, setStats] = useState<any | null>(null); // Relaxed type for free/pro structure
    const [history, setHistory] = useState<ArchivedLink[]>([]);
    const [loading, setLoading] = useState(true);
    // Remove upgradeRequired state as we now handle "free" plan gracefully

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        const fetchData = async () => {
            try {
                // Fetch Stats and Link History in parallel
                const [statsRes, historyRes] = await Promise.all([
                    fetch('/api/stats'),
                    fetch('/api/links')
                ]);

                // We no longer block 403 on stats, as it returns Free Plan data now
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

    if (!stats) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Failed to load analytics.</div>;
    }

    // --- FREE PLAN DASHBOARD ---
    if (stats.plan === 'free') {
        const { limits, usage } = stats;
        const clicksPercent = Math.min((usage.clicks / limits.clicks) * 100, 100);
        const linksPercent = Math.min((usage.links / limits.links) * 100, 100);

        return (
            <main className="min-h-screen bg-background text-foreground p-6 md:p-12">
                <div className="max-w-4xl mx-auto space-y-8 animate-fade">

                    {/* Header with Upgrade CTA */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-border pb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="bg-secondary text-muted-foreground text-xs px-2 py-1 rounded font-mono uppercase tracking-wider">Free Plan</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/" className="btn-primary bg-secondary text-foreground hover:bg-secondary/80 text-sm px-4 py-2 border border-border shadow-none">
                                Generate Link
                            </Link>
                            <button className="btn-primary bg-primary text-primary-foreground text-sm px-4 py-2 shadow-lg hover:shadow-primary/20">
                                Upgrade to PRO
                            </button>
                        </div>
                    </div>

                    {/* Usage Limits Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Clicks Usage */}
                        <div className="matte-card p-6">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Clicks</h3>
                                    <div className="text-2xl font-bold mt-1">{usage.clicks} <span className="text-muted-foreground text-lg font-normal">/ {limits.clicks}</span></div>
                                </div>
                                <Activity className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${usage.clicks >= limits.clicks ? 'bg-red-500' :
                                        usage.clicks >= limits.clicks * 0.75 ? 'bg-orange-500' :
                                            usage.clicks >= limits.clicks * 0.5 ? 'bg-yellow-500' :
                                                'bg-primary'
                                        }`}
                                    style={{ width: `${clicksPercent}%` }}
                                ></div>
                            </div>
                            <p className={`text-xs mt-3 ${usage.clicks >= limits.clicks ? 'text-red-500 font-bold' :
                                usage.clicks >= limits.clicks * 0.75 ? 'text-orange-500 font-medium' :
                                    usage.clicks >= limits.clicks * 0.5 ? 'text-yellow-500 font-medium' :
                                        'text-muted-foreground'
                                }`}>
                                {
                                    usage.clicks >= limits.clicks ? 'Limit reached! Links may stop redirecting.' :
                                        usage.clicks >= limits.clicks * 0.75 ? 'Warning: 75% used. Upgrade recommended.' :
                                            usage.clicks >= limits.clicks * 0.5 ? 'Heads up: You have used 50% of your free clicks.' :
                                                'Resets next month.'
                                }
                            </p>
                        </div>

                        {/* Links Usage */}
                        <div className="matte-card p-6">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Links</h3>
                                    <div className="text-2xl font-bold mt-1">{usage.links} <span className="text-muted-foreground text-lg font-normal">/ {limits.links}</span></div>
                                </div>
                                <LinkIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${usage.links >= limits.links ? 'bg-orange-500' : 'bg-primary'}`}
                                    style={{ width: `${linksPercent}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                {usage.links >= limits.links ? 'Limit reached. Create space or upgrade.' : 'Create more links freely.'}
                            </p>
                        </div>
                    </div>

                    {/* Permanent Upgrade CTA Card */}
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BarChart3 className="w-32 h-32 text-yellow-500" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-yellow-500 mb-2">Unlock Full Potential</h3>
                            <p className="text-muted-foreground mb-4 max-w-md">
                                Remove all limits and get deep insights into your audience.
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span> Unlimited Links
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span> Full Device Analytics
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span> Unlimited Clicks
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span> Priority Support
                                </li>
                            </ul>
                        </div>

                        <div className="relative z-10 w-full md:w-auto">
                            <button className="w-full md:w-auto btn-primary bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 shadow-lg hover:shadow-yellow-500/20 transition-all">
                                Upgrade Now
                            </button>
                        </div>
                    </div>

                    {/* Simple Link List (No Stats) */}
                    <div className="matte-card overflow-hidden">
                        <div className="p-6 border-b border-border bg-card/50">
                            <h3 className="text-lg font-semibold">My Links</h3>
                        </div>
                        {history.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground">
                                No links yet. Go create one!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-secondary/30 text-xs text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Date</th>
                                            <th className="px-6 py-4 font-medium">Product</th>
                                            <th className="px-6 py-4 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-border">
                                        {[...history].reverse().map((link) => (
                                            <tr key={link.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="px-6 py-4 text-muted-foreground font-mono text-xs whitespace-nowrap">
                                                    {new Date(link.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground text-base mb-1 truncate max-w-xs md:max-w-md">
                                                        {link.title}
                                                    </div>
                                                    <a href={link.generated} target="_blank" className="text-primary hover:underline text-xs font-mono bg-secondary/50 px-2 py-1 rounded inline-block">
                                                        {link.generated}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(link.generated || '')}
                                                        className="text-xs border border-border bg-background hover:bg-secondary px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        Copy
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="p-4 bg-secondary/20 text-center border-t border-border">
                            <span className="text-xs text-muted-foreground mr-2">Want to see who is clicking?</span>
                            <button className="text-xs text-primary font-bold hover:underline">Go PRO</button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // --- PRO DASHBOARD (Existing Logic) ---
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
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-border">
                                    {[...history].reverse().map((link) => {
                                        // Extract slug from generated URL (last part)
                                        const slug = (link.generated || '').split('/').pop() || '';
                                        const hits = stats.statsBySlug[slug] || 0;
                                        const maxHits = Math.max(...Object.values(stats.statsBySlug as Record<string, number>), 1);

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
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(link.generated || '');
                                                            // Optional: Toast notification could go here
                                                        }}
                                                        className="text-xs border border-border bg-background hover:bg-secondary px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        Copy
                                                    </button>
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
