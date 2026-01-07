
'use client';

import { useState } from 'react';
import { DollarSign, MousePointer2, Users, Copy, Check } from 'lucide-react';

type AffiliateStats = {
    clicks: number;
    sales: number;
    earnings: number;
};

interface AffiliateWidgetProps {
    userId: string;
    stats?: AffiliateStats;
}

export default function AffiliateWidget({ userId, stats }: AffiliateWidgetProps) {
    const [copied, setCopied] = useState(false);

    // In dev: localhost:3000/ref/..., in prod: deeplink.rs/ref/... (adjust based on env)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://deeplink.rs';
    const affiliateLink = `${baseUrl}/ref/${userId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(affiliateLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="matte-card p-6 h-full flex flex-col justify-between bg-gradient-to-br from-card to-emerald-500/10 border-2 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="w-24 h-24 text-emerald-500" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                            Affiliate Program
                        </h3>
                        <p className="text-[10px] text-muted-foreground">Start Earning Today</p>
                    </div>
                </div>

                <div className="bg-black/40 rounded-lg p-3 mb-4 flex items-center justify-between group-hover:border-emerald-500/50 border border-transparent transition-all cursor-pointer" onClick={handleCopy}>
                    <div className="truncate text-xs font-mono text-emerald-100/70 group-hover:text-emerald-300 transition-colors">
                        {affiliateLink}
                    </div>
                    {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                        <Copy className="w-4 h-4 text-muted-foreground group-hover:text-white" />
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-secondary/40 p-2 rounded text-center border border-white/5">
                        <div className="text-[10px] text-muted-foreground uppercase mb-1 flex justify-center"><MousePointer2 className="w-3 h-3" /></div>
                        <div className="text-lg font-bold">{stats?.clicks || 0}</div>
                        <div className="text-[9px] text-muted-foreground">Clicks</div>
                    </div>
                    <div className="bg-secondary/40 p-2 rounded text-center border border-white/5">
                        <div className="text-[10px] text-muted-foreground uppercase mb-1 flex justify-center"><Users className="w-3 h-3" /></div>
                        <div className="text-lg font-bold">{stats?.sales || 0}</div>
                        <div className="text-[9px] text-muted-foreground">Sales</div>
                    </div>
                    <div className="bg-emerald-500/20 p-2 rounded text-center border border-emerald-500/30">
                        <div className="text-[10px] text-emerald-400 uppercase mb-1 flex justify-center"><DollarSign className="w-3 h-3" /></div>
                        <div className="text-lg font-bold text-emerald-400">${stats?.earnings || 0}</div>
                        <div className="text-[9px] text-emerald-400/70">Earned</div>
                    </div>
                </div>
            </div>

            <div className="text-[10px] text-muted-foreground text-center mt-2 relative z-10 bg-emerald-950/30 py-1 rounded border border-emerald-500/10">
                Earn <span className="text-emerald-400 font-bold">$1.00</span> for every new Pro member you refer.
            </div>
        </div>
    );
}
