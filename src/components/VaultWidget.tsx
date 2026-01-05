import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Server, HardDrive, RefreshCw, Lock } from 'lucide-react';

type VaultStatus = {
    redis: boolean;
    local: boolean;
    lastBackup: string | null;
    redisCount: number;
    localCount: number;
    synced: boolean;
};

export default function VaultWidget() {
    const [status, setStatus] = useState<VaultStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [backingUp, setBackingUp] = useState(false);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/vault-status', {
                headers: {
                    'x-admin-key': localStorage.getItem('admin_session') || ''
                }
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch vault status', error);
        } finally {
            setLoading(false);
        }
    };

    const runBackup = async () => {
        if (!confirm('Initiate critical data backup and encryption?')) return;
        setBackingUp(true);
        try {
            const res = await fetch('/api/admin/backup', {
                method: 'POST',
                headers: {
                    'x-admin-key': localStorage.getItem('admin_session') || ''
                }
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ BACKUP SECURED!\n\nFile: ${data.fileName}\nEnc: ${data.encryption}\nItems: ${JSON.stringify(data.itemCount)}`);
                fetchStatus();
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            alert('Backup Failed: ' + e.message);
        } finally {
            setBackingUp(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    if (loading) {
        return <div className="matte-card p-6 animate-pulse bg-secondary/20 h-full">Loading Security Status...</div>;
    }

    if (!status) return null;

    const isHealthy = status.redis && status.local && status.synced;

    return (
        <div className={`matte-card p-6 relative overflow-hidden group border ${isHealthy ? 'border-green-500/20' : 'border-red-500/20'}`}>
            <div className={`absolute top-0 right-0 p-4 opacity-5 transition-opacity ${isHealthy ? 'text-green-500' : 'text-red-500'}`}>
                {isHealthy ? <ShieldCheck className="w-24 h-24" /> : <ShieldAlert className="w-24 h-24" />}
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Security Vault</h3>
                        <div className={`text-2xl font-bold mt-1 ${isHealthy ? 'text-green-500' : 'text-red-500'}`}>
                            {isHealthy ? 'SECURE' : 'ATTENTION REQUIRED'}
                        </div>
                    </div>
                    <button onClick={fetchStatus} className="text-muted-foreground hover:text-white transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Redis Status */}
                    <div className="flex items-center justify-between p-2 bg-secondary/30 rounded border border-white/5">
                        <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-orange-400" />
                            <span className="text-sm">Redis Cloud</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono opacity-50">{status.redisCount} items</span>
                            <div className={`w-2 h-2 rounded-full ${status.redis ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                        </div>
                    </div>

                    {/* Local Status */}
                    <div className="flex items-center justify-between p-2 bg-secondary/30 rounded border border-white/5">
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-blue-400" />
                            <span className="text-sm">Local Backup</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono opacity-50">{status.localCount} items</span>
                            <div className={`w-2 h-2 rounded-full ${status.local ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-muted-foreground">
                    <span>Sync Status:</span>
                    <span className={status.synced ? 'text-green-400 font-mono' : 'text-red-400 font-bold font-mono'}>
                        {status.synced ? 'SYNCHRONIZED' : 'MISMATCH'}
                    </span>
                </div>

                {/* Secure Backup Actions */}
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={runBackup}
                        disabled={backingUp}
                        className="w-full text-xs font-bold bg-green-900/40 hover:bg-green-900/60 text-green-400 border border-green-500/30 py-2 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {backingUp ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                        {backingUp ? 'ENCRYPTING...' : 'RUN SECURE BACKUP'}
                    </button>
                </div>

                {status.lastBackup && (
                    <div className="mt-2 text-[10px] text-right text-muted-foreground opacity-60">
                        Last Snapshot: {new Date(status.lastBackup).toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
}
