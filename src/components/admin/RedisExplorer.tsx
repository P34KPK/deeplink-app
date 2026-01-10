import { useState, useEffect } from 'react';
import { Database, Search, Trash, RefreshCw, Key, ChevronRight, ChevronLeft } from 'lucide-react';

export default function RedisExplorer() {
    const [keys, setKeys] = useState<{ key: string, type: string, ttl: number }[]>([]);
    const [cursor, setCursor] = useState('0');
    const [nextCursor, setNextCursor] = useState('0'); // For pagination
    const [pattern, setPattern] = useState('*');
    const [loading, setLoading] = useState(false);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    const fetchKeys = async (c = '0') => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/redis?cursor=${c}&pattern=${encodeURIComponent(pattern)}`, {
                headers: { 'x-admin-key': localStorage.getItem('admin_session') || '' }
            });
            const data = await res.json();
            if (data.keys) {
                setKeys(data.keys);
                setNextCursor(data.cursor);
                setCursor(c);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const deleteKey = async (key: string) => {
        if (!confirm(`Delete key "${key}"? This cannot be undone.`)) return;
        try {
            await fetch(`/api/admin/redis?key=${encodeURIComponent(key)}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': localStorage.getItem('admin_session') || '' }
            });
            setKeys(prev => prev.filter(k => k.key !== key));
        } catch (e) {
            alert('Failed to delete');
        }
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    return (
        <div className="matte-card p-0 flex flex-col h-full bg-[#050505] border border-zinc-800">
            {/* Header */}
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Data Explorer</span>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={pattern}
                        onChange={(e) => setPattern(e.target.value)}
                        placeholder="Search key..."
                        className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-white w-32 focus:outline-none focus:border-purple-500"
                        onKeyDown={(e) => e.key === 'Enter' && fetchKeys('0')}
                    />
                    <button onClick={() => fetchKeys('0')} className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white">
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {keys.length === 0 ? (
                    <div className="text-center py-10 text-xs text-zinc-600 italic">No keys found</div>
                ) : (
                    keys.map((k) => (
                        <div key={k.key} onClick={() => setSelectedKey(k.key === selectedKey ? null : k.key)} className={`p-2 rounded text-xs border ${selectedKey === k.key ? 'bg-purple-500/10 border-purple-500/50' : 'bg-black border-transparent hover:bg-white/5'} cursor-pointer transition-colors group`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 truncate">
                                    <Key className="w-3 h-3 text-zinc-600" />
                                    <span className={`font-mono truncate ${k.key.startsWith('user') ? 'text-blue-400' : k.key.startsWith('link') ? 'text-green-400' : 'text-zinc-300'}`}>
                                        {k.key}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-zinc-600 uppercase w-10 text-right">{k.type}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteKey(k.key); }}
                                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-500 transition-opacity"
                                    >
                                        <Trash className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            {selectedKey === k.key && (
                                <div className="mt-2 pl-5 pt-2 border-t border-white/5 text-[10px] text-zinc-500 font-mono">
                                    <p>TTL: {k.ttl === -1 ? 'Persist' : `${k.ttl}s`}</p>
                                    <p className="mt-1">Value Preview: (Click to Fetch Full via API needed)</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            <div className="p-2 border-t border-white/5 bg-zinc-900/30 flex justify-between items-center text-xs text-zinc-500">
                <span>cursor: {cursor}</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchKeys('0')}
                        disabled={cursor === '0'}
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => fetchKeys(nextCursor)}
                        disabled={nextCursor === '0'}
                        className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
