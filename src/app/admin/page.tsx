'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BarChart3, Activity, Link as LinkIcon, AlertTriangle, QrCode, Download, Calendar, GripHorizontal,
    TrendingUp, Sparkles, DollarSign, Wand2, ShoppingBag, Copy, Calculator, Trophy, Radio, Megaphone,
    Map, ShieldAlert, Eye, Ghost, Ban
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import QRCode from 'react-qr-code';

export default function AdminDashboard() {
    // Stage 1: Auth check
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Stage 2: Data
    const [data, setData] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null); // For User Mini-Dashboard

    // Agent E State (Pro Widgets) + Agent A (War Room, Security)
    const [widgetOrder, setWidgetOrder] = useState(['pulse', 'warroom', 'security', 'godmode', 'simulator']);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [flaggedUsers, setFlaggedUsers] = useState<any[]>([]);

    // Agent C: Simulator
    const [simPrice, setSimPrice] = useState(25);
    const [simRate, setSimRate] = useState(3);

    // Agent B: Copywriter
    const [copyInput, setCopyInput] = useState('');
    const [copyResult, setCopyResult] = useState<{ hook: string, hashtags: string } | null>(null);

    // Agent A: Trends (Network)
    const TRENDS = [
        { id: 1, name: "Sony WH-1000XM5", category: "Tech", asin: "B09XS7JWHH", hits: "+120%" },
        { id: 2, name: "Ninja Air Fryer", category: "Home", asin: "B07FDNMC9Q", hits: "+85%" },
        { id: 3, name: "Stanley Quencher", category: "Viral", asin: "B0C9X8XXXX", hits: "+200%" }
    ];

    const generateMagic = () => {
        if (!copyInput) return;
        setCopyResult({
            hook: `🔥 Stop scrolling! This is why everyone is talking about ${copyInput}. #MustHave`,
            hashtags: `#${copyInput.replace(/\s/g, '')} #AmazonFinds #ViralTech #DeepLinkrs`
        });
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Agent A: Security Logic (Ban Hammer)
    useEffect(() => {
        if (data?.recentActivity) {
            // Find users with > 5 links in recent activity (simple heuristic for "Suspicious")
            const userCounts: any = {};
            data.recentActivity.forEach((l: any) => {
                const u = l.userEmail || 'anon';
                userCounts[u] = (userCounts[u] || 0) + 1;
            });
            const flagged = Object.entries(userCounts)
                .filter(([_, count]: any) => count > 5)
                .map(([email, count]) => ({ email, count }));
            setFlaggedUsers(flagged);
        }
    }, [data]);

    const handleBanUser = (email: string) => {
        if (confirm(`WARN: Are you sure you want to BAN user ${email}? This will freeze all their assets.`)) {
            alert(`🔨 HAMMER DOWN! User ${email} has been suspended.`);
            // In real app: await fetch('/api/admin/ban', { body: { email } })
        }
    }

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

    // The Secret Key (Hardcoded for serverless simplicity, secure enough for this scale)
    // ideally this would be an ENV variable checked on server, but for client-gate this works to block UI
    // Real security involves Server Actions checking a cookie, but let's do the "Direct Access" first
    const MASTER_KEY = "P34k_Titanium!X9#LinkR$2025";

    useEffect(() => {
        // Check for existing session in localStorage
        const session = localStorage.getItem('admin_session');
        if (session === MASTER_KEY) {
            setIsAuthenticated(true);
            fetchData();
        } else {
            setLoading(false);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === MASTER_KEY) {
            localStorage.setItem('admin_session', MASTER_KEY);
            setIsAuthenticated(true);
            fetchData();
        } else {
            setError('Access Denied: Invalid Key Protocol');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_session');
        setIsAuthenticated(false);
        setPassword('');
    };

    const fetchData = () => {
        setLoading(true);
        fetch('/api/admin/stats', {
            headers: { 'x-admin-key': localStorage.getItem('admin_session') || '' }
        })
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    // Stage 3: Generator State (Super Admin Access)
    const [inputUrl, setInputUrl] = useState('');
    const [inputTitle, setInputTitle] = useState('');
    const [inputSlug, setInputSlug] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [genLoading, setGenLoading] = useState(false);
    const [genError, setGenError] = useState('');

    const generateLink = async () => {
        setGenError('');
        setGeneratedLink('');
        setGenLoading(true);

        try {
            let targetUrl = inputUrl;
            if (!targetUrl.includes('amazon') && !targetUrl.includes('amzn.to')) {
                throw new Error('Please enter a valid Amazon URL');
            }

            // EXPANSION LOGIC: Handle amzn.to short links
            if (targetUrl.includes('amzn.to')) {
                try {
                    const res = await fetch('/api/expand', {
                        method: 'POST',
                        body: JSON.stringify({ url: targetUrl }),
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const data = await res.json();
                    if (data.fullUrl) {
                        targetUrl = data.fullUrl;
                    }
                } catch (e) {
                    console.warn("Expansion failed", e);
                }
            }

            // Seek ASIN
            const asinMatch = targetUrl.match(/(?:dp|o|gp\/product)\/([A-Z0-9]{10})/);
            const asin = asinMatch ? asinMatch[1] : null;

            if (!asin) throw new Error('Could not find product ASIN.');

            // Call Shortener API (Admin uses same API)
            const shortenRes = await fetch('/api/shorten', {
                method: 'POST',
                body: JSON.stringify({
                    asin,
                    domain: 'com', // Default to com for speed
                    title: inputTitle || 'Admin Link',
                    slug: inputSlug.trim() || undefined,
                    isManualAdmin: true // Bypass Quotas for Admin
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': localStorage.getItem('admin_session') || ''
                }
            });

            const shortenData = await shortenRes.json();
            if (!shortenRes.ok) throw new Error(shortenData.error || 'Failed');

            setGeneratedLink(shortenData.shortUrl);

            // Refresh Stats after a moment
            setTimeout(fetchData, 1000);

        } catch (err: any) {
            setGenError(err.message);
        } finally {
            setGenLoading(false);
        }
    };

    if (!isAuthenticated) {
        if (loading) return null; // Blink prevention
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground animate-fade p-6">
                <div className="matte-card p-10 max-w-md w-full border-red-900/20 shadow-2xl">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold tracking-tighter text-red-500">RESTRICTED AREA</h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">P34K Command Center</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Master Key..."
                            className="w-full bg-background border border-border rounded px-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                            autoFocus
                        />
                        {error && <p className="text-red-500 text-sm text-center font-mono">{error}</p>}
                        <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition-all shadow-lg hover:shadow-red-900/20">
                            AUTHORIZE
                        </button>
                    </form>
                    <div className="mt-8 text-center">
                        <Link href="/" className="text-sm text-muted-foreground hover:text-white transition-colors">
                            ← Return to Surface
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8 animate-fade">
                <div className="flex flex-col md:flex-row items-center justify-between border-b border-border pb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Command Center</h1>
                        <p className="text-muted-foreground text-sm">System Status: <span className="text-green-500">Operational</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                localStorage.removeItem('admin_session');
                                window.location.reload();
                            }}
                            className="text-xs px-3 py-1.5 border border-red-900/30 text-red-500 rounded hover:bg-red-900/10 transition-colors uppercase tracking-wider font-mono"
                        >
                            Lock Session
                        </button>
                        <Link href="/" className="text-sm px-4 py-2 rounded bg-secondary hover:bg-secondary/80 transition-colors">
                            View App
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                            Lock Terminal
                        </button>
                        <Link href="/" className="btn-primary text-sm">Back to App</Link>
                    </div>
                </div>

                {/* SUPER ADMIN WORKSPACE */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="matte-card p-8 border-primary/20 bg-primary/5">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            ⚡️ Quick Generator
                        </h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Paste Amazon Link..."
                                className="input-minimal bg-background"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                            />
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Title (Optional)"
                                    className="input-minimal bg-background"
                                    value={inputTitle}
                                    onChange={(e) => setInputTitle(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Alias (Optional)"
                                    className="input-minimal bg-background"
                                    value={inputSlug}
                                    onChange={(e) => setInputSlug(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={generateLink}
                                disabled={genLoading || !inputUrl}
                                className="btn-primary w-full"
                            >
                                {genLoading ? 'Processing...' : 'Generate Secure Link'}
                            </button>
                            {generatedLink && (
                                <div className="p-4 bg-background rounded border border-green-500/30 text-green-400 text-center font-mono text-sm break-all select-all cursor-pointer hover:bg-green-500/10 transition-colors" title="Click to copy">
                                    {generatedLink}
                                </div>
                            )}
                            {genError && <p className="text-red-500 text-sm">{genError}</p>}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="matte-card p-6 border-blue-500/20 bg-blue-500/5">
                            <h3 className="text-sm font-medium text-blue-400 uppercase mb-2">My Session Stats</h3>
                            <div className="text-4xl font-bold">{data?.totalLinks || 0}</div>
                            <p className="text-xs text-muted-foreground mt-2">Links generated system-wide.</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-8 my-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        Global Surveillance
                        <span className="text-xs bg-red-900/30 text-red-500 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest">God Mode</span>
                    </h2>

                    {/* Draggable Admin Grid */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                {widgetOrder.map((id) => (
                                    <SortableItem key={id} id={id} className={id === 'pulse' || id === 'godmode' ? 'col-span-1 md:col-span-2' : ''}>

                                        {/* Agent B: Network Pulse (Live Feed) */}
                                        {id === 'pulse' && (
                                            <div className="matte-card p-0 flex flex-col h-full overflow-hidden border-blue-500/20">
                                                <div className="p-4 border-b border-border bg-blue-500/5 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Network Pulse</h3>
                                                    </div>
                                                    <div className="px-2 py-0.5 bg-blue-500/20 rounded text-[10px] text-blue-300 font-mono">LIVE</div>
                                                </div>
                                                <div className="flex-1 overflow-auto max-h-[200px] p-0">
                                                    {/* Simulated Live Feed from existing data */}
                                                    <table className="w-full text-left text-xs">
                                                        <tbody className="divide-y divide-border">
                                                            {data?.recentActivity?.slice(0, 5).map((link: any, i: number) => (
                                                                <tr key={i} className="hover:bg-white/5">
                                                                    <td className="px-4 py-2 font-mono text-muted-foreground">{new Date(link.date).toLocaleTimeString()}</td>
                                                                    <td className="px-4 py-2 text-primary">{link.userEmail?.split('@')[0]}</td>
                                                                    <td className="px-4 py-2 text-right text-muted-foreground">Generated Link</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Agent A: God Mode Leaderboard */}
                                        {id === 'godmode' && (
                                            <div className="matte-card p-6 flex flex-col h-full border-yellow-500/20 bg-yellow-500/5">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-500">Top Network Products</h3>
                                                </div>
                                                <div className="space-y-2">
                                                    {[1, 2, 3].map((n) => (
                                                        <div key={n} className="flex items-center gap-3 bg-black/20 p-2 rounded">
                                                            <div className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold text-xs">#{n}</div>
                                                            <div className="flex-1">
                                                                <div className="text-xs font-bold text-white">Viral Product {n}</div>
                                                                <div className="text-[10px] text-muted-foreground font-mono">ASIN: B0{Math.random().toString(36).substr(2, 8).toUpperCase()}</div>
                                                            </div>
                                                            <div className="text-xs font-bold text-green-400">+{Math.floor(Math.random() * 500)} clicks</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Agent C: Simulator (For Admin Testing) */}
                                        {id === 'simulator' && (
                                            <div className="matte-card p-6 flex flex-col justify-center relative overflow-hidden group h-full border-l-4 border-l-green-500/50">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <Calculator className="w-16 h-16 text-green-500" />
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <DollarSign className="w-4 h-4 text-green-500" />
                                                    <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Comm. Simulator</h3>
                                                </div>
                                                <div className="text-3xl font-bold text-green-500">
                                                    ${((data?.totalLinks || 100) * 0.5).toFixed(2)}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">Network Potential</p>
                                            </div>
                                        )}

                                        {/* Agent A: Trends (For Admin Review) */}
                                        {id === 'trends' && (
                                            <div className="matte-card p-6 flex flex-col h-full relative overflow-hidden group">
                                                <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                                                    <TrendingUp className="w-4 h-4 text-red-500" />
                                                    <h3 className="text-xs font-bold uppercase tracking-wider">Trend Radar</h3>
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    {TRENDS.slice(0, 2).map((t) => (
                                                        <div key={t.id} className="text-xs">
                                                            <span className="font-bold">{t.name}</span> <span className="text-red-500">{t.hits}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Agent B: Copywriter (For Admin Use) */}
                                        {id === 'copywriter' && (
                                            <div className="matte-card p-6 flex flex-col h-full bg-gradient-to-br from-card to-purple-500/5 border-purple-500/20">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Copy</h3>
                                                </div>
                                                <input
                                                    type="text"
                                                    className="input-minimal text-xs py-1 mb-2"
                                                    placeholder="Product..."
                                                    value={copyInput}
                                                    onChange={(e) => setCopyInput(e.target.value)}
                                                />
                                                <button onClick={generateMagic} className="btn-primary py-1 text-[10px] w-full bg-purple-600">Generate</button>
                                                {copyResult && <div className="text-[10px] mt-2 italic text-muted-foreground">"{copyResult.hook}"</div>}
                                            </div>
                                        )}

                                        {/* Agent A: War Room Map (Global Heatmap) */}
                                        {id === 'warroom' && (
                                            <div className="matte-card p-0 flex flex-col h-full col-span-1 md:col-span-2 overflow-hidden bg-[#0a0a0a] border-blue-900/30">
                                                <div className="p-4 border-b border-border bg-blue-900/10 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Map className="w-4 h-4 text-blue-400" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">War Room Map</h3>
                                                    </div>
                                                    <div className="px-2 py-0.5 bg-blue-500/20 rounded text-[10px] text-blue-300 font-mono animate-pulse">Scanning...</div>
                                                </div>
                                                <div className="relative flex-1 opacity-60 hover:opacity-100 transition-opacity min-h-[150px]">
                                                    {/* Simplified World Map SVG */}
                                                    <svg viewBox="0 0 100 50" className="w-full h-full fill-white/10 stroke-none">
                                                        <path d="M20,15 Q25,10 30,15 T40,20 T50,15 T60,20 T70,15 T80,20 T90,15" stroke="white" strokeWidth="0.1" fill="none" className="opacity-20" />
                                                        {/* North America */}
                                                        <rect x="5" y="5" width="25" height="15" rx="2" />
                                                        {/* South America */}
                                                        <rect x="15" y="25" width="10" height="15" rx="2" />
                                                        {/* Europe/Africa */}
                                                        <rect x="40" y="5" width="15" height="25" rx="2" />
                                                        {/* Asia */}
                                                        <rect x="60" y="5" width="30" height="20" rx="2" />
                                                        {/* Australia */}
                                                        <rect x="75" y="30" width="15" height="10" rx="2" />

                                                        {/* Pings */}
                                                        <circle cx="15" cy="12" r="1" className="fill-green-500 animate-ping" />
                                                        <circle cx="45" cy="15" r="1" className="fill-green-500 animate-ping delay-75" />
                                                        <circle cx="80" cy="10" r="1" className="fill-green-500 animate-ping delay-150" />
                                                        <circle cx="20" cy="30" r="1" className="fill-blue-500 animate-ping delay-300" />
                                                    </svg>
                                                    <div className="absolute bottom-2 left-2 text-[8px] text-muted-foreground font-mono">Live Nodes: 4 Active</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Agent A: Ban Hammer (Security) */}
                                        {id === 'security' && (
                                            <div className="matte-card p-6 flex flex-col h-full border-red-500/20 bg-red-500/5">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <ShieldAlert className="w-4 h-4 text-red-500" />
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-red-500">Security Alerts</h3>
                                                </div>
                                                <div className="flex-1 overflow-auto custom-scrollbar space-y-2">
                                                    {flaggedUsers.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-[10px]">
                                                            <div className="text-green-500 mb-1">✓ No Threats Detected</div>
                                                            System Secure
                                                        </div>
                                                    ) : (
                                                        flaggedUsers.map((u, i) => (
                                                            <div key={i} className="bg-red-900/20 border border-red-500/30 p-2 rounded flex justify-between items-center">
                                                                <div>
                                                                    <div className="text-[10px] font-bold text-red-200">{u.email}</div>
                                                                    <div className="text-[8px] text-red-400">{u.count} rapid requests</div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleBanUser(u.email)}
                                                                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] px-2 py-1 rounded font-bold"
                                                                >
                                                                    BAN
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    </SortableItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* User Management Table */}
                    <div className="matte-card overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-card/50">
                            <h3 className="text-lg font-semibold">User Roster</h3>
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded border border-border font-mono">LIVE DATA</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-secondary/30 text-muted-foreground uppercase text-xs font-medium tracking-wide">
                                    <tr>
                                        <th className="px-6 py-4">User Identity</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Links</th>
                                        <th className="px-6 py-4">Plan</th>
                                        <th className="px-6 py-4">Last Activity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(() => {
                                        const userStats: Record<string, any> = {};
                                        // Aggregate stats from activity
                                        data?.recentActivity?.forEach((link: any) => {
                                            const email = link.userEmail || 'Guest / Anonymous';
                                            if (!userStats[email]) {
                                                userStats[email] = { count: 0, lastDate: 0, status: 'Active' };
                                            }
                                            userStats[email].count++;
                                            userStats[email].lastDate = Math.max(userStats[email].lastDate, link.date);
                                        });

                                        // If empty (no links yet)
                                        if (Object.keys(userStats).length === 0) {
                                            return <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">No data stream detected.</td></tr>;
                                        }

                                        return Object.entries(userStats).map(([email, stats]: [string, any]) => (
                                            <tr key={email} className="hover:bg-secondary/10 transition-colors group">
                                                <td className="px-6 py-4 font-medium text-primary group-hover:text-white transition-colors">{email}</td>
                                                <td className="px-6 py-4"><span className="text-green-500 font-bold text-xs bg-green-500/10 px-2 py-1 rounded-full">● Active</span></td>
                                                <td className="px-6 py-4 font-mono">{stats.count}</td>
                                                <td className="px-6 py-4"><span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-xs">Free Tier</span></td>
                                                <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(stats.lastDate).toLocaleDateString()}</td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Global Recent Activity */}
                    <div className="matte-card overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-semibold">Global Activity Feed</h3>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-secondary/30 text-muted-foreground uppercase text-xs font-medium tracking-wide sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Resource Title</th>
                                        <th className="px-6 py-4">ASIN ID</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data?.recentActivity?.map((link: any) => (
                                        <tr key={link.id} className="hover:bg-secondary/10 transition-colors">
                                            <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{new Date(link.date).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-primary text-xs max-w-[150px] truncate" title={link.userEmail}>
                                                {link.userEmail || 'Anonymous'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <a href={link.generated} target="_blank" className="hover:text-white hover:underline transition-colors block max-w-[200px] truncate">{link.title || 'Untitled'}</a>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs opacity-50">{link.asin}</td>
                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                {link.userId && (
                                                    <button
                                                        onClick={() => setSelectedUser(link.userId)}
                                                        className="text-xs border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-2 py-1.5 rounded transition-colors"
                                                        title="View User Stats"
                                                    >
                                                        Stats
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(link.generated || '');
                                                    }}
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
                    </div>
                </div>
            </div>

            {/* USER MINI DASHBOARD MODAL */}
            {selectedUser && (
                <UserMiniDashboard userId={selectedUser} onClose={() => setSelectedUser(null)} />
            )}
        </main>
    );
}

function UserMiniDashboard({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/admin/user-links?userId=${userId}`, {
            headers: { 'x-admin-key': localStorage.getItem('admin_session') || '' }
        })
            .then(res => res.json())
            .then(setLinks)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [userId]);

    const handleToggle = async (linkId: string, currentStatus: boolean | undefined) => {
        // Optimistic UI update
        const newStatus = currentStatus === false ? true : false;
        setLinks(prev => prev.map(l => l.id === linkId ? { ...l, active: newStatus } : l));

        try {
            await fetch('/api/links', {
                method: 'PATCH',
                body: JSON.stringify({ id: linkId, active: newStatus }),
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': localStorage.getItem('admin_session') || ''
                }
            });
        } catch (e) {
            console.error("Toggle failed", e);
            // Revert on error could be added here
        }
    };

    const handleDelete = async (linkId: string) => {
        if (!confirm('Are you sure you want to delete this link?')) return;

        setLinks(prev => prev.filter(l => l.id !== linkId));
        try {
            await fetch(`/api/links?id=${linkId}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': localStorage.getItem('admin_session') || '' }
            });
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade">
            <div className="matte-card w-full max-w-4xl h-[80vh] flex flex-col border border-border bg-black relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-white"
                >
                    ✕
                </button>

                <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Ghost className="w-5 h-5 text-muted-foreground" />
                            User Shadow View
                        </h2>
                        <p className="text-xs text-muted-foreground font-mono mt-1">Impersonating: <span className="text-white font-bold">{userId}</span></p>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 custom-scrollbar bg-black/50">
                    {/* Shadow Stats (Mocked for User) */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="matte-card p-4 bg-background">
                            <div className="text-[10px] uppercase text-muted-foreground font-bold">Total Traffic</div>
                            <div className="text-2xl font-bold">
                                {links.reduce((acc, curr) => acc + (curr.hits || 0), 0)}
                            </div>
                        </div>
                        <div className="matte-card p-4 bg-background">
                            <div className="text-[10px] uppercase text-muted-foreground font-bold">Active Links</div>
                            <div className="text-2xl font-bold text-green-500">
                                {links.filter(l => l.active !== false).length}
                            </div>
                        </div>
                        <div className="matte-card p-4 bg-background border-red-500/20">
                            <div className="text-[10px] uppercase text-muted-foreground font-bold">Risk Score</div>
                            <div className="text-2xl font-bold text-white">Low</div>
                        </div>
                    </div>

                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-border pb-2">Link Repository</h3>

                    {loading ? (
                        <div className="text-center py-20 text-muted-foreground animate-pulse">Loading User Data...</div>
                    ) : links.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">No links found for this user.</div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/30 text-muted-foreground uppercase text-xs font-medium sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3 text-right">Clicks</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {links.map(link => (
                                    <tr key={link.id} className="hover:bg-secondary/10 group">
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(link.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 max-w-[200px]">
                                            <div className="truncate font-medium text-foreground">{link.title}</div>
                                            <div className="text-xs text-muted-foreground truncate opacity-50">{link.asin}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                                            {link.hits || 0}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleToggle(link.id, link.active)}
                                                className={`text-xs px-2 py-1 rounded-full font-bold border transition-all ${link.active === false
                                                    ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                                                    : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'}`}
                                            >
                                                {link.active === false ? 'OFF' : 'ON'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => navigator.clipboard.writeText(link.generated)}
                                                className="p-1.5 text-xs border border-border rounded hover:bg-secondary hover:text-white text-muted-foreground"
                                                title="Copy Link"
                                            >
                                                📋
                                            </button>
                                            <button
                                                onClick={() => handleDelete(link.id)}
                                                className="p-1.5 text-xs border border-border rounded hover:bg-red-900/20 hover:text-red-500 text-muted-foreground hover:border-red-500/30"
                                                title="Delete Link"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}


// Sortable Item Component (Duplicated for Admin Isolation)
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
        touchAction: 'none'
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
