import { useState } from 'react';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';

export default function PanicControl() {
    const [locked, setLocked] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const handleToggle = () => {
        if (!locked) {
            // Need confirmation to lock
            if (confirming) {
                setLocked(true);
                setConfirming(false);
                // In real app, this would call /api/admin/lockdown
            } else {
                setConfirming(true);
                // Auto-reset confirmation if not clicked
                setTimeout(() => setConfirming(false), 3000);
            }
        } else {
            // Unlock is instant (or maybe double conf too depending on paranoia level)
            setLocked(false);
        }
    };

    return (
        <div className={`matte-card p-4 flex flex-col justify-center items-center h-full border-l-4 transition-all ${locked ? 'border-l-orange-500 bg-orange-950/20' : 'border-l-zinc-700 bg-zinc-900/10'}`}>
            <h3 className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-4">
                Global Lockdown Protocol
            </h3>

            <button
                onClick={handleToggle}
                className={`
                    relative w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300
                    ${locked
                        ? 'bg-orange-500/20 text-orange-500 border-4 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.4)] animate-pulse'
                        : confirming
                            ? 'bg-red-600 text-white border-4 border-red-700 scale-110'
                            : 'bg-zinc-800 text-zinc-500 border-4 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
                    }
                `}
            >
                {locked ? (
                    <>
                        <Lock className="w-8 h-8 mb-1" />
                        <span className="text-[8px] font-bold uppercase">SECURED</span>
                    </>
                ) : (
                    <>
                        {confirming ? <AlertTriangle className="w-8 h-8 mb-1 animate-bounce" /> : <Unlock className="w-8 h-8 mb-1" />}
                        <span className="text-[8px] font-bold uppercase">{confirming ? 'CONFIRM?' : 'ARMED'}</span>
                    </>
                )}
            </button>

            <div className="mt-4 text-center h-4">
                {locked && <span className="text-[10px] text-orange-500 font-mono blink">READ_ONLY MODE ACTIVE</span>}
                {confirming && !locked && <span className="text-[10px] text-red-500 font-bold">CLICK AGAIN TO LOCK</span>}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 w-full">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest text-center mb-2">Maintenance Ops</p>
                <button
                    onClick={async () => {
                        if (confirm("MIGRATE DATABASE TO V2?\n\nThis will restructure all data to the new scalable format. Ensure a backup exists.")) {
                            try {
                                const res = await fetch('/api/admin/migrate', {
                                    method: 'POST',
                                    headers: { 'x-admin-key': localStorage.getItem('admin_session') || '' }
                                });
                                const data = await res.json();
                                alert(data.message || 'Migration Complete');
                            } catch (e) {
                                alert('Migration Failed');
                            }
                        }
                    }}
                    className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-900/10 text-zinc-400 hover:text-blue-400 text-[10px] font-mono transition-colors rounded"
                >
                    RUN_DB_MIGRATION_V2
                </button>
            </div>
        </div>
    );
}
