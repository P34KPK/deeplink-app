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
import ProDashboard from '@/components/dashboard/pro/ProDashboard';
import MockupGeneratorModal from '@/components/dashboard/shared/MockupGeneratorModal';
import ProfileEditorModal from '@/components/dashboard/shared/ProfileEditorModal';

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
    const [profileVersion, setProfileVersion] = useState(0);
    // AI Mockup State
    const [mockupModal, setMockupModal] = useState<{ open: boolean; linkId: string; url: string; title: string; image?: string } | null>(null);

    // Load persisted layout
    useEffect(() => {
        // Updated Order: Identity -> Daily -> Total -> Linktree -> Rest
        const defaultOrder = ['identity', 'daily', 'total', 'linktree', 'gamification', 'affiliate', 'favorites', 'simulator', 'prime', 'trends', 'devices', 'locations', 'browsers', 'referrers', 'copywriter', 'viral_studio'];
        const saved = localStorage.getItem('dashboard_layout_v7');
        if (saved) {
            try {
                let parsedOrder = JSON.parse(saved);
                // Ensure all default widgets are present in the loaded order
                defaultOrder.forEach(widget => {
                    if (!parsedOrder.includes(widget)) {
                        parsedOrder.push(widget);
                    }
                });
                setWidgetOrder(parsedOrder);
            } catch (e) {
                // Fallback to default if parsing fails
                setWidgetOrder(defaultOrder);
            }
        } else {
            setWidgetOrder(defaultOrder);
        }
    }, []);


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
                localStorage.setItem('dashboard_layout_v7', JSON.stringify(newOrder));
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

    // --- UNIFIED DASHBOARD (Free users treated as Pro with locks) ---
    // if (stats.plan === 'free') { ... } // Removed explicit split

    // --- PRO DASHBOARD ---
    return (
        <>
            <ProDashboard
                stats={stats}
                history={history}
                setHistory={setHistory}
                widgetOrder={widgetOrder}
                setWidgetOrder={setWidgetOrder}
                userId={userId || 'guest'}
                onEditProfile={() => setShowProfileEditor(true)}
                setAiModal={setAiModal}
                setMockupModal={setMockupModal}
                profileVersion={profileVersion}
            />

            {/* Profile Editor Modal */}
            <ProfileEditorModal
                isOpen={showProfileEditor}
                onClose={() => setShowProfileEditor(false)}
                userId={userId || ''}
                onSaveSuccess={() => setProfileVersion(v => v + 1)}
                isPro={stats?.plan === 'pro'}
            />

            {aiModal.open && (
                <AICopywriterModal
                    title={aiModal.title}
                    link={aiModal.link}
                    onClose={() => setAiModal({ ...aiModal, open: false })}
                />
            )}

            <MockupGeneratorModal
                isOpen={!!mockupModal}
                onClose={() => setMockupModal(null)}
                productTitle={mockupModal?.title || ''}
                productUrl={mockupModal?.url || ''}
                productImage={mockupModal?.image}
                links={history}
            />
        </>
    );

}
