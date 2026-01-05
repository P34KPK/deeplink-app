'use client';

import { Sparkles, Activity, Globe, TrendingUp, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AdminAIAnalyst({ data }: { data: any }) {
    const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'ANALYZING' | 'STABLE'>('SCANNING');
    const [logs, setLogs] = useState<string[]>([]);
    const [insight, setInsight] = useState<string | null>(null);

    // Boot & Analyze Real Data
    useEffect(() => {
        if (!data) return;

        let sequence = 0;
        const analysisSteps = [
            `Mounting Neural Link...`,
            `Ingesting ${data.totalLinks || 0} active nodes...`,
            `Parsing ${data.globalStats?.totalClicks || 0} signal events...`,
            `Cross-referencing ${data.uniqueUsers || 0} identities...`
        ];

        const interval = setInterval(() => {
            if (sequence < analysisSteps.length) {
                setLogs(prev => [analysisSteps[sequence], ...prev]);
                sequence++;
            } else {
                setStatus('STABLE');
                generateRealInsight();
                clearInterval(interval);
            }
        }, 800);

        return () => clearInterval(interval);
    }, [data]);

    const generateRealInsight = () => {
        if (!data) return;

        const totalClicks = data.globalStats?.totalClicks || 0;
        const devices = data.globalStats?.devices || {};
        const locations = data.globalStats?.locations || {};

        // logic: Find dominant device
        let topDevice = 'Desktop';
        let maxDeviceCount = 0;
        Object.entries(devices).forEach(([dev, count]: any) => {
            if (count > maxDeviceCount) {
                maxDeviceCount = count;
                topDevice = dev;
            }
        });

        // logic: Revenue Est (Assumed $0.12 per click avg)
        const estRevenue = (totalClicks * 0.12).toFixed(2);

        // logic: Insight Selection
        const insights = [];

        if (totalClicks > 1000) {
            insights.push(`🚀 **High Velocity**: Traffic exceeds 1k events. System load nominal.`);
        }

        const mobileRatio = ((devices.android || 0) + (devices.ios || 0)) / (totalClicks || 1);
        if (mobileRatio > 0.6) {
            insights.push(`📱 **Mobile First**: ${(mobileRatio * 100).toFixed(0)}% of traffic is mobile. Optimization recommended.`);
        }

        insights.push(`💰 **Revenue Validated**: Current traffic implies estimated $${estRevenue} in potential commission.`);

        // Pick one based on data signature (deterministic so it doesn't flicker)
        // If we have less than 3 insights, just pick the last one or create a fallback
        if (insights.length === 0) insights.push("System Initialized. Waiting for more data.");

        const index = totalClicks % insights.length;
        setInsight(insights[index]);
    };

    return (
        <div className="matte-card p-6 flex flex-col h-full bg-black/60 border-purple-500/30 relative overflow-hidden">
            {/* Background Grid Animation */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#a855f7 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Sparkles className={`w-5 h-5 text-purple-400 ${status !== 'STABLE' ? 'animate-pulse' : ''}`} />
                        {status !== 'STABLE' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping"></span>}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">Cortex AI Sentinel</h3>
                        <p className="text-[10px] text-purple-300/60 font-mono">REAL-TIME TELEMETRY</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-purple-900/20 border border-purple-500/20 rounded text-[10px] font-mono text-purple-300">
                    <Activity className="w-3 h-3" />
                    {status}
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 relative z-10">
                {/* Main Insight Card */}
                <div className="bg-gradient-to-r from-purple-900/40 to-black border border-purple-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all duration-500">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Globe className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-purple-200 mb-1 uppercase tracking-wide">Live Insight</h4>
                            <p className="text-sm text-white/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: (insight || "System initializes. Monitoring core metrics...").replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                        </div>
                    </div>
                </div>

                {/* Live Log Stream */}
                <div className="flex-1 bg-black/40 rounded-lg border border-white/5 p-3 overflow-hidden flex flex-col justify-end font-mono text-xs">
                    <div className="space-y-1.5">
                        {logs.map((log, i) => (
                            <div key={i} className="flex items-center gap-2 text-zinc-500 animate-in slide-in-from-left-2 fade-in duration-300">
                                <span className="text-purple-500/50">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                <span className={i === 0 ? 'text-purple-300' : ''}>{log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Decoration */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
        </div>
    );
}
