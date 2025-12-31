'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';

export default function AdminDashboard() {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isLoaded, isSignedIn]);

    if (loading) return <div className="p-12 text-center">Loading Admin Data...</div>;

    return (
        <main className="min-h-screen bg-background text-foreground p-12">
            <div className="max-w-6xl mx-auto space-y-8 animate-fade">
                <div className="flex items-center justify-between border-b border-border pb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Welcome back, {user?.firstName || 'Admin'}.</p>
                    </div>
                    <Link href="/" className="btn-primary">Back to App</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Global Analytics Card */}
                    <div className="matte-card p-6">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase mb-2">Total System Links</h3>
                        <div className="text-4xl font-bold">{data?.totalLinks || 0}</div>
                    </div>

                    <div className="matte-card p-6">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase mb-2">Active Users</h3>
                        <div className="text-4xl font-bold">{data?.uniqueUsers || 0}</div>
                    </div>

                    <div className="matte-card p-6 border-green-500/30 bg-green-500/5">
                        <h3 className="text-sm font-medium text-green-500 uppercase mb-2">System Status</h3>
                        <div className="text-xl font-bold text-green-400">● Online & Recording</div>
                    </div>
                </div>

                {/* User Activity Table */}
                <div className="matte-card overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="text-lg font-semibold">Global Recent Activity</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-secondary/30 text-muted-foreground uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Product / Link</th>
                                    <th className="px-6 py-4">ASIN</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {data?.recentActivity?.map((link: any) => (
                                    <tr key={link.id} className="hover:bg-secondary/10">
                                        <td className="px-6 py-4 text-muted-foreground">{new Date(link.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-primary">
                                            {link.userEmail || <span className="text-muted-foreground italic">Anonymous</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href={link.generated} target="_blank" className="hover:underline">{link.title || 'Untitled'}</a>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs opacity-70">{link.asin}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
