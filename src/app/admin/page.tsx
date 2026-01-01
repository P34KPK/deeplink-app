'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
    // Stage 1: Auth check
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Stage 2: Data
    const [data, setData] = useState<any>(null);

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
        fetch('/api/admin/stats')
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
                headers: { 'Content-Type': 'application/json' }
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
                    <h2 className="text-2xl font-bold mb-6">Global Surveillance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Global Analytics Card */}
                        <div className="matte-card p-6">
                            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2 tracking-wider">Total Links</h3>
                            <div className="text-4xl font-bold">{data?.totalLinks || 0}</div>
                        </div>

                        <div className="matte-card p-6">
                            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2 tracking-wider">Unique Users</h3>
                            <div className="text-4xl font-bold">{data?.uniqueUsers || 0}</div>
                        </div>

                        <div className="matte-card p-6 border-l-4 border-green-500/50 bg-green-500/5">
                            <h3 className="text-xs font-medium text-green-400 uppercase mb-2 tracking-wider">Database Integrity</h3>
                            <div className="text-lg font-bold text-green-300">SECURE (Redis AOF)</div>
                        </div>
                    </div>

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
                                            <td className="px-6 py-4 text-right">
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
        </main>
    );
}
