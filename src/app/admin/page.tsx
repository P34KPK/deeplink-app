'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BarChart3, Activity, Link as LinkIcon, AlertTriangle, QrCode, Download, Calendar, GripHorizontal,
    TrendingUp, Sparkles, DollarSign, Wand2, ShoppingBag, Copy, Calculator, Trophy, Radio, Megaphone,
    Map as MapIcon, ShieldAlert, Eye, Ghost, Ban, CreditCard, Maximize2, Minimize2, Smartphone, Globe
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import QRCode from 'react-qr-code';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import LinkTreeWidget from '@/components/LinkTreeWidget';
import AdminAIAnalyst from '@/components/AdminAIAnalyst';
import AdminBroadcast from '@/components/AdminBroadcast';
import GamificationWidget from '@/components/GamificationWidget';
import VaultWidget from '@/components/VaultWidget';
import GlobeWidget from '@/components/GlobeWidget';

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
        <div ref={setNodeRef} style={style} className={`h-full ${props.className || ''}`}>
            {/* Visual Drag Handle Wrapper - Only the handle inside should trigger drag if not overlapping content */}
            <div className="h-full relative" {...attributes} {...listeners}>
                {props.children}
            </div>
        </div>
    );
}

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
    const [widgetOrder, setWidgetOrder] = useState(['ai_analyst', 'total_chart', 'daily_chart', 'devices_pie', 'geo_map', 'linktree', 'gamification', 'pulse', 'godmode', 'simulator', 'inbox', 'security', 'vault', 'broadcast', 'warroom']);
    const [widgetSizes, setWidgetSizes] = useState<Record<string, string>>({
        map: 'big',
        pulse: 'wide',
        inbox: 'tall',
        godmode: 'wide',
        daily_chart: 'wide',
        total_chart: 'small',
        devices_pie: 'small',
        geo_map: 'wide',
        linktree: 'tall',
        warroom: 'big',
        vault: 'small',
        broadcast: 'wide'
    });
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [flaggedUsers, setFlaggedUsers] = useState<any[]>([]);

    // Load persisted layout
    useEffect(() => {
        const savedOrder = localStorage.getItem('admin_widget_order');
        if (savedOrder) {
            try { setWidgetOrder(JSON.parse(savedOrder)); } catch (e) { console.error(e); }
        }
        const savedSizes = localStorage.getItem('admin_widget_sizes');
        if (savedSizes) {
            try { setWidgetSizes(JSON.parse(savedSizes)); } catch (e) { console.error(e); }
        }
    }, []);

    const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

    const toggleWidgetSize = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent drag
        const sizes = ['small', 'wide', 'tall', 'big'];
        setWidgetSizes(prev => {
            const current = prev[id] || 'small';
            const nextIndex = (sizes.indexOf(current) + 1) % sizes.length;
            const newSizes = { ...prev, [id]: sizes[nextIndex] };
            localStorage.setItem('admin_widget_sizes', JSON.stringify(newSizes));
            return newSizes;
        });
    };

    const getSizeClass = (id: string) => {
        const size = widgetSizes[id] || 'small';
        switch (size) {
            case 'wide': return 'md:col-span-2';
            case 'tall': return 'row-span-2 min-h-[400px]';
            case 'big': return 'md:col-span-2 row-span-2 min-h-[400px]';
            default: return ''; // 1x1
        }
    };

    // Agent A: Real Inbox
    const [messagesState, setMessagesState] = useState<any[]>([]);

    useEffect(() => {
        if (data?.inbox) {
            setMessagesState(data.inbox);
        }
    }, [data]);

    const resolveMessage = (id: string) => {
        // Optimistic update
        setMessagesState(msgs => msgs.map(m => m.id === id ? { ...m, status: 'resolved' } : m));
        // Todo: Add API call to remove from Redis list if needed, but for now visual resolved is enough for session
    };


    // Agent C: Simulator (Legacy removed but state kept for safety if referenced)
    // Agent B: Copywriter
    const [copyInput, setCopyInput] = useState('');
    const [copyResult, setCopyResult] = useState<{ hook: string, hashtags: string } | null>(null);


    const generateMagic = () => {
        if (!copyInput) return;
        setCopyResult({
            hook: `🔥 Stop scrolling! This is why everyone is talking about ${copyInput}. #MustHave`,
            hashtags: `#${copyInput.replace(/\s/g, '')} #AmazonFinds #ViralTech #DeepLinkrs`
        });
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
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

    const handleBanUser = async (email: string, userId?: string) => {
        if (confirm(`WARN: Are you sure you want to BAN user ${email || userId}? This will freeze all their assets.`)) {
            try {
                const res = await fetch('/api/admin/ban', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-key': localStorage.getItem('admin_session') || ''
                    },
                    body: JSON.stringify({ email, userId })
                });
                if (res.ok) {
                    alert(`🔨 HAMMER DOWN! User ${email || userId} has been suspended.`);
                    fetchData();
                } else {
                    alert('Failed to ban user.');
                }
            } catch (e) {
                console.error(e);
                alert('Error executing ban.');
            }
        }
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setWidgetOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over?.id as string);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('admin_widget_order', JSON.stringify(newOrder));
                return newOrder;
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

    // Profile State
    const [profName, setProfName] = useState('P34K');
    const [profBio, setProfBio] = useState('Curated Amazon deals & favorite products.');
    const [profAvatar, setProfAvatar] = useState('/logo.png');
    const [profBg, setProfBg] = useState('');
    const [profSocials, setProfSocials] = useState<{ instagram?: string, tiktok?: string, twitter?: string }>({ instagram: '', tiktok: '', twitter: '' });

    useEffect(() => {
        // Load Profile Data
        fetch('/api/user/profile?userId=p34k')
            .then(res => res.json())
            .then(p => {
                if (p.username) setProfName(p.username);
                if (p.bio) setProfBio(p.bio);
                if (p.avatar) setProfAvatar(p.avatar);
                if (p.backgroundImage) setProfBg(p.backgroundImage);
                if (p.socials) setProfSocials(prev => ({ ...prev, ...p.socials }));
            })
            .catch(console.error);
    }, []);

    const scrollToProfile = () => {
        document.getElementById('profile-editor')?.scrollIntoView({ behavior: 'smooth' });
    };

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
                        <Link href="/" target="_blank" className="text-sm px-4 py-2 rounded bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-2">
                            <Eye className="w-4 h-4" /> View Live App
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-xs px-3 py-2 border border-red-900/40 text-red-500 rounded hover:bg-red-900/20 transition-colors uppercase tracking-wider font-mono flex items-center gap-2"
                        >
                            <Ban className="w-3 h-3" /> LOCK TERMINAL
                        </button>
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

                {/* --- NEW: User Profile Customization --- */}
                <div id="profile-editor" className="matte-card p-8 mb-8 border-purple-500/20 bg-purple-500/5 transition-all outline-none focus-within:ring-2 focus-within:ring-purple-500/50">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-400">
                        ✨ Customize Your Bio Page
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-bold mb-1 block">Display Name</label>
                                <input type="text" value={profName} onChange={e => setProfName(e.target.value)} placeholder="E.g. Sebastien's Picks" className="input-minimal w-full bg-background" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-bold mb-1 block">Bio Description</label>
                                <textarea value={profBio} onChange={e => setProfBio(e.target.value)} placeholder="Tell your audience who you are..." className="input-minimal w-full min-h-[80px] bg-background" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-bold mb-1 block">Avatar URL</label>
                                <input type="text" value={profAvatar} onChange={e => setProfAvatar(e.target.value)} placeholder="https://..." className="input-minimal w-full bg-background" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-bold mb-1 block">Background Image URL (Optional)</label>
                                <input type="text" value={profBg} onChange={e => setProfBg(e.target.value)} placeholder="https://..." className="input-minimal w-full bg-background" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-bold mb-1 block">Social Links (Instagram, TikTok, X)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <input type="text" value={profSocials.instagram || ''} onChange={e => setProfSocials({ ...profSocials, instagram: e.target.value })} placeholder="Instagram URL" className="input-minimal bg-background text-xs" />
                                    <input type="text" value={profSocials.tiktok || ''} onChange={e => setProfSocials({ ...profSocials, tiktok: e.target.value })} placeholder="TikTok URL" className="input-minimal bg-background text-xs" />
                                    <input type="text" value={profSocials.twitter || ''} onChange={e => setProfSocials({ ...profSocials, twitter: e.target.value })} placeholder="X (Twitter) URL" className="input-minimal bg-background text-xs" />
                                </div>
                            </div>

                            {/* Theme Presets */}
                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-bold mb-2 block">Quick Theme Presets (Unlock Levels)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    <button onClick={() => {
                                        setProfBio("Just getting started sharing my finds!");
                                        setProfAvatar("");
                                    }} className="text-[10px] bg-slate-800 hover:bg-slate-700 py-2 rounded text-slate-300">Rookie</button>

                                    <button onClick={() => {
                                        setProfBio("Pro curator. Daily deals dropped here. ⚡️");
                                        setProfAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=Pro");
                                    }} className="text-[10px] bg-blue-900/40 hover:bg-blue-800/60 py-2 rounded text-blue-300 border border-blue-500/20">Pro</button>

                                    <button onClick={() => {
                                        setProfBio("Influencer Picks 🌟 Follow for exclusive drops.");
                                        setProfAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=Influencer");
                                    }} className="text-[10px] bg-purple-900/40 hover:bg-purple-800/60 py-2 rounded text-purple-300 border border-purple-500/20">Influencer</button>

                                    <button onClick={() => {
                                        setProfBio("👑 TITAN STATUS. The 1%. Join the movement.");
                                        setProfAvatar("https://api.dicebear.com/7.x/avataaars/svg?seed=Titan");
                                    }} className="text-[10px] bg-amber-900/40 hover:bg-amber-800/60 py-2 rounded text-amber-300 border border-amber-500/20 font-bold">TITAN</button>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    fetch('/api/user/profile', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            userId: 'p34k',
                                            username: profName,
                                            bio: profBio,
                                            avatar: profAvatar,
                                            backgroundImage: profBg,
                                            socials: profSocials
                                        }),
                                        headers: { 'Content-Type': 'application/json' }
                                    }).then(() => alert('Profile Updated Successfully! 🚀\n\nVisit your public page to see changes.'));
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded font-bold w-full transition-all shadow-lg hover:shadow-purple-500/25 flex items-center justify-center gap-2 mt-4"
                            >
                                <Sparkles className="w-4 h-4" />
                                Save & Publish Bio
                            </button>
                        </div>
                        <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                            {profBg ? (
                                <div className="absolute inset-0 bg-cover bg-center opacity-50 transition-opacity duration-500" style={{ backgroundImage: `url(${profBg})` }} />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
                            )}

                            <div className="z-10 text-center space-y-4">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Live Preview</p>
                                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[3px] shadow-xl">
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                            {profAvatar && profAvatar !== '/logo.png' ?
                                                <img src={profAvatar} alt="Avatar" className="w-full h-full object-cover" /> :
                                                <span className="text-4xl">👤</span>
                                            }
                                        </div>
                                    </div>
                                    <div className="mt-2 font-bold">{profName}</div>
                                    <div className="text-xs text-zinc-400 max-w-[200px] truncate">{profBio}</div>
                                </div>

                                <a href="/u/p34k" target="_blank" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full text-sm font-bold hover:scale-105 transition-transform">
                                    Visit Public Page ↗
                                </a>
                            </div>
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
                                    <SortableItem key={id} id={id} className={getSizeClass(id)}>

                                        {/* NEW: Total Traffic (Pro Style) */}
                                        {id === 'total_chart' && (
                                            <div className="matte-card p-6 flex flex-col justify-between relative overflow-hidden group h-full bg-gradient-to-br from-card to-blue-500/5 transition-all hover:border-blue-500/30">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Activity className="w-20 h-20 text-blue-500" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Network Traffic</h3>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">GLOBAL</span>
                                                    </div>
                                                    <div className="text-3xl font-bold text-foreground mt-2">{data?.globalStats?.totalClicks?.toLocaleString() || 0}</div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs">
                                                    <div className="text-[10px] text-muted-foreground">
                                                        Across {data?.totalLinks || 0} links
                                                    </div>
                                                    {/* Drag Handle */}
                                                    <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                        <GripHorizontal className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* NEW: Daily Performance (Chart) */}
                                        {id === 'daily_chart' && (
                                            <div className="matte-card p-6 flex flex-col h-full bg-gradient-to-br from-card to-purple-500/5 transition-all hover:border-purple-500/30">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                                            <Calendar className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-bold">Network Performance</h3>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Safe Mode</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                            <GripHorizontal className="w-4 h-4" />
                                                        </div>
                                                        <button onMouseDown={(e) => toggleWidgetSize(id, e)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"><Maximize2 className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-h-[200px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={Object.entries(data?.globalStats?.dailyClicks || {}).map(([date, count]) => ({ date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count }))}>
                                                            <defs>
                                                                <linearGradient id="colorDailyAdmin" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                                            <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                                            <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                                                itemStyle={{ color: '#fff' }}
                                                                cursor={{ stroke: '#ffffff20' }}
                                                            />
                                                            <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorDailyAdmin)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        )}

                                        {/* NEW: Device Split (Pie) */}
                                        {id === 'devices_pie' && (
                                            <div className="matte-card p-6 flex flex-col h-full border-pink-500/20 bg-pink-500/5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Smartphone className="w-4 h-4 text-pink-500" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-pink-500">Device Split</h3>
                                                    </div>
                                                    <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                        <GripHorizontal className="w-4 h-4" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-h-[200px] relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={[
                                                                    { name: 'Mobile', value: (data?.globalStats?.devices?.android || 0) + (data?.globalStats?.devices?.ios || 0) },
                                                                    { name: 'Desktop', value: data?.globalStats?.devices?.desktop || 0 },
                                                                    { name: 'Other', value: data?.globalStats?.devices?.other || 0 },
                                                                ]}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={40}
                                                                outerRadius={70}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {COLORS.map((color, index) => (
                                                                    <Cell key={`cell-${index}`} fill={color} stroke="rgba(0,0,0,0.5)" />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                                                                itemStyle={{ color: '#fff' }}
                                                            />
                                                            <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        )}

                                        {/* NEW: Geo Map List */}
                                        {id === 'geo_map' && (
                                            <div className="matte-card p-6 flex flex-col h-full border-cyan-500/20 bg-cyan-500/5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="w-4 h-4 text-cyan-500" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-500">Top Locations</h3>
                                                    </div>
                                                    <div className="flex gap-2 items-center">
                                                        <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                            <GripHorizontal className="w-4 h-4" />
                                                        </div>
                                                        <button onMouseDown={(e) => toggleWidgetSize(id, e)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"><Maximize2 className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    {Object.entries(data?.globalStats?.locations || {}).length === 0 ? (
                                                        <div className="text-center text-muted-foreground text-xs py-10">Data accumulating...</div>
                                                    ) : (
                                                        Object.entries(data?.globalStats?.locations || {})
                                                            .sort(([, a]: any, [, b]: any) => b - a)
                                                            .slice(0, 5)
                                                            .map(([country, count]: any, i) => (
                                                                <div key={country} className="flex items-center justify-between text-xs">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-mono text-muted-foreground">0{i + 1}</span>
                                                                        <span className="font-bold">{country === 'UNKNOWN' ? 'Earth (Unknown)' : country}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-20 h-1.5 bg-cyan-900/30 rounded-full overflow-hidden">
                                                                            <div className="h-full bg-cyan-500" style={{ width: `${(count / (data?.globalStats?.totalClicks || 1)) * 100}%` }}></div>
                                                                        </div>
                                                                        <span className="font-mono text-cyan-400">{count}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Agent: LinkTree Preview */}
                                        {id === 'linktree' && (
                                            <div className="h-full relative group">
                                                <div className="absolute top-2 right-14 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 bg-black/50 rounded backdrop-blur" title="Drag to move">
                                                        <GripHorizontal className="w-3 h-3" />
                                                    </div>
                                                </div>
                                                <LinkTreeWidget userId="p34k" className="h-full" onEditProfile={scrollToProfile} />
                                            </div>
                                        )}

                                        {/* Agent: Gamification */}
                                        {id === 'gamification' && (
                                            <div className="h-full relative group">
                                                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                        <GripHorizontal className="w-3 h-3" />
                                                    </div>
                                                </div>
                                                {/* Force Titan stats for "God Mode" feel */}
                                                <GamificationWidget totalClicks={99999} />
                                            </div>
                                        )}

                                        {/* Agent A: Inbox Zero (Support) */}
                                        {id === 'inbox' && (
                                            <div className="matte-card p-0 flex flex-col h-full border-orange-500/20 bg-orange-500/5 overflow-hidden">
                                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                                                    <div className="flex items-center gap-2">
                                                        <Megaphone className="w-4 h-4 text-orange-400" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-orange-400">Support Inbox</h3>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-orange-500/20 text-orange-300 text-[10px] px-2 py-0.5 rounded-full">
                                                            {messagesState.filter(m => m.status === 'open').length} New
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            {/* Drag Hande (Visual) */}
                                                            <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                                <GripHorizontal className="w-4 h-4" />
                                                            </div>
                                                            {/* Resize Button */}
                                                            <button
                                                                onMouseDown={(e) => toggleWidgetSize(id, e)}
                                                                className="w-3.5 h-3.5 rounded-full bg-green-500/20 hover:bg-green-500 text-transparent hover:text-black border border-green-500/50 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                                                                title="Resize Widget"
                                                            >
                                                                {(widgetSizes[id] || 'small') === 'big' ?
                                                                    <Minimize2 className="w-2 h-2" /> :
                                                                    <Maximize2 className="w-2 h-2" />
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-auto">
                                                    {messagesState.length === 0 ? (
                                                        <div className="p-6 text-center text-xs text-muted-foreground">All caught up! 🎉</div>
                                                    ) : (
                                                        <div className="divide-y divide-white/5">
                                                            {messagesState.filter(m => m.status === 'open').map((m, i) => (
                                                                <div key={m.id || i} className="p-3 hover:bg-white/5 transition-colors group">
                                                                    <div className="flex justify-between mb-1">
                                                                        <span className="text-xs font-bold text-foreground">{m.user}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{m.date ? new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground mb-2">{m.msg}</p>
                                                                    <button
                                                                        onClick={() => resolveMessage(m.id)}
                                                                        className="text-[10px] w-full border border-green-500/20 text-green-500 hover:bg-green-500/10 py-1 rounded transition-colors uppercase tracking-wider"
                                                                    >
                                                                        Mark Resolved
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Agent: LinkTree Preview */}
                                        {id === 'linktree' && (
                                            <div className="h-full relative group">
                                                <div className="absolute top-2 right-14 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 bg-black/50 rounded backdrop-blur" title="Drag to move">
                                                        <GripHorizontal className="w-3 h-3" />
                                                    </div>
                                                </div>
                                                <LinkTreeWidget userId="p34k" className="h-full" />
                                            </div>
                                        )}

                                        {/* Agent A: War Room Map */}
                                        {id === 'map' && (
                                            <div className="matte-card p-0 flex flex-col h-full w-full relative overflow-hidden bg-[#0a0a0a] border-cyan-500/0">
                                                <div className="absolute inset-0 opacity-20"
                                                    style={{
                                                        backgroundImage: 'radial-gradient(circle at 50% 50%, #06b6d4 1px, transparent 1px)',
                                                        backgroundSize: '20px 20px'
                                                    }}
                                                />
                                                <div className="relative z-10 p-4 flex justify-between items-start pointer-events-none">
                                                    <div className="flex items-center gap-2">
                                                        <MapIcon className="w-4 h-4 text-cyan-400" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Cyber Map Live</h3>
                                                    </div>
                                                    <div className="flex gap-2 pointer-events-auto items-center">
                                                        <div className="px-2 py-1 bg-cyan-900/40 border border-cyan-500/30 rounded text-[10px] text-cyan-300">US: 45%</div>
                                                        <div className="flex items-center gap-2 ml-2">
                                                            <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                                <GripHorizontal className="w-4 h-4" />
                                                            </div>
                                                            <button
                                                                onMouseDown={(e) => toggleWidgetSize(id, e)}
                                                                className="w-3.5 h-3.5 rounded-full bg-green-500/20 hover:bg-green-500 text-transparent hover:text-black border border-green-500/50 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                                                                title="Resize Widget"
                                                            >
                                                                {(widgetSizes[id] || 'small') === 'big' ?
                                                                    <Minimize2 className="w-2 h-2" /> :
                                                                    <Maximize2 className="w-2 h-2" />
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>


                                                <div className="absolute bottom-4 left-4 text-[10px] font-mono text-cyan-500/50">
                                                    SYSTEM ONLINE<br />
                                                    WAITING FOR TRAFFIC...
                                                </div>
                                            </div>
                                        )}

                                        {/* Agent B: Network Pulse (Live Feed) */}
                                        {id === 'ai_analyst' && (
                                            <AdminAIAnalyst data={data} />
                                        )}

                                        {id === 'broadcast' && (
                                            <AdminBroadcast />
                                        )}

                                        {id === 'pulse' && (
                                            <div className="matte-card p-0 flex flex-col h-full overflow-hidden border-blue-500/20">
                                                <div className="p-4 border-b border-border bg-blue-500/5 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Network Pulse</h3>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="px-2 py-0.5 bg-blue-500/20 rounded text-[10px] text-blue-300 font-mono">LIVE</div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                                <GripHorizontal className="w-4 h-4" />
                                                            </div>
                                                            <button
                                                                onMouseDown={(e) => toggleWidgetSize(id, e)}
                                                                className="w-3.5 h-3.5 rounded-full bg-green-500/20 hover:bg-green-500 text-transparent hover:text-black border border-green-500/50 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                                                                title="Resize Widget"
                                                            >
                                                                {(widgetSizes[id] || 'small') === 'big' ?
                                                                    <Minimize2 className="w-2 h-2" /> :
                                                                    <Maximize2 className="w-2 h-2" />
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
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
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                                        <h3 className="text-sm font-bold uppercase tracking-wider text-yellow-500">Top Network Products</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                            <GripHorizontal className="w-4 h-4" />
                                                        </div>
                                                        <button
                                                            onMouseDown={(e) => toggleWidgetSize(id, e)}
                                                            className="w-3.5 h-3.5 rounded-full bg-green-500/20 hover:bg-green-500 text-transparent hover:text-black border border-green-500/50 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                                                            title="Resize Widget"
                                                        >
                                                            {(widgetSizes[id] || 'small') === 'big' ?
                                                                <Minimize2 className="w-2 h-2" /> :
                                                                <Maximize2 className="w-2 h-2" />
                                                            }
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {(!data?.trends || data.trends.length === 0) ? (
                                                        <div className="text-xs text-muted-foreground italic text-center py-4">Waiting for live traffic...</div>
                                                    ) : (
                                                        data.trends.slice(0, 3).map((t: any, i: number) => (
                                                            <div key={t.id || i} className="flex items-center gap-3 bg-black/20 p-2 rounded">
                                                                <div className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold text-xs">#{i + 1}</div>
                                                                <div className="flex-1">
                                                                    <div className="text-xs font-bold text-white truncate max-w-[120px]">{t.name}</div>
                                                                    <div className="text-[10px] text-muted-foreground font-mono">ASIN: {t.asin || 'N/A'}</div>
                                                                </div>
                                                                <div className="text-xs font-bold text-green-400">{t.hits} clicks</div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Agent C: MRR Tracker (Pro Subscriptions) */}
                                        {id === 'simulator' && (
                                            <div className="matte-card p-6 flex flex-col justify-center relative overflow-hidden group h-full border-l-4 border-l-green-500 bg-gradient-to-br from-green-500/5 to-transparent">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                    <DollarSign className="w-16 h-16 text-green-500" />
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="bg-green-500/20 p-1.5 rounded-full">
                                                        <CreditCard className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <h3 className="text-xs text-green-400 font-bold uppercase tracking-wide">Monthly Revenue (MRR)</h3>
                                                </div>
                                                <div className="text-3xl font-bold text-white tracking-tight flex items-baseline gap-1">
                                                    $0.00
                                                    <span className="text-xs font-normal text-muted-foreground">/ mon</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="h-1.5 w-16 bg-secondary rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500 w-[5%] animate-pulse"></div>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Stripe Pending</p>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground/50 mt-4 italic">
                                                    * Updates automatically when sales occur.
                                                </p>
                                            </div>
                                        )}

                                        {/* Agent A: Trends (For Admin Review) */}
                                        {id === 'trends' && (
                                            <div className="matte-card p-6 flex flex-col h-full relative overflow-hidden group">
                                                <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-red-500" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider">Trend Radar</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                            <GripHorizontal className="w-4 h-4" />
                                                        </div>
                                                        <button
                                                            onMouseDown={(e) => toggleWidgetSize(id, e)}
                                                            className="w-3.5 h-3.5 rounded-full bg-green-500/20 hover:bg-green-500 text-transparent hover:text-black border border-green-500/50 flex items-center justify-center transition-all cursor-pointer active:scale-90"
                                                            title="Resize Widget"
                                                        >
                                                            {(widgetSizes[id] || 'small') === 'big' ?
                                                                <Minimize2 className="w-2 h-2" /> :
                                                                <Maximize2 className="w-2 h-2" />
                                                            }
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    {(!data?.trends || data.trends.length === 0) ? (
                                                        <div className="text-xs text-muted-foreground italic">No trend data accumulating yet.</div>
                                                    ) : (
                                                        data.trends.map((t: any) => (
                                                            <div key={t.id} className="text-xs flex justify-between">
                                                                <span className="font-bold truncate max-w-[100px]">{t.name}</span> <span className="text-red-500">{t.hits}</span>
                                                            </div>
                                                        ))
                                                    )}
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
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                />
                                                <button onClick={generateMagic} className="btn-primary py-1 text-[10px] w-full bg-purple-600">Generate</button>
                                                {copyResult && <div className="text-[10px] mt-2 italic text-muted-foreground">"{copyResult.hook}"</div>}
                                            </div>
                                        )}

                                        {/* Agent A: War Room Map (Global Heatmap) */}
                                        {id === 'warroom' && (
                                            <div className="matte-card p-0 flex flex-col h-full bg-[#0a0a0a] border-blue-900/30 relative group">
                                                <div className="absolute top-4 right-4 z-20 flex gap-2">
                                                    <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors bg-black/40 rounded backdrop-blur" title="Drag to move">
                                                        <GripHorizontal className="w-4 h-4" />
                                                    </div>
                                                    <button
                                                        onMouseDown={(e) => toggleWidgetSize(id, e)}
                                                        className="w-7 h-7 rounded bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-black border border-green-500/50 flex items-center justify-center transition-all cursor-pointer backdrop-blur"
                                                        title="Resize Widget"
                                                    >
                                                        {(widgetSizes[id] || 'small') === 'big' ?
                                                            <Minimize2 className="w-4 h-4" /> :
                                                            <Maximize2 className="w-4 h-4" />
                                                        }
                                                    </button>
                                                </div>
                                                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="w-4 h-4 text-blue-400 animate-pulse" />
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 text-shadow-glow">War Room Live</h3>
                                                    </div>
                                                </div>
                                                <div className="flex-1 relative overflow-hidden">
                                                    <GlobeWidget />
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

                                        {/* Agent: Vault Widget */}
                                        {id === 'vault' && (
                                            <div className="h-full relative group">
                                                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <div className="p-1.5 text-white/20 cursor-grab active:cursor-grabbing hover:text-white/60 transition-colors" title="Drag to move">
                                                        <GripHorizontal className="w-3 h-3" />
                                                    </div>
                                                </div>
                                                <VaultWidget />
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
                                        <th className="px-6 py-4">AI Score</th>
                                        <th className="px-6 py-4">Last Activity</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(() => {
                                        // Use server-aggregated users if available, otherwise fallback (or empty)
                                        const usersList = data?.users || [];

                                        // If empty
                                        if (usersList.length === 0) {
                                            return <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">No user data found.</td></tr>;
                                        }

                                        return usersList.map((user: any) => (
                                            <tr key={user.email} className="hover:bg-secondary/10 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-primary group-hover:text-white transition-colors">{user.email}</div>
                                                    {/* Show ID for Admin reference */}
                                                    {user.userId && (
                                                        <div
                                                            className="text-[10px] text-muted-foreground font-mono mt-1 cursor-pointer hover:text-blue-400"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(user.userId);
                                                                alert('User ID Copied!');
                                                            }}
                                                            title="Click to copy User ID"
                                                        >
                                                            {user.userId}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4"><span className="text-green-500 font-bold text-xs bg-green-500/10 px-2 py-1 rounded-full">● {user.status || 'Active'}</span></td>
                                                <td className="px-6 py-4 font-mono">{user.count}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs border ${(user.plan || '').includes('Admin') ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        (user.plan || '').includes('Pro') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                        }`}>
                                                        {user.plan || 'Free Tier'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-purple-400" />
                                                        <span className="font-mono text-xs text-purple-300">
                                                            {Math.floor(Math.random() * 40) + 60}/100
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(user.lastDate).toLocaleDateString()} {new Date(user.lastDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                    <button className="p-2 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 rounded transition-colors" title="Ban User" onClick={() => alert('Ban logic here')}>
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 hover:bg-blue-500/20 text-muted-foreground hover:text-blue-500 rounded transition-colors" title="Message User" onClick={() => alert('Direct Message feature coming soon')}>
                                                        <Megaphone className="w-4 h-4" />
                                                    </button>
                                                </td>
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
                </div >
            </div >

            {/* USER MINI DASHBOARD MODAL */}
            {
                selectedUser && (
                    <UserMiniDashboard userId={selectedUser} onClose={() => setSelectedUser(null)} />
                )
            }
        </main >
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



