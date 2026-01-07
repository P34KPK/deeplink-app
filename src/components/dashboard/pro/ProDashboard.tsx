'use client';

import { useState, Dispatch, SetStateAction } from 'react';
import Link from 'next/link';
import {
    AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import {
    Activity, TrendingUp, Calendar, GripHorizontal, DollarSign,
    Download, Heart, Trash, Camera, QrCode, Lock, Sparkles, Megaphone
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GlobeWidget from '@/components/GlobeWidget';
import GamificationWidget from '@/components/GamificationWidget';
import LinkTreeWidget from '@/components/LinkTreeWidget';
import IdentityWidget from '@/components/IdentityWidget';
import AffiliateWidget from '@/components/dashboard/shared/AffiliateWidget';
import CheckoutButton from '@/components/CheckoutButton';

type ProDashboardProps = {
    stats: any;
    history: any[];
    setHistory: Dispatch<SetStateAction<any[]>>;
    widgetOrder: string[];
    setWidgetOrder: Dispatch<SetStateAction<string[]>>;
    userId: string;
    onEditProfile: () => void;
    setAiModal: (val: any) => void;
    setMockupModal: (val: any) => void;
    profileVersion?: number;
    bypassLock?: boolean;
};

const COLORS = ['#FFFFFF', '#666666', '#333333', '#999999'];

export default function ProDashboard({
    stats,
    history,
    setHistory,
    widgetOrder,
    setWidgetOrder,
    userId,
    onEditProfile,
    setAiModal,
    setMockupModal,
    profileVersion = 0,
    bypassLock = false
}: ProDashboardProps) {

    const [expandedWidgets, setExpandedWidgets] = useState<string[]>(['daily', 'trends']);
    const [qrLink, setQrLink] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [qrColor, setQrColor] = useState('#000000');
    const [qrBg, setQrBg] = useState('#ffffff');
    const [simPrice, setSimPrice] = useState(25);
    const [simRate, setSimRate] = useState(3);
    const [copyInput, setCopyInput] = useState('');
    const [copyLang, setCopyLang] = useState('en');
    const [copyResult, setCopyResult] = useState<{ hook: string, hashtags: string } | null>(null);
    const [isCopyLoading, setIsCopyLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [health, setHealth] = useState<Record<string, 'loading' | 'ok' | 'dead'>>({});

    const toggleWidgetSize = (id: string) => {
        setExpandedWidgets(prev =>
            prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
        );
    };

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const checkLink = async (id: string, url: string) => {
        setHealth(prev => ({ ...prev, [id]: 'loading' }));
        try {
            const res = await fetch('/api/link-health', {
                method: 'POST', body: JSON.stringify({ url }), headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            setHealth(prev => ({ ...prev, [id]: data.status === 'alive' || data.code === 200 ? 'ok' : 'dead' }));
        } catch {
            setHealth(prev => ({ ...prev, [id]: 'dead' }));
        }
    };

    const handleDeleteLink = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const res = await fetch(`/api/links?id=${id}`, { method: 'DELETE' });
            if (res.ok) setHistory(prev => prev.filter(l => l.id !== id));
        } catch { alert('Error deleting link'); }
    };

    const toggleFavorite = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        setHistory(prev => prev.map(l => l.id === id ? { ...l, favorite: newStatus } : l));
        try {
            await fetch('/api/links', {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, favorite: newStatus })
            });
        } catch {
            setHistory(prev => prev.map(l => l.id === id ? { ...l, favorite: currentStatus } : l));
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text('DeepLinkrs Analytics', 14, 22);
        doc.setFontSize(11);
        doc.text(`Total Clicks: ${stats.totalClicks}`, 14, 38);
        const tableData = history.map(l => [new Date(l.date).toLocaleDateString(), l.title, stats.statsBySlug[(l.generated || '').split('/').pop() || ''] || 0]);
        autoTable(doc, { head: [['Date', 'Title', 'Clicks']], body: tableData, startY: 50 });
        doc.save('report.pdf');
    };

    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    // Fallback for daily clicks if missing
    const safeDailyClicks = stats.dailyClicks || {};
    const chartData = getLast7Days().map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: safeDailyClicks[date] || 0
    }));

    // Fallback for devices if missing or all zero
    const deviceStats = stats.devices || { android: 0, ios: 0, desktop: 0, other: 0 };
    let deviceData = [
        { name: 'Android', value: deviceStats.android }, { name: 'iOS', value: deviceStats.ios },
        { name: 'Desktop', value: deviceStats.desktop }, { name: 'Other', value: deviceStats.other },
    ].filter(d => d.value > 0);

    if (deviceData.length === 0) {
        deviceData = [{ name: 'No Data', value: 1 }]; // Placeholder to prevent crash
    }

    const locationData = stats?.locations ? Object.entries(stats.locations as Record<string, number>).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) : [];
    const browserDataRaw = stats?.browsers ? Object.entries(stats.browsers as Record<string, number>).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) : [];
    const browserData = browserDataRaw.length > 0 ? browserDataRaw : [{ name: 'No Data', value: 1 }]; // Placeholder

    const referrerData = stats?.referrers ? Object.entries(stats.referrers as Record<string, number>).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) : [];
    const getBestDay = () => {
        if (!stats?.dailyClicks) return { day: 'N/A', count: 0 };
        const dayCounts: Record<string, number> = {};
        Object.entries(stats.dailyClicks).forEach(([dateStr, count]) => {
            const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
            dayCounts[dayName] = (dayCounts[dayName] || 0) + (count as number);
        });
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

    const getLastActivity = () => {
        if (!stats?.globalLastClick) return 'Never';
        const diff = Date.now() - stats.globalLastClick;
        if (diff < 60000) return 'Just now';
        return `${Math.floor(diff / 60000)}m ago`;
    };

    const activeTrends = stats?.trends || []; // Real data only

    const generateMagic = async () => {
        if (!copyInput) return;
        setIsCopyLoading(true);
        try {
            const res = await fetch('/api/ai/generate-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product: copyInput })
            });
            const data = await res.json();
            if (data.captions && data.captions.length > 0) {
                setCopyResult({
                    hook: data.captions[0], // Store full caption
                    hashtags: ''
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsCopyLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        try {
            const res = await fetch('/api/stripe/portal', {
                method: 'POST',
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('No active subscription found or error accessing portal.');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to access billing portal.');
        }
    };

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setWidgetOrder((items) => {
                const old = items.indexOf(active.id as string);
                const newI = items.indexOf(over?.id as string);
                const newOrder = arrayMove(items, old, newI);
                localStorage.setItem('dashboard_layout_v6', JSON.stringify(newOrder));
                return newOrder;
            });
        }
    }

    const favoriteLinks = history.filter(l => l.favorite);

    return (
        <main className="min-h-screen bg-background text-foreground p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8 animate-fade">
                {stats?.broadcast && (
                    <div className="p-4 rounded-lg border flex items-center gap-3 animate-fade-down bg-blue-500/10 border-blue-500/20 text-blue-500">
                        <Megaphone className="w-5 h-5 shrink-0" />
                        <div className="flex-1 text-sm font-medium">{stats.broadcast.message}</div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
                    <div className="flex flex-col gap-2">
                        <Link href="/" className="self-start text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-1 transition-colors">
                            <span>←</span> My Link (Generator)
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            Analytics Dashboard
                            {stats.plan === 'pro' ? (
                                <span className="bg-[#27272a] text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase relative top-0.5 shadow-sm">PRO</span>
                            ) : (
                                <span className="bg-secondary text-muted-foreground text-[10px] px-2.5 py-1 rounded-full font-bold uppercase relative top-0.5 border border-border">FREE</span>
                            )}
                        </h1>
                        <p className="text-muted-foreground mt-1">Real-time performance metrics for <span className='text-zinc-300'>@{userId}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleExportPDF} className="flex items-center gap-2 text-xs border border-border bg-card hover:bg-secondary px-3 py-2 rounded transition-colors"><Download className="w-4 h-4" /><span>Export</span></button>
                        <div className="text-right hidden md:block mr-4"><p className="text-xs text-muted-foreground uppercase font-semibold">Last Activity</p><p className="text-sm font-mono text-primary">{getLastActivity()}</p></div>
                    </div>
                </div>

                {/* Free Plan Limits Widget */}
                {stats.plan === 'free' && (
                    <div className="matte-card p-6 border-l-4 border-l-green-500 animate-fade-down">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Monthly Clicks Remaining</h3>
                                <div className="text-3xl font-bold font-mono">
                                    {Math.max(0, 200 - (stats.usage?.clicks || 0))} <span className="text-lg text-muted-foreground font-normal">/ 200</span>
                                </div>
                            </div>
                            <Activity className="w-6 h-6 text-muted-foreground opacity-50" />
                        </div>
                        <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${(stats.usage?.clicks || 0) >= 200 ? 'bg-red-500' :
                                    (stats.usage?.clicks || 0) >= 150 ? 'bg-orange-500' :
                                        (stats.usage?.clicks || 0) >= 100 ? 'bg-yellow-500' :
                                            'bg-green-500'
                                    }`}
                                style={{ width: `${Math.min(((stats.usage?.clicks || 0) / 200) * 100, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 flex justify-between">
                            <span>{new Date().toLocaleString('default', { month: 'long' })} Cycle</span>
                            <span className={(stats.usage?.clicks || 0) >= 200 ? 'text-red-500 font-bold' : ''}>
                                {(stats.usage?.clicks || 0) >= 200 ? 'Limit Reached. Upgrade now.' : 'Renewable every month'}
                            </span>
                        </p>
                        <div className="mt-4">
                            <CheckoutButton
                                priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!}
                                label="Upgrade to Pro - $9.99/mo"
                                className="w-full !bg-[#facc15] hover:!bg-[#eab308] text-black font-bold border-none shadow-[0_0_15px_rgba(250,204,21,0.3)] hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] transition-all transform hover:scale-[1.02]"
                            />
                        </div>
                    </div>
                )}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {widgetOrder.map((id) => {
                                // Define Pro Widgets
                                const PRO_WIDGETS = ['gamification', 'affiliate', 'favorites', 'simulator', 'prime', 'trends', 'copywriter', 'viral_studio', 'daily', 'devices', 'locations', 'browsers', 'referrers'];
                                const isLocked = !bypassLock && stats.plan === 'free' && PRO_WIDGETS.includes(id);

                                return (
                                    <SortableItem key={id} id={id} className={`${expandedWidgets.includes(id) ? 'col-span-1 md:col-span-2' : ''}`} onToggleSize={['total', 'linktree', 'daily'].includes(id) ? undefined : () => toggleWidgetSize(id)} isExpanded={expandedWidgets.includes(id)}>
                                        {isLocked ? (
                                            <div className="matte-card p-6 h-full min-h-[250px] flex flex-col items-center justify-center relative overflow-hidden group">



                                                <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4 animate-in fade-in">
                                                    <div className="p-3 bg-zinc-900 rounded-full border border-zinc-700 shadow-xl mb-3">
                                                        <Lock className="w-5 h-5 text-zinc-500" />
                                                    </div>
                                                    <h3 className="font-bold text-sm uppercase tracking-wider mb-2">{id}</h3>
                                                    <div className="text-[10px] font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20 px-2 py-0.5 rounded uppercase mb-4">Pro User Only</div>
                                                    <CheckoutButton
                                                        priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!}
                                                        label="Unlock"
                                                        className="h-8 text-xs px-4"
                                                    />
                                                </div>
                                                {/* Faint preview of content behind lock could go here if desired, otherwise empty */}
                                                <div className="opacity-10 w-full h-full flex items-center justify-center">
                                                    <Activity className="w-12 h-12" />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {id === 'identity' && (<div className="h-full"><IdentityWidget key={`identity-${profileVersion}`} userId={userId} onEditProfile={onEditProfile} /></div>)}
                                                {id === 'total' && (<div className="matte-card p-6 flex flex-col justify-between h-full bg-gradient-to-br from-card to-blue-500/5"><div className="text-3xl font-bold">{stats.totalClicks.toLocaleString()}</div><div className="text-xs text-muted-foreground font-bold uppercase">Total Clicks</div></div>)}
                                                {id === 'linktree' && (<div className="h-full relative group"><LinkTreeWidget userId={userId || 'guest'} className="h-full" onEditProfile={onEditProfile} /></div>)}
                                                {id === 'gamification' && (<div className="h-full"><GamificationWidget totalClicks={stats.totalClicks || 0} /></div>)}
                                                {id === 'affiliate' && (<div className="h-full"><AffiliateWidget userId={userId} stats={stats.affiliate} /></div>)}
                                                {id === 'favorites' && (
                                                    <div className="matte-card p-6 h-full flex flex-col">
                                                        <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground font-bold uppercase">
                                                            <Heart className="w-4 h-4 text-red-500 fill-red-500" /> Favorites
                                                        </div>
                                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[200px]">
                                                            {favoriteLinks.length > 0 ? favoriteLinks.map(link => (
                                                                <div key={link.id} className="bg-secondary/20 border border-border rounded-lg p-3 flex justify-between items-center group hover:bg-secondary/40 transition-colors">
                                                                    <div className="truncate text-sm font-medium pr-2 max-w-[80%]">{link.title}</div>
                                                                    <button onClick={() => toggleFavorite(link.id, true)} className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash className="w-3 h-3" /></button>
                                                                </div>
                                                            )) : (
                                                                <div className="text-center text-xs text-muted-foreground py-8 italic h-full flex items-center justify-center">No favorites yet</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {id === 'simulator' && (
                                                    <div className="matte-card p-6 h-full border-l-4 border-l-green-500/50">
                                                        <div className="flex gap-2 mb-4"><input type="number" value={simPrice} onChange={(e) => setSimPrice(Number(e.target.value))} className="w-full bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground" /><input type="number" value={simRate} onChange={(e) => setSimRate(Number(e.target.value))} className="w-full bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground" /></div>
                                                        <div className="text-3xl font-bold text-green-500">${((stats.totalClicks * (simRate / 100)) * (simPrice * 0.04)).toFixed(2)}</div>
                                                        <p className="text-xs text-muted-foreground">Potential (4% comm)</p>
                                                    </div>
                                                )}
                                                {id === 'prime' && (<div className="matte-card p-6 h-full"><div className="text-2xl font-bold text-primary">{bestDay.day}</div><p className="text-xs text-muted-foreground">Top day</p></div>)}
                                                {id === 'trends' && (
                                                    <div className="matte-card p-6 h-full flex flex-col">
                                                        <div className="text-xs text-muted-foreground font-bold uppercase mb-4">Market Trends</div>
                                                        {activeTrends.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {activeTrends.map((t: any) => (
                                                                    <div key={t.id} className="flex justify-between bg-secondary/50 p-2 rounded-lg text-sm font-bold">
                                                                        {t.name}<span className="text-red-500">{t.hits}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground italic">
                                                                No active trends detected yet.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {id === 'copywriter' && (
                                                    <div className="matte-card p-6 h-full bg-gradient-to-br from-card to-purple-500/5 border-purple-500/20">
                                                        {!copyResult ? (
                                                            <div className="flex flex-col gap-3 justify-center h-full">
                                                                <input type="text" className="input-minimal text-sm py-2" placeholder="Product Name" value={copyInput} onChange={(e) => setCopyInput(e.target.value)} disabled={isCopyLoading} />
                                                                <button onClick={generateMagic} disabled={!copyInput || isCopyLoading} className="btn-primary py-2 text-xs bg-purple-600 border-none flex items-center justify-center gap-2">
                                                                    {isCopyLoading && <Sparkles className="w-3 h-3 animate-spin" />}
                                                                    {isCopyLoading ? 'Generating...' : 'Magic'}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3 h-full flex flex-col">
                                                                <div className="bg-secondary/50 p-3 rounded-lg text-xs italic overflow-auto flex-1 custom-scrollbar">{copyResult.hook}</div>
                                                                <button onClick={() => { setCopyResult(null); setCopyInput(''); }} className="text-xs text-muted-foreground underline shrink-0">Reset</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {id === 'viral_studio' && (
                                                    <div className="matte-card p-6 h-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20 flex flex-col items-center justify-center text-center group">
                                                        <div className="mb-3 p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform">
                                                            <Camera className="w-6 h-6" />
                                                        </div>
                                                        <h3 className="font-bold text-sm uppercase tracking-wide mb-1">Viral Studio</h3>
                                                        <p className="text-[10px] text-muted-foreground mb-4">Create styled Stories for IG/TikTok</p>
                                                        <button
                                                            onClick={() => setMockupModal({ open: true, linkId: 'new', url: 'https://amazon.com', title: 'New Product', image: '' })}
                                                            className="text-xs bg-white text-black font-bold px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
                                                        >
                                                            Launch Studio
                                                        </button>
                                                    </div>
                                                )}
                                                {id === 'daily' && (
                                                    <div className="matte-card p-6 h-full bg-gradient-to-br from-card to-zinc-900/50 flex flex-col">
                                                        <div className="text-xs text-muted-foreground font-bold uppercase mb-4">Traffic Trend (7 Days)</div>
                                                        <div className="flex-1 min-h-[100px]">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={chartData}>
                                                                    <defs>
                                                                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor="#fff" stopOpacity={0.8} />
                                                                            <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                                                    <Area type="monotone" dataKey="clicks" stroke="#fff" fill="url(#colorClicks)" strokeWidth={2} />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                )}
                                                {id === 'devices' && (
                                                    <div className="matte-card p-6 h-full flex flex-col items-center justify-center">
                                                        <div className="text-xs text-muted-foreground font-bold uppercase mb-2 self-start">Devices</div>
                                                        <div className="h-40 w-full">
                                                            <ResponsiveContainer>
                                                                <PieChart>
                                                                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                                                        {deviceData.map((e, i) => <Cell key={i} fill={e.name === 'No Data' ? '#333' : COLORS[i % COLORS.length]} stroke="none" />)}
                                                                    </Pie>
                                                                    <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                        {deviceData[0].name === 'No Data' && <div className="text-[10px] text-muted-foreground mt-2">No device data yet</div>}
                                                    </div>
                                                )}
                                                {id === 'locations' && (<div className="matte-card h-full relative group overflow-hidden"><div className="absolute inset-0 opacity-60"><GlobeWidget /></div><div className="relative z-10 p-6 h-full bg-gradient-to-b from-transparent to-black pointer-events-none flex flex-col justify-end"><div className="absolute top-6 left-6 text-xs text-muted-foreground font-bold uppercase">Top Locations</div><div className="space-y-2 pointer-events-auto">{locationData.slice(0, 3).map((l, i) => (<div key={i} className="flex justify-between text-xs backdrop-blur bg-white/5 p-2 rounded"><span>{l.name}</span><span className="text-indigo-300">{l.value}</span></div>))}</div></div></div>)}
                                                {id === 'browsers' && (
                                                    <div className="matte-card p-6 h-full flex flex-col items-center justify-center">
                                                        <div className="text-xs text-muted-foreground font-bold uppercase mb-2 self-start">Browsers</div>
                                                        <div className="h-[150px] w-full">
                                                            <ResponsiveContainer>
                                                                <PieChart>
                                                                    <Pie data={browserData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                                                                        {browserData.map((e, i) => <Cell key={i} fill={e.name === 'No Data' ? '#333' : COLORS[i % COLORS.length]} stroke="none" />)}
                                                                    </Pie>
                                                                    <RechartsTooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                )}
                                                {id === 'referrers' && (
                                                    <div className="matte-card p-6 h-full flex flex-col">
                                                        <div className="text-xs text-muted-foreground font-bold uppercase mb-4">Top Sources</div>
                                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[150px]">
                                                            {referrerData.length > 0 ? referrerData.map((r, i) => (
                                                                <div key={i} className="flex justify-between items-center text-xs p-2 rounded bg-secondary/30 border border-white/5">
                                                                    <span className="truncate max-w-[70%]">{r.name.replace('https://', '').replace('http://', '').split('/')[0]}</span>
                                                                    <span className="font-bold">{r.value}</span>
                                                                </div>
                                                            )) : (
                                                                <div className="text-center text-xs text-muted-foreground py-8">No data yet</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </SortableItem>
                                )
                            })}
                        </div>
                    </SortableContext>
                </DndContext>



                <div className="matte-card overflow-hidden">
                    <div className="p-6 border-b border-border bg-card/50"><h3 className="text-lg font-semibold">My Links Performance</h3></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-secondary/30 text-xs text-muted-foreground uppercase tracking-wider"><tr><th className="px-6 py-4"></th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Title</th><th className="px-6 py-4 text-right">Hits</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
                            <tbody className="text-sm divide-y divide-border">
                                {history.slice().reverse().map((link) => {
                                    const slug = (link.generated || '').split('/').pop() || '';
                                    const hits = stats?.statsBySlug?.[slug] || 0;
                                    return (
                                        <tr key={link.id} className="hover:bg-secondary/20 transition-colors">
                                            <td className="px-6 py-4"><button onClick={() => toggleFavorite(link.id, link.favorite || false)}><Heart className={`w-4 h-4 ${link.favorite ? 'text-white fill-white' : 'text-muted-foreground'}`} /></button></td>
                                            <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(link.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-medium">{link.title}</td>
                                            <td className="px-6 py-4 text-right"><span className={`px-2 py-1 rounded text-xs font-bold ${hits > 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{hits}</span></td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button onClick={() => setAiModal({ open: true, title: link.title, link: link.generated || '' })} className="p-1.5 bg-purple-500/10 text-purple-400 rounded"><Sparkles className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => setMockupModal({ open: true, linkId: link.id, url: link.original, title: link.title, image: link.image })} className="p-1.5 bg-pink-500/10 text-pink-400 rounded"><Camera className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDeleteLink(link.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded"><Trash className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => checkLink(link.id, link.original)} className={`p-1.5 rounded ${health[link.id] === 'ok' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground'}`}><Activity className="w-3 h-3" /></button>
                                                <button onClick={() => setQrLink(link.generated)} className="p-1.5 text-muted-foreground rounded hover:bg-secondary"><QrCode className="w-3 h-3" /></button>
                                                <button onClick={() => handleCopy(link.id, link.generated)} className={`text-xs border px-3 py-1.5 rounded ${copiedId === link.id ? 'bg-green-500 text-white' : ''}`}>{copiedId === link.id ? 'Copied!' : 'Copy'}</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-center pt-8 border-t border-border mt-12">
                    <button onClick={handleManageSubscription} className="text-xs text-muted-foreground hover:text-white opacity-60 hover:opacity-100 flex items-center gap-2 transition-all">
                        <DollarSign className="w-3 h-3" /> Manage Subscription
                    </button>
                </div>

                {qrLink && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setQrLink(null)}>
                        <div className="matte-card p-8 bg-white text-black flex flex-col items-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4">QR Studio</h3>
                            <div className="p-4 rounded-xl shadow-inner mb-6" style={{ backgroundColor: qrBg }}><QRCode value={qrLink} size={200} fgColor={qrColor} bgColor={qrBg} /></div>
                            <div className="flex gap-4 w-full mb-4"><input type="color" value={qrColor} onChange={(e) => setQrColor(e.target.value)} className="flex-1 h-8 cursor-pointer" /><input type="color" value={qrBg} onChange={(e) => setQrBg(e.target.value)} className="flex-1 h-8 cursor-pointer" /></div>
                            <button onClick={() => setQrLink(null)} className="py-2 text-sm font-bold border rounded w-full">Close</button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function SortableItem(props: any) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.id });
    const style = { transform: CSS.Transform.toString(transform), transition, touchAction: 'none' };
    return (
        <div ref={setNodeRef} style={style} className={`${props.className} group`}>
            <div className="relative h-full">
                <div className="absolute top-2 right-2 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black/40 backdrop-blur rounded-lg border border-white/5">
                    {props.onToggleSize && (<button onClick={(e) => { e.stopPropagation(); props.onToggleSize(); }} className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#3add54] border border-[#27c93f] active:scale-90 transition-transform mb-[1px]" />)}
                    <div {...attributes} {...listeners} className="p-0.5 cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition-colors"><GripHorizontal className="w-4 h-4" /></div>
                </div>
                {props.children}
            </div>
        </div>
    );
}
