import { useEffect, useRef, useState } from 'react';
import { Terminal, ShieldCheck, Wifi, Cpu } from 'lucide-react';

export default function SystemTerminal({ data }: { data: any }) {
    const [logs, setLogs] = useState<string[]>([]);
    const listRef = useRef<HTMLDivElement>(null);

    // Initial boot sequence
    useEffect(() => {
        setLogs([
            `> SYSTEM BOOT_SEQUENCE_INIT...`,
            `> CONNECTING_TO_MAIN_NET... [OK]`,
            `> REDIS_CACHE_LAYER... [ACTIVE]`,
            `> P34K_DEEP_LINK_PROTOCOL... [READY]`,
            `> WAITING_FOR_TRAFFIC...`
        ]);
    }, []);

    // Listen to data changes to inject real logs
    useEffect(() => {
        if (!data?.recentActivity) return;

        const latest = data.recentActivity[0];
        if (latest) {
            const logLine = `> [TRAFFIC] User '${latest.userEmail?.split('@')[0] || 'Anon'}' accessed ${latest.asin} via ${latest.device || 'WEB'}`;
            // Avoid duplicates generally, but simpler here ensures flow
            setLogs(prev => [...prev.slice(-30), logLine]); // Keep last 30 lines
        }
    }, [data]);

    // Real Logs Only - No Heartbeat Simulation
    // If we want system status lines, they should come from a real backend status stream.
    // For now, we only show boot + real traffic.

    // Auto scroll
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="matte-card p-0 flex flex-col h-full bg-black border-l-4 border-l-green-500 font-mono relative overflow-hidden group">
            {/* Header */}
            <div className="p-3 bg-green-900/10 border-b border-green-500/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold text-green-500 tracking-widest">SYSTEM_TERMINAL_V1</span>
                </div>
                <div className="flex gap-3 text-[10px] text-green-400/60">
                    <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> 12%</span>
                    <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> 1.2GB/s</span>
                </div>
            </div>

            {/* CRT Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

            {/* Logs Area */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-1 text-xs font-mono custom-scrollbar relative z-10">
                {logs.map((log, i) => (
                    <div key={i} className={`truncate ${log.includes('[TRAFFIC]') ? 'text-white' : log.includes('[WARN]') ? 'text-yellow-500' : 'text-green-500/70'}`}>
                        <span className="opacity-50 mr-2">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
                        {log}
                    </div>
                ))}
            </div>

            <div className="p-2 border-t border-green-500/20 bg-green-900/5 text-[10px] text-green-500/50 flex items-center gap-2">
                <span className="animate-pulse">_</span>
                INPUT LOCKED // READ_ONLY_MODE
            </div>
        </div>
    );
}
