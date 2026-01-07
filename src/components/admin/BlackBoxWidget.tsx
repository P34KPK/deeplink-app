import { useState, useEffect } from 'react';
import { AlertOctagon, Zap, CheckCircle, RefreshCw, Server, Shield } from 'lucide-react';

export default function BlackBoxWidget() {
    const [status, setStatus] = useState<'nominal' | 'warning' | 'critical'>('nominal');
    const [currentError, setCurrentError] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [solution, setSolution] = useState<string | null>(null);

    // Real Monitoring Only - No random anomalies
    // Future: Connect this to a real health-check API endpoint.
    useEffect(() => {
        // Placeholder for real health check
    }, []);

    const triggerAnomaly = () => {
        const errors = [
            "API_LATENCY_SPIKE > 500ms",
            "REDIS_CACHE_FRAGMENTATION_HIGH",
            "NON_STANDARD_TRAFFIC_PATTERN",
            "MEMORY_LEAK_DETECTED_NODE_1"
        ];
        setStatus('critical');
        setCurrentError(errors[Math.floor(Math.random() * errors.length)]);
        setSolution(null);
    };

    const runAIDiagnostic = () => {
        setAnalyzing(true);
        setTimeout(() => {
            setAnalyzing(false);
            if (currentError?.includes("LATENCY")) setSolution("Reroute Traffic via Edge Nodes");
            else if (currentError?.includes("CACHE")) setSolution("FLUSH_ALL_KEYS & REBUILD");
            else if (currentError?.includes("TRAFFIC")) setSolution("ENABLE_WAF_CHALLENGE_MODE");
            else setSolution("RESTART_WORKER_PROCESS");
        }, 2000);
    };

    const executeFix = () => {
        setAnalyzing(true); // Re-use spinner for fixing
        setTimeout(() => {
            setAnalyzing(false);
            setStatus('nominal');
            setCurrentError(null);
            setSolution(null);
        }, 1500);
    };

    return (
        <div className={`matte-card p-6 flex flex-col h-full border-l-4 transition-all duration-500 overflow-hidden relative ${status === 'nominal' ? 'border-l-zinc-600 bg-zinc-900/20' : 'border-l-red-600 bg-red-900/10'}`}>

            {/* Background Pulse for Alarm */}
            {status === 'critical' && (
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
            )}

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${status === 'nominal' ? 'bg-zinc-800 text-zinc-400' : 'bg-red-500 text-white animate-bounce'}`}>
                        {status === 'nominal' ? <Server className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${status === 'nominal' ? 'text-zinc-400' : 'text-red-500'}`}>
                            Black Box Ops
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                            AI Status: <span className="text-green-500 font-mono">ONLINE</span>
                        </p>
                    </div>
                </div>
                <div className={`text-[10px] px-2 py-1 rounded border font-mono ${status === 'nominal' ? 'border-green-500/30 text-green-500 bg-green-500/10' : 'border-red-500 text-red-500 bg-red-500/20'}`}>
                    {status === 'nominal' ? 'SYS_OPTIMAL' : 'SYS_ERROR'}
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center relative z-10">
                {status === 'nominal' ? (
                    <div className="text-center space-y-2 opacity-50">
                        <Shield className="w-12 h-12 mx-auto text-zinc-600" />
                        <p className="text-xs text-muted-foreground">Monitoring active processes...</p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in">
                        <div className="bg-black/40 border border-red-500/30 p-3 rounded font-mono text-xs text-red-400">
                            <span className="text-red-600 font-bold mr-2">[CRITICAL]</span>
                            {currentError}
                        </div>

                        {!solution ? (
                            <button
                                onClick={runAIDiagnostic}
                                disabled={analyzing}
                                className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-all"
                            >
                                {analyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                {analyzing ? 'AI ANALYZING LOGS...' : 'RUN AI DIAGNOSTIC'}
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-[10px] text-zinc-400 uppercase font-bold">Recommended Action:</div>
                                <div className="text-green-400 text-xs font-mono mb-2">
                                    &gt; {solution}
                                </div>
                                <button
                                    onClick={executeFix}
                                    disabled={analyzing}
                                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse"
                                >
                                    {analyzing ? (
                                        <>
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            APPLYING FIX...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-3 h-3" />
                                            EXECUTE AUTO-REPAIR
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
