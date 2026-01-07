import Link from 'next/link';
import { Activity, Link as LinkIcon, Megaphone, BarChart3 } from 'lucide-react';
import CheckoutButton from '@/components/CheckoutButton';
import AffiliateWidget from '@/components/dashboard/shared/AffiliateWidget';
import { useState } from 'react';

type FreeDashboardProps = {
    stats: any;
    history: any[];
    handleCopy: (id: string, url: string) => void;
    copiedId: string | null;
    userId: string;
};

import UsageNotifier from '@/components/dashboard/free/UsageNotifier';

export default function FreeDashboard({ stats, history, handleCopy, copiedId, userId }: FreeDashboardProps) {
    const { limits, usage } = stats;
    const clicksPercent = Math.min((usage.clicks / limits.clicks) * 100, 100);
    const linksPercent = Math.min((usage.links / limits.links) * 100, 100);

    return (
        <main className="min-h-screen bg-background text-foreground p-6 md:p-12">
            <UsageNotifier stats={stats} />
            <div className="max-w-4xl mx-auto space-y-8 animate-fade">
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
                        <CheckoutButton
                            priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!}
                            label="Upgrade to PRO"
                            className="btn-primary bg-primary text-primary-foreground text-sm px-4 py-2 shadow-lg hover:shadow-primary/20"
                        />
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

                {/* Affiliate Program Widget */}
                <div className="h-[200px]">
                    <AffiliateWidget userId={userId} stats={stats.affiliate} />
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
                        <CheckoutButton
                            priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!}
                            label="Upgrade Now"
                            className="w-full md:w-auto btn-primary bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 shadow-lg hover:shadow-yellow-500/20 transition-all"
                        />
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
                        <CheckoutButton
                            priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!}
                            label="Go PRO"
                            className="text-xs text-primary font-bold hover:underline bg-transparent p-0 h-auto text-sky-500"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
