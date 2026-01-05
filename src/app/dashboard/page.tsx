'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3, Activity, Link as LinkIcon, Heart, QrCode, Download, Calendar, GripHorizontal, TrendingUp, Sparkles, DollarSign, Wand2, ShoppingBag, Copy, Calculator, Map, Globe, Share2, Settings, Megaphone, X, Trash, Image as ImageIcon, Camera } from 'lucide-react';
import QRCode from 'react-qr-code';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CheckoutButton from '@/components/CheckoutButton';
import GlobeWidget from '@/components/GlobeWidget';
import GamificationWidget from '@/components/GamificationWidget';
import AICopywriterModal from '@/components/AICopywriterModal';
import FreeDashboard from '@/components/dashboard/free/FreeDashboard';

type Stats = {
    totalClicks: number;
    globalLastClick: number;
    trends?: any[]; // Agent B: Real Trends
    broadcast?: {
        message: string;
        type: 'info' | 'warning' | 'urgent';
        date: number;
    };
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
    locations?: Record<string, number>;
    browsers?: Record<string, number>;
    referrers?: Record<string, number>;
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

import LinkTreeWidget from '@/components/LinkTreeWidget';

export default function Dashboard() {
    const { isSignedIn, isLoaded, userId } = useAuth();
    const [stats, setStats] = useState<any | null>(null); // Relaxed type for free/pro structure
    const [history, setHistory] = useState<ArchivedLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [qrLink, setQrLink] = useState<string | null>(null); // State for QR Modal
    const [qrColor, setQrColor] = useState('#000000'); // QR Studio
    const [qrBg, setQrBg] = useState('#ffffff');
    const [aiModal, setAiModal] = useState<{ open: boolean, title: string, link: string }>({ open: false, title: '', link: '' }); // AI Writer
    const [widgetOrder, setWidgetOrder] = useState<string[]>([]);
    const [showProfileEditor, setShowProfileEditor] = useState(false);

    // Load persisted layout
    useEffect(() => {
        const saved = localStorage.getItem('dashboard_layout_v1');
        if (saved) {
            try {
                setWidgetOrder(JSON.parse(saved));
            } catch (e) {
                // Fallback dict
                setWidgetOrder(['gamification', 'total', 'linktree', 'simulator', 'prime', 'devices', 'locations', 'browsers', 'referrers', 'daily', 'trends']);
            }
        } else {
            setWidgetOrder(['gamification', 'total', 'linktree', 'simulator', 'prime', 'devices', 'locations', 'browsers', 'referrers', 'daily', 'trends']);
        }
    }, []);

    const [userProfile, setUserProfile] = useState<any>({ username: '', bio: '', socials: {} });
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // AI Mockup State
    const [mockupModal, setMockupModal] = useState<{ open: boolean; linkId: string; url: string; title: string } | null>(null);


    const [expandedWidgets, setExpandedWidgets] = useState<string[]>(['daily', 'trends']);

    const toggleWidgetSize = (id: string) => {
        setExpandedWidgets(prev =>
            prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        if (userId) {
            fetch('/api/user/profile').then(res => res.json()).then(data => {
                if (data && !data.error) setUserProfile(data);
            });
        }
    }, [userId]);

    const updateProfile = (field: string, value: any) => {
        setUserProfile((prev: any) => ({ ...prev, [field]: value }));
    };
    const updateSocial = (platform: string, value: string) => {
        setUserProfile((prev: any) => ({
            ...prev,
            socials: { ...prev.socials, [platform]: value }
        }));
    };
    const saveProfile = async () => {
        const res = await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userProfile)
        });
        if (res.ok) alert('Profile updated!');
    };

    const generateBackground = () => {
        const prompt = window.prompt("✨ AI Background Generator\n\nDescribe the vibe you want (e.g., 'cyberpunk city neon rain', 'pastel clouds aesthetic'):", "aesthetic gradient abstract");
        if (prompt === null) return;

        setIsGenerating(true);
        const finalPrompt = prompt || "aesthetic gradient abstract";
        const seed = Math.floor(Math.random() * 1000000);

        // Point directly to our local proxy. The browser loads this as an image.
        // This solves CORS, AdBlock, and referer issues.
        const proxyUrl = `/api/ai/generate-image?prompt=${encodeURIComponent(finalPrompt)}&seed=${seed}`;

        setPendingImage(proxyUrl);
    };

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

    // Agent: Link Health Check
    const [health, setHealth] = useState<Record<string, 'loading' | 'ok' | 'dead'>>({});
    const checkLink = async (id: string, url: string) => {
        setHealth(prev => ({ ...prev, [id]: 'loading' }));
        try {
            const res = await fetch('/api/link-health', {
                method: 'POST',
                body: JSON.stringify({ url }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            setHealth(prev => ({ ...prev, [id]: data.status === 'alive' || data.code === 200 ? 'ok' : 'dead' }));
        } catch (e) {
            setHealth(prev => ({ ...prev, [id]: 'dead' }));
        }
    };

    // Agent A: Trends Data (Real from Agent B)
    const activeTrends = stats?.trends || [
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
                const newOrder = arrayMove(items, oldIndex, newIndex);
                localStorage.setItem('dashboard_layout_v1', JSON.stringify(newOrder));
                return newOrder;
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

        // Broadcast System Polling (Independent of main stats)
        const pollBroadcast = async () => {
            try {
                const res = await fetch('/api/system/broadcast');
                if (res.ok) {
                    const msg = await res.json();
                    if (msg) {
                        setStats((prev: any) => ({ ...prev, broadcast: msg }));
                    } else {
                        // Clear broadcast if null
                        setStats((prev: any) => {
                            if (!prev) return prev;
                            const { broadcast, ...rest } = prev;
                            return rest;
                        });
                    }
                }
            } catch (e) {
                // Silent fail
            }
        };

        // Initial check + Interval
        pollBroadcast();
        const broadcastInterval = setInterval(pollBroadcast, 15000); // Check every 15s

        return () => clearInterval(broadcastInterval);
    }, [isLoaded, isSignedIn]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground animate-pulse">Loading analytics...</div>;
    }

    if (!stats) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Failed to load analytics.</div>;
    }

    // --- FREE PLAN DASHBOARD ---
    if (stats.plan === 'free') {
        return (
            <FreeDashboard
                stats={stats}
                history={history}
                handleCopy={handleCopy}
                copiedId={copiedId}
            />
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

    // --- AGENT: Data prep for new widgets --
    const locationData = stats?.locations ? Object.entries(stats.locations as Record<string, number>).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) : [];
    const browserData = stats?.browsers ? Object.entries(stats.browsers as Record<string, number>).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) : [];
    const referrerData = stats?.referrers ? Object.entries(stats.referrers as Record<string, number>).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) : [];

    // --- AGENT C: Helper to find title ---
    const getProductTitle = (asin: string) => {
        const match = history.find(h => h.asin === asin);
        return match ? match.title : `ASIN: ${asin}`;
    };

    // --- AGENT D: Format Last Activity ---
    const getLastActivity = () => {
        if (!stats?.globalLastClick) return 'Never';
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
    const handleDeleteLink = async (id: string) => {
        if (!confirm('Are you sure you want to delete this link? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/links?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHistory(prev => prev.filter(l => l.id !== id));
            } else {
                alert('Failed to delete link');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting link');
        }
    };



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
                {stats?.broadcast && (
                    <div className={`p-4 rounded-lg border flex items-center gap-3 animate-fade-down ${stats.broadcast.type === 'urgent' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        stats.broadcast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-500'
                        }`}>
                        <Megaphone className="w-5 h-5 shrink-0" />
                        <div className="flex-1 text-sm font-medium">
                            <span className="font-bold uppercase mr-2 text-[10px] tracking-wider opacity-70 border border-current px-1 rounded">
                                {stats.broadcast.type}
                            </span>
                            {stats.broadcast.message}
                        </div>
                    </div>
                )}

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

                {/* Profile Editor Modal */}
                {showProfileEditor && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-10 md:pt-20 p-4 animate-in fade-in duration-200">
                        <div className="bg-[#09090b] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                            <button onClick={() => setShowProfileEditor(false)} className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700 shadow-sm">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-pink-500/10 rounded-lg">
                                    <Settings className="w-5 h-5 text-pink-500" />
                                </div>
                                <h2 className="text-xl font-bold">Edit Profile</h2>
                            </div>

                            <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1.5 block">Profile Picture</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="relative group cursor-pointer">
                                            {userProfile.avatarUrl ? (
                                                <img src={userProfile.avatarUrl} className="w-14 h-14 rounded-full border border-zinc-700 object-cover" alt="Preview" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
                                                    <span className="text-xs">?</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[8px] text-white font-bold uppercase">Edit</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (readerEvent) => {
                                                            const img = new Image();
                                                            img.onload = () => {
                                                                const canvas = document.createElement('canvas');
                                                                const MAX_SIZE = 400;
                                                                let width = img.width;
                                                                let height = img.height;

                                                                if (width > height) {
                                                                    if (width > MAX_SIZE) {
                                                                        height *= MAX_SIZE / width;
                                                                        width = MAX_SIZE;
                                                                    }
                                                                } else {
                                                                    if (height > MAX_SIZE) {
                                                                        width *= MAX_SIZE / height;
                                                                        height = MAX_SIZE;
                                                                    }
                                                                }
                                                                canvas.width = width;
                                                                canvas.height = height;
                                                                const ctx = canvas.getContext('2d');
                                                                ctx?.drawImage(img, 0, 0, width, height);
                                                                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                                                updateProfile('avatarUrl', dataUrl);
                                                            };
                                                            img.src = readerEvent.target?.result as string;
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-zinc-400 mb-2">Upload a profile picture. JPG, PNG or GIF.</p>
                                            <button className="text-[10px] border border-zinc-700 hover:bg-zinc-800 px-3 py-1.5 rounded text-zinc-300 transition-colors pointer-events-none">
                                                Click orb to upload
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1.5 block">Display Name</label>
                                    <input className="input-minimal w-full py-2 px-3 text-sm bg-zinc-900 border border-zinc-800 rounded-lg focus:border-pink-500 outline-none transition-colors" placeholder="e.g. Sarah's Picks" value={userProfile.username || ''} onChange={e => updateProfile('username', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1.5 block">Bio</label>
                                    <textarea className="input-minimal w-full py-2 px-3 text-sm resize-none h-20 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-pink-500 outline-none transition-colors" placeholder="Tell your audience about your style..." value={userProfile.bio || ''} onChange={e => updateProfile('bio', e.target.value)} />
                                </div>

                                {/* Theme Customization Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold block">Page Theme</label>
                                        <span className="text-[9px] text-pink-500 font-bold border border-pink-500/20 bg-pink-500/10 px-1.5 rounded">INFLUENCER UNLOCK</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['#000000', '#1a1a2e', '#2e1a1a', '#1a2e1a'].map(color => (
                                            <div key={color} className="h-8 rounded cursor-pointer border border-white/10 hover:border-white/50 transition-colors relative" style={{ backgroundColor: color }}>
                                                {/* Selection Logic would go here */}
                                            </div>
                                        ))}
                                        <button onClick={generateBackground} className="col-span-4 mt-1 flex items-center justify-center gap-2 py-2 rounded border border-dashed border-zinc-700 hover:border-pink-500 hover:text-pink-500 text-zinc-500 text-xs transition-colors group">
                                            <Wand2 className="w-3 h-3 group-hover:animate-pulse" />
                                            <span>{userProfile.backgroundImage ? 'Generate New Background' : 'Generate with AI'}</span>
                                        </button>

                                        {/* Pending Approval UI */}
                                        {(pendingImage || isGenerating) && (
                                            <div className="col-span-4 mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                                                <p className="text-[10px] text-zinc-400 mb-2 uppercase font-bold text-center">Preview</p>
                                                <div className="h-64 rounded-lg bg-zinc-950 mb-3 border border-zinc-700 shadow-inner relative overflow-hidden flex items-center justify-center">
                                                    {pendingImage && (
                                                        <img
                                                            src={pendingImage}
                                                            alt="AI Preview"
                                                            className={`w-full h-full object-contain transition-opacity duration-500 ${isGenerating ? 'opacity-0' : 'opacity-100'}`}
                                                            onLoad={() => setIsGenerating(false)}
                                                            onError={() => {
                                                                console.error("AI Image failed to load");
                                                                setIsGenerating(false);
                                                                setPendingImage(null);
                                                            }}
                                                        />
                                                    )}
                                                    {isGenerating && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm z-10">
                                                            <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setPendingImage(null); setIsGenerating(false); }}
                                                        className="flex-1 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-400 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        disabled={isGenerating}
                                                        onClick={() => {
                                                            updateProfile('backgroundImage', pendingImage);
                                                            setPendingImage(null);
                                                        }}
                                                        className={`flex-1 py-1.5 rounded text-xs font-bold text-black transition-colors shadow-lg shadow-green-500/20 ${isGenerating ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                                                    >
                                                        {isGenerating ? 'Generating...' : 'Apply Background'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Active Background UI */}
                                        {userProfile.backgroundImage && !pendingImage && (
                                            <div className="col-span-4 mt-2 h-20 rounded-lg bg-cover bg-center border border-zinc-800 relative group overflow-hidden" style={{ backgroundImage: `url(${userProfile.backgroundImage})` }}>
                                                <button onClick={() => updateProfile('backgroundImage', '')} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <span className="bg-black/40 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-bold">Active Background</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block">Social Links</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center gap-2 bg-zinc-900 px-3 rounded-lg border border-zinc-800">
                                            <span className="text-zinc-500 text-xs">Instagram</span>
                                            <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                                            <input className="bg-transparent border-none outline-none text-xs w-full py-2.5" placeholder="Profile URL" value={userProfile.socials?.instagram || ''} onChange={e => updateSocial('instagram', e.target.value)} />
                                        </div>
                                        <div className="flex items-center gap-2 bg-zinc-900 px-3 rounded-lg border border-zinc-800">
                                            <span className="text-zinc-500 text-xs">TikTok</span>
                                            <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                                            <input className="bg-transparent border-none outline-none text-xs w-full py-2.5" placeholder="Profile URL" value={userProfile.socials?.tiktok || ''} onChange={e => updateSocial('tiktok', e.target.value)} />
                                        </div>
                                        <div className="flex items-center gap-2 bg-zinc-900 px-3 rounded-lg border border-zinc-800">
                                            <span className="text-zinc-500 text-xs">YouTube</span>
                                            <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                                            <input className="bg-transparent border-none outline-none text-xs w-full py-2.5" placeholder="Channel URL" value={userProfile.socials?.youtube || ''} onChange={e => updateSocial('youtube', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setShowProfileEditor(false)} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-transparent border border-zinc-700 hover:bg-zinc-800 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={() => { saveProfile(); setShowProfileEditor(false); }} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20 transition-colors">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )
                }

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
                                <SortableItem
                                    key={id}
                                    id={id}
                                    className={`${expandedWidgets.includes(id) ? 'col-span-1 md:col-span-2' : ''}`}
                                    isExpanded={expandedWidgets.includes(id)}
                                    onToggleSize={['total', 'linktree', 'daily'].includes(id) ? undefined : () => toggleWidgetSize(id)}
                                >
                                    {/* Render Widget Content Based on ID */}

                                    {id === 'total' && (
                                        <div className="matte-card p-6 flex flex-col justify-between relative overflow-hidden group h-full bg-gradient-to-br from-card to-blue-500/5 transition-all hover:border-blue-500/30">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Activity className="w-20 h-20 text-blue-500" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Total Clicks</h3>
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">LIFETIME</span>
                                                </div>
                                                <div className="text-3xl font-bold text-foreground mt-2">{stats.totalClicks.toLocaleString()}</div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 text-green-400">
                                                    <TrendingUp className="w-3 h-3" />
                                                    <span className="font-bold">+12%</span>
                                                    <span className="text-muted-foreground text-[10px] font-normal">this week</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    Avg 24/day
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {id === 'linktree' && (
                                        <div className="h-full relative group">
                                            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <div className="p-1.5 text-muted-foreground/20 cursor-grab active:cursor-grabbing hover:text-foreground/60 bg-background/50 rounded backdrop-blur" title="Drag to move">
                                                    <GripHorizontal className="w-3 h-3" />
                                                </div>
                                            </div>
                                            <LinkTreeWidget userId={userId || 'guest'} className="h-full" onEditProfile={() => setShowProfileEditor(true)} />
                                        </div>
                                    )}
                                    {id === 'gamification' && (
                                        <div className="h-full">
                                            <GamificationWidget totalClicks={stats.totalClicks || 0} />
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
                                                {activeTrends.map((t: any) => (
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
                                        <div className="matte-card p-6 flex flex-col h-full bg-gradient-to-br from-card to-zinc-900/50">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-zinc-400" />
                                                    <h3 className="text-xs text-muted-foreground font-bold uppercase tracking-wider">7-Day Performance</h3>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded text-green-400 border border-green-500/20">
                                                    <TrendingUp className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold">Live</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 w-full min-h-[140px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={chartData}>
                                                        <defs>
                                                            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#fff" stopOpacity={0.1} />
                                                                <stop offset="95%" stopColor="#fff" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                        <XAxis
                                                            dataKey="date"
                                                            stroke="#666"
                                                            fontSize={10}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickFormatter={(value) => value.split('-').slice(1).join('/')}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                                                            itemStyle={{ color: '#fff' }}
                                                            cursor={{ stroke: '#ffffff20' }}
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
                                    {id === 'locations' && (
                                        <div className="matte-card p-0 flex flex-col h-full overflow-hidden relative group">
                                            {/* Globe Background */}
                                            <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <GlobeWidget />
                                            </div>

                                            {/* Content Overlay */}
                                            <div className="relative z-10 p-6 flex flex-col h-full bg-gradient-to-b from-black/0 via-black/40 to-black/90 pointer-events-none">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Map className="w-5 h-5 text-indigo-400" />
                                                    <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Live Traffic</h3>
                                                </div>
                                                {locationData.length === 0 ? <p className="text-xs text-muted-foreground mt-auto">Waiting for activity...</p> : (
                                                    <div className="space-y-2 overflow-auto max-h-[200px] mt-auto pointer-events-auto custom-scrollbar pr-2">
                                                        {locationData.slice(0, 5).map((l, i) => (
                                                            <div key={i} className="flex items-center justify-between text-xs backdrop-blur-md bg-white/5 p-2 rounded border border-white/10 hover:bg-white/10 transition-colors">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-lg">{l.name === 'US' ? '🇺🇸' : l.name === 'GB' ? '🇬🇧' : l.name === 'CA' ? '🇨🇦' : l.name === 'FR' ? '🇫🇷' : l.name === 'DE' ? '🇩🇪' : l.name}</span>
                                                                    <span className="text-white font-bold">{l.name}</span>
                                                                </div>
                                                                <span className="font-mono text-indigo-300">
                                                                    {((l.value / (stats.totalClicks || 1)) * 100).toFixed(0)}%
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {id === 'browsers' && (
                                        <div className="matte-card p-6 flex flex-col h-full overflow-hidden">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Globe className="w-5 h-5 text-teal-400" />
                                                <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Browsers & Apps</h3>
                                            </div>
                                            {browserData.length === 0 ? <p className="text-xs text-muted-foreground">No data yet</p> : (
                                                <div className="h-[150px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={browserData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                                                {browserData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {id === 'referrers' && (
                                        <div className="matte-card p-6 flex flex-col h-full overflow-hidden">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Share2 className="w-5 h-5 text-orange-400" />
                                                <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Top Sources</h3>
                                            </div>
                                            {referrerData.length === 0 ? <p className="text-xs text-muted-foreground">No data yet</p> : (
                                                <div className="space-y-3 overflow-auto max-h-[200px]">
                                                    {referrerData.slice(0, 5).map((l, i) => (
                                                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-secondary/20 rounded">
                                                            <span className="truncate max-w-[120px]" title={l.name}>{l.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold">{l.value}</span>
                                                                <span className="text-[10px] text-muted-foreground">({((l.value / (stats.totalClicks || 1)) * 100).toFixed(0)}%)</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
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
                                    const hits = stats?.statsBySlug?.[slug] || 0;
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
                                        const hits = stats?.statsBySlug?.[slug] || 0;
                                        const maxHits = Math.max(...Object.values((stats?.statsBySlug || {}) as Record<string, number>), 1);

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
                                                        onClick={() => setAiModal({ open: true, title: link.title, link: link.generated || '' })}
                                                        className="p-1.5 text-xs border border-purple-500/30 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500 hover:text-white transition-colors"
                                                        title="Generate AI Caption"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setMockupModal({ open: true, linkId: link.id, url: link.original, title: link.title })}
                                                        className="p-1.5 text-xs border border-pink-500/30 bg-pink-500/10 text-pink-400 rounded hover:bg-pink-500 hover:text-white transition-colors"
                                                        title="Create AI Mockup"
                                                    >
                                                        <Camera className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLink(link.id)}
                                                        className="p-1.5 text-xs border border-red-500/30 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors"
                                                        title="Delete Link"
                                                    >
                                                        <Trash className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => checkLink(link.id, link.original || link.generated)}
                                                        className={`p-1.5 text-xs border border-border rounded transition-colors ${health[link.id] === 'ok' ? 'text-green-500 border-green-500/50 bg-green-500/10' : health[link.id] === 'dead' ? 'text-red-500 border-red-500/50 bg-red-500/10' : 'text-muted-foreground hover:bg-secondary hover:text-white'}`}
                                                        title="Check Stock / Link Health"
                                                    >
                                                        {health[link.id] === 'loading' ? <Activity className="w-3 h-3 animate-spin" /> :
                                                            health[link.id] === 'ok' ? <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> :
                                                                health[link.id] === 'dead' ? <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> :
                                                                    <Activity className="w-3 h-3" />}
                                                    </button>
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
                        <div className="matte-card p-8 bg-white text-black flex flex-col items-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4 text-zinc-900">QR Studio</h3>

                            <div className="p-4 rounded-xl shadow-inner mb-6 transition-colors duration-300" style={{ backgroundColor: qrBg }}>
                                <QRCode value={qrLink} size={200} fgColor={qrColor} bgColor={qrBg} />
                            </div>

                            <div className="flex gap-4 w-full mb-4">
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Dots</label>
                                    <input type="color" value={qrColor} onChange={(e) => setQrColor(e.target.value)} className="w-full h-8 rounded cursor-pointer border-none p-0 bg-transparent" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Background</label>
                                    <input type="color" value={qrBg} onChange={(e) => setQrBg(e.target.value)} className="w-full h-8 rounded cursor-pointer border-none p-0 bg-transparent" />
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 break-all text-center max-w-[200px] mb-4 opacity-50">{qrLink}</p>

                            <div className="flex gap-2 w-full">
                                <button className="flex-1 py-2 rounded bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2" onClick={() => {
                                    // Simple download trigger
                                    alert('Download feature requires canvas adapter, coming in v2. Screenshot for now!');
                                }}>
                                    <Download className="w-4 h-4" />
                                    Save
                                </button>
                                <button
                                    onClick={() => setQrLink(null)}
                                    className="flex-1 py-2 text-sm text-gray-500 hover:text-black uppercase tracking-wider font-bold border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                aiModal.open && (
                    <AICopywriterModal
                        title={aiModal.title}
                        link={aiModal.link}
                        onClose={() => setAiModal({ ...aiModal, open: false })}
                    />
                )
            }
            {/* AI Mockup Modal */}
            <MockupGeneratorModal
                isOpen={!!mockupModal}
                onClose={() => setMockupModal(null)}
                productTitle={mockupModal?.title || ''}
                productUrl={mockupModal?.url || ''}
            />
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
        <div ref={setNodeRef} style={style} className={`${props.className} group`}>
            <div className="relative h-full">
                {/* Widget Controls (Resize + Drag) */}
                <div className="absolute top-2 right-2 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black/40 backdrop-blur rounded-lg border border-white/5">
                    {/* Resize Button (Green Dot) */}
                    {props.onToggleSize && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent drag start
                                props.onToggleSize();
                            }}
                            className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#3add54] border border-[#27c93f] active:scale-90 transition-transform mb-[1px]"
                            title={props.isExpanded ? "Minimize" : "Maximize"}
                        ></button>
                    )}

                    {/* Drag Handle (Grip) */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-0.5 cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition-colors"
                        title="Drag to reorder"
                    >
                        <GripHorizontal className="w-4 h-4" />
                    </div>
                </div>
                {props.children}
            </div>
        </div>
    );
}
