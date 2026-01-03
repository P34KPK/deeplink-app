'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, Activity, Link as LinkIcon, Heart, QrCode, Download, Calendar, GripHorizontal, TrendingUp, Sparkles, DollarSign, Wand2, ShoppingBag, Copy, Calculator } from 'lucide-react';
import QRCode from 'react-qr-code';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    favorite?: boolean;
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
    const [qrLink, setQrLink] = useState<string | null>(null); // State for QR Modal
    const [widgetOrder, setWidgetOrder] = useState(['total', 'simulator', 'prime', 'devices', 'daily', 'trends', 'copywriter']);

    // Agent C: Commission Simulator State
    const [simPrice, setSimPrice] = useState(25); // Avg Product Price
    const [simRate, setSimRate] = useState(3);   // Conversion Rate %

    // Agent B: Copywriter State
    const [copyInput, setCopyInput] = useState('');
    const [copyLang, setCopyLang] = useState('en');
    const [copyResult, setCopyResult] = useState<{ hook: string, hashtags: string } | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null); // For Copy Feedback

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Agent A: Trends Data
    const TRENDS = [
        { id: 1, name: "Sony WH-1000XM5", category: "Tech", asin: "B09XS7JWHH", hits: "+120%" },
        { id: 2, name: "Ninja Air Fryer", category: "Home", asin: "B07FDNMC9Q", hits: "+85%" },
        { id: 3, name: "Stanley Quencher", category: "Viral", asin: "B0C9X8XXXX", hits: "+200%" }
    ];

    const generateMagic = () => {
        if (!copyInput) return;

        const hooks: Record<string, string> = {
            en: `🔥 Stop scrolling! This is why everyone is talking about ${copyInput}. #MustHave`,
            fr: `🔥 Arrêtez tout ! Voici pourquoi tout le monde parle de ${copyInput}. #Indispensable`,
            'fr-ca': `🔥 Arrête de scroller! Voici pourquoi tout le monde capote sur ${copyInput}. #Malade`,
            es: `🔥 ¡Para de scrollear! Mira por qué todos hablan de ${copyInput}. #Imprescindible`,
            de: `🔥 Hör auf zu scrollen! Das ist, warum alle über ${copyInput} sprechen. #MussIchHaben`,
            it: `🔥 Smetti di scorrere! Ecco perché tutti parlano di ${copyInput}. #MustHave`,
            pt: `🔥 Pare de rolar! É por isso que todos estão falando sobre ${copyInput}. #Imperdível`
        };

        const hashtags: Record<string, string> = {
            en: `#${copyInput.replace(/\s/g, '')} #AmazonFinds #ViralTech #DeepLinkrs`,
            fr: `#${copyInput.replace(/\s/g, '')} #DécouverteAmazon #TechVirale`,
            'fr-ca': `#${copyInput.replace(/\s/g, '')} #TrouvailleAmazon #QuebecTech #ViralQC`,
            es: `#${copyInput.replace(/\s/g, '')} #AmazonFinds #TecnologíaViral`,
            de: `#${copyInput.replace(/\s/g, '')} #AmazonFunde #ViralTech`,
            it: `#${copyInput.replace(/\s/g, '')} #AmazonFinds #TechVirale`,
            pt: `#${copyInput.replace(/\s/g, '')} #AchadosAmazon #TechViral`
        };

        setCopyResult({
            hook: hooks[copyLang] || hooks['en'],
            hashtags: hashtags[copyLang] || hashtags['en']
        });
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setWidgetOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over?.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }
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
                                                        onClick={() => handleCopy(link.id, link.generated || '')}
                                                        className={`text-xs border border-border px-3 py-1.5 rounded transition-all min-w-[60px] ${copiedId === link.id
                                                                ? 'bg-green-500 text-white border-green-500'
                                                                : 'bg-background hover:bg-secondary'
                                                            }`}
                                                    >
                                                        {copiedId === link.id ? 'Copied!' : 'Copy'}
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

    // --- AGENT B: Best Time to Post (Day of Week Analysis) ---
    const getBestDay = () => {
        const dayCounts: Record<string, number> = {};
        Object.entries(stats.dailyClicks).forEach(([dateStr, count]) => {
            const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
            dayCounts[dayName] = (dayCounts[dayName] || 0) + (count as number);
        });

        // Find max
        let maxDay = 'N/A';
        let maxCount = 0;
        Object.entries(dayCounts).forEach(([day, count]) => {
            if (count > maxCount) {
                maxCount = count;
                maxDay = day;
            }
        });
        return { day: maxDay, count: maxCount };
    };

    const bestDay = getBestDay();

    // --- AGENT B: Export Report ---
    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('DeepLinkrs Analytics Report', 14, 22);

        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        doc.text(`Total Clicks: ${stats.totalClicks}`, 14, 38);

        // Stats Table
        const tableData = history.map(l => {
            const slug = (l.generated || '').split('/').pop() || '';
            const hits = stats.statsBySlug[slug] || 0;
            return [
                new Date(l.date).toLocaleDateString(),
                l.title,
                l.generated,
                hits
            ];
        });

        autoTable(doc, {
            head: [['Date', 'Title', 'Link', 'Clicks']],
            body: tableData,
            startY: 50,
        });

        doc.save('deeplinkrs-report.pdf');
    };

    const toggleFavorite = async (id: string, currentStatus: boolean) => {
        // Optimistic UI update
        const newStatus = !currentStatus;
        setHistory(prev => prev.map(link => link.id === id ? { ...link, favorite: newStatus } : link));

        try {
            await fetch('/api/links', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, favorite: newStatus })
            });
        } catch (e) {
            console.error("Failed to toggle favorite", e);
            // Revert on failure
            setHistory(prev => prev.map(link => link.id === id ? { ...link, favorite: currentStatus } : link));
        }
    };

    const favoriteLinks = history.filter(l => l.favorite);

    return (
        <main className="min-h-screen bg-background text-foreground p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8 animate-fade">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Analytics Dashboard
                            <span className="bg-[#27272a] text-white text-[10px] px-2.5 py-1 rounded-full font-bold tracking-widest uppercase relative top-0.5 shadow-sm">PRO</span>
                        </h1>
                        <p className="text-muted-foreground mt-1">Real-time performance metrics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 text-xs border border-border bg-card hover:bg-secondary px-3 py-2 rounded transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export Report</span>
                        </button>

                        <div className="text-right hidden md:block mr-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Last Activity</p>
                            <p className="text-sm font-mono text-primary">{getLastActivity()}</p>
                        </div>



                        <Link href="/" className="btn-primary text-sm px-4 py-2">
                            Back to Generator
                        </Link>
                    </div>
                </div>

                {/* KPI Grid (Draggable) */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={widgetOrder}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {widgetOrder.map((id) => (
                                <SortableItem key={id} id={id} className={id === 'daily' ? 'col-span-1 md:col-span-2' : ''}>
                                    {/* Render Widget Content Based on ID */}
                                    {id === 'total' && (
                                        <div className="matte-card p-6 flex flex-col justify-center relative overflow-hidden group h-full">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Activity className="w-16 h-16" />
                                            </div>
                                            <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Total Clicks</h3>
                                            <div className="text-4xl font-bold">{stats.totalClicks.toLocaleString()}</div>
                                        </div>
                                    )}
                                    {id === 'simulator' && (
                                        <div className="matte-card p-6 flex flex-col justify-center relative overflow-hidden group h-full border-l-4 border-l-green-500/50">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Calculator className="w-16 h-16 text-green-500" />
                                            </div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <DollarSign className="w-4 h-4 text-green-500" />
                                                <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Commission Simulator</h3>
                                            </div>

                                            <div className="flex gap-2 mb-4">
                                                <div>
                                                    <label className="text-[10px] text-muted-foreground block mb-1">Avg Price ($)</label>
                                                    <input
                                                        type="number"
                                                        value={simPrice}
                                                        onChange={(e) => setSimPrice(Number(e.target.value))}
                                                        className="w-full bg-secondary/50 border border-border rounded px-2 py-1 text-sm outline-none focus:border-green-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-muted-foreground block mb-1">Conv. Rate (%)</label>
                                                    <input
                                                        type="number"
                                                        value={simRate}
                                                        onChange={(e) => setSimRate(Number(e.target.value))}
                                                        className="w-full bg-secondary/50 border border-border rounded px-2 py-1 text-sm outline-none focus:border-green-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="text-3xl font-bold text-green-500">
                                                ${((stats.totalClicks * (simRate / 100)) * (simPrice * 0.04)).toFixed(2)}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">Potential based on traffic (4% comm.)</p>
                                        </div>
                                    )}
                                    {id === 'prime' && (
                                        <div className="matte-card p-6 flex flex-col justify-center relative overflow-hidden group h-full">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Calendar className="w-16 h-16" />
                                            </div>
                                            <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Prime Time</h3>
                                            <div className="text-2xl font-bold text-primary">{bestDay.day}</div>
                                            <p className="text-xs text-muted-foreground mt-1">Most active day ({bestDay.count} clicks)</p>
                                        </div>
                                    )}
                                    {id === 'trends' && (
                                        <div className="matte-card p-6 flex flex-col h-full relative overflow-hidden group">
                                            <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                                <TrendingUp className="w-4 h-4 text-red-500" />
                                                <h3 className="text-xs font-bold uppercase tracking-wider">Amazon Trend Radar</h3>
                                            </div>
                                            <div className="space-y-3 flex-1">
                                                {TRENDS.map((t) => (
                                                    <div key={t.id} className="flex items-center justify-between bg-secondary/50 p-2 rounded-lg">
                                                        <div>
                                                            <div className="text-sm font-bold flex items-center gap-2">
                                                                {t.name}
                                                                <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full">{t.hits}</span>
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">{t.category}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(t.asin);
                                                                alert(`Copied ASIN: ${t.asin}. Go generate your link!`);
                                                            }}
                                                            className="text-xs bg-background border border-border hover:bg-white hover:text-black transition-colors px-2 py-1 rounded"
                                                        >
                                                            Get ASIN
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {id === 'copywriter' && (
                                        <div className="matte-card p-6 flex flex-col h-full bg-gradient-to-br from-card to-purple-500/5 border-purple-500/20">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Sparkles className="w-4 h-4 text-purple-400" />
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Copywriter</h3>
                                            </div>

                                            {!copyResult ? (
                                                <div className="flex flex-col gap-3 flex-1 justify-center">
                                                    <input
                                                        type="text"
                                                        className="input-minimal text-sm py-2"
                                                        placeholder="Product Name (e.g. Sony XM5)"
                                                        value={copyInput}
                                                        onChange={(e) => setCopyInput(e.target.value)}
                                                    />
                                                    <select
                                                        value={copyLang}
                                                        onChange={(e) => setCopyLang(e.target.value)}
                                                        className="w-full bg-secondary/50 border border-border rounded px-3 py-2 text-xs outline-none focus:border-purple-500"
                                                    >
                                                        <option value="en">🇺🇸 English</option>
                                                        <option value="fr">🇫🇷 French</option>
                                                        <option value="fr-ca">🇨🇦 French (CA)</option>
                                                        <option value="es">🇪🇸 Spanish</option>
                                                        <option value="de">🇩🇪 German</option>
                                                        <option value="it">🇮🇹 Italian</option>
                                                        <option value="pt">🇧🇷 Portuguese</option>
                                                    </select>
                                                    <button
                                                        onClick={generateMagic}
                                                        disabled={!copyInput}
                                                        className="btn-primary py-2 text-xs flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white border-none"
                                                    >
                                                        <Wand2 className="w-3 h-3" /> Generate Magic
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 animate-fade-up">
                                                    <div className="bg-secondary/50 p-3 rounded-lg text-xs italic relative group-copy">
                                                        "{copyResult.hook}"
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(copyResult.hook)}
                                                            className="absolute top-2 right-2 p-1 hover:text-white text-muted-foreground"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-purple-300 font-mono break-words">{copyResult.hashtags}</div>
                                                    <button onClick={() => { setCopyResult(null); setCopyInput(''); }} className="text-xs text-muted-foreground hover:text-white underline">Reset</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {id === 'daily' && (
                                        <div className="matte-card p-6 flex flex-col h-full">
                                            <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-4">Daily Performance (Last 7 Days)</h3>
                                            <div className="h-40 w-full flex-1">
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
                                    )}
                                    {id === 'devices' && (
                                        <div className="matte-card p-6 flex flex-col items-center justify-center h-full">
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
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                                                                itemStyle={{ color: '#fff' }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No data</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </SortableItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>


                {/* Favorites Widget */}
                {
                    favoriteLinks.length > 0 && (
                        <div className="matte-card p-6 animate-fade-up">
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                <h3 className="text-sm font-semibold uppercase tracking-wider">Favorite Links</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {favoriteLinks.map(link => {
                                    const slug = (link.generated || '').split('/').pop() || '';
                                    const hits = stats.statsBySlug[slug] || 0;
                                    return (
                                        <div key={link.id} className="bg-secondary/20 border border-border rounded-lg p-3 flex justify-between items-center group hover:bg-secondary/40 transition-colors">
                                            <div className="overflow-hidden">
                                                <div className="font-medium text-sm truncate">{link.title}</div>
                                                <div className="text-xs text-muted-foreground font-mono">/{slug} • {hits} clicks</div>
                                            </div>
                                            <button
                                                onClick={() => toggleFavorite(link.id, true)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-1"
                                                title="Remove from favorites"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                }

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
                                        <th className="px-6 py-4 font-medium w-10"></th>
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
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => toggleFavorite(link.id, link.favorite || false)}
                                                        className="hover:scale-110 transition-transform active:scale-95"
                                                    >
                                                        <Heart
                                                            className={`w-4 h-4 transition-colors ${link.favorite ? 'text-white fill-white' : 'text-muted-foreground hover:text-white'}`}
                                                            strokeWidth={2}
                                                        />
                                                    </button>
                                                </td>
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
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setQrLink(link.generated || '')}
                                                        className="p-1.5 text-xs border border-border rounded hover:bg-secondary hover:text-white text-muted-foreground"
                                                        title="Show QR Code"
                                                    >
                                                        <QrCode className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopy(link.id, link.generated || '')}
                                                        className={`text-xs border border-border px-3 py-1.5 rounded transition-all min-w-[60px] ${copiedId === link.id
                                                                ? 'bg-green-500 text-white border-green-500'
                                                                : 'bg-background hover:bg-secondary'
                                                            }`}
                                                    >
                                                        {copiedId === link.id ? 'Copied!' : 'Copy'}
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

                {/* Footer Actions */}
                <div className="flex justify-center pt-8 border-t border-border mt-12">
                    <a
                        href="mailto:info@p34k.com?subject=Cancel%20Subscription"
                        className="text-xs text-muted-foreground hover:text-red-500 opacity-60 hover:opacity-100 transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        Cancel Plan
                    </a>
                </div>
            </div >
            {/* QR Modal */}
            {
                qrLink && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade" onClick={() => setQrLink(null)}>
                        <div className="matte-card p-8 bg-white text-black flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4">Sharing Code</h3>
                            <div className="bg-white p-2 animate-fade-up">
                                <QRCode value={qrLink} size={200} />
                            </div>
                            <p className="text-xs text-gray-500 mt-4 break-all text-center max-w-[200px]">{qrLink}</p>
                            <button
                                onClick={() => setQrLink(null)}
                                className="mt-6 text-sm text-gray-500 hover:text-black uppercase tracking-wider font-bold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }
        </main >
    );
}

// Sortable Item Component
function SortableItem(props: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none' // Prevent scrolling while dragging on touch
    };

    return (
        <div ref={setNodeRef} style={style} className={props.className}>
            <div className="relative h-full">
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 right-2 z-20 p-1 opacity-0 hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity bg-black/50 rounded text-white"
                    title="Drag to Move"
                >
                    <GripHorizontal className="w-4 h-4" />
                </div>
                {props.children}
            </div>
        </div>
    );
}
