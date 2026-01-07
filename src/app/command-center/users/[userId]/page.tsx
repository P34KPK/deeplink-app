'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, ShieldAlert, User, CreditCard } from 'lucide-react';
import ProDashboard from '@/components/dashboard/pro/ProDashboard';
import MockupGeneratorModal from '@/components/dashboard/shared/MockupGeneratorModal';

export default function UserDetailDashboard() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.userId as string;

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Dashboard state required for ProDashboard component
    const [widgetOrder, setWidgetOrder] = useState(['total', 'linktree', 'gamification', 'affiliate', 'simulator', 'prime', 'trends', 'copywriter', 'viral_studio', 'daily', 'devices', 'locations', 'browsers', 'referrers']);
    const [aiModal, setAiModal] = useState({ open: false, title: '', link: '' });
    const [mockupModal, setMockupModal] = useState<any>(null);

    useEffect(() => {
        if (!userId) return;

        // Fetch user specific stats and data
        const fetchData = async () => {
            try {
                // We need a new API endpoint or re-use existing ones with admin privileges to get SPECIFIC user stats
                // For now, let's simulate by fetching the user links and aggregating manually or using a new admin endpoint
                // Let's assume we create/use /api/admin/user-details which returns everything needed

                const res = await fetch(`/api/admin/user-details?userId=${userId}`, {
                    headers: { 'x-admin-key': localStorage.getItem('admin_session') || '' }
                });

                if (!res.ok) throw new Error('Failed to load user data');

                const data = await res.json();
                setUserData(data.user);
                setStats(data.stats); // formatted for ProDashboard
                setHistory(data.history);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                    <div className="text-sm text-purple-400 font-mono">ACCESSING USER VAULT...</div>
                </div>
            </div>
        );
    }

    if (!userData || !stats) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
                <ShieldAlert className="w-16 h-16 text-red-500" />
                <h1 className="text-xl font-bold">User Not Found or Access Denied</h1>
                <Link href="/admin" className="text-sm text-red-400 underline">Return to Command Center</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Admin Overlay Header */}
            <div className="sticky top-0 z-50 bg-red-900/10 border-b border-red-500/20 backdrop-blur-md px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="font-bold flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-400" />
                            {userData.email}
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                            <span>ID: {userId}</span>
                            <span className="text-white/20">|</span>
                            <span className={`flex items-center gap-1 ${stats.plan === 'free' ? 'text-blue-400' : 'text-amber-400'}`}>
                                <CreditCard className="w-3 h-3" />
                                {stats.plan.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded uppercase tracking-wider animate-pulse">
                        Admin Observation Mode
                    </div>
                </div>
            </div>

            {/* The Actual User Dashboard */}
            <div className="p-4 md:p-8 opacity-90 hover:opacity-100 transition-opacity">
                {/* 
                    Reuse ProDashboard. 
                    Note: We pass the stats we fetched. 
                    It will automatically handle locking if plan is 'free'.
                 */}
                <ProDashboard
                    stats={stats}
                    history={history}
                    setHistory={setHistory} // Read-only mostly from admin side but providing state function to prevent crash
                    widgetOrder={widgetOrder}
                    setWidgetOrder={setWidgetOrder}
                    userId={userId}
                    onEditProfile={() => alert('Profile editing via Admin view is read-only in this version.')}
                    setAiModal={setAiModal}
                    setMockupModal={setMockupModal}
                    bypassLock={true}
                />
            </div>

            <MockupGeneratorModal
                isOpen={!!mockupModal}
                onClose={() => setMockupModal(null)}
                productTitle={mockupModal?.title || ''}
                productUrl={mockupModal?.url || ''}
                productImage={mockupModal?.image}
                links={history}
            />
        </div>
    );
}
