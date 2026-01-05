'use client';

import { Megaphone, Send, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function AdminBroadcast() {
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    const handleSend = async () => {
        if (!message) return;
        setStatus('sending');
        try {
            const apiKey = localStorage.getItem('admin_session') || '';
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': apiKey
                },
                body: JSON.stringify({ message, type })
            });
            if (res.ok) {
                setStatus('sent');
                setTimeout(() => setStatus('idle'), 3000);
                setMessage('');
            } else {
                const err = await res.json();
                alert(`Error: ${res.status} - ${err.error || 'Unknown'}`);
                setStatus('error');
            }
        } catch (e: any) {
            alert(`Network Error: ${e.message}`);
            setStatus('error');
        }
    };

    const handleClear = async () => {
        const apiKey = localStorage.getItem('admin_session') || '';
        await fetch('/api/admin/broadcast', {
            method: 'DELETE',
            headers: { 'x-admin-key': apiKey }
        });
        alert('Broadcast cleared');
    };

    return (
        <div className="matte-card p-6 flex flex-col h-full bg-zinc-900 border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
                <Megaphone className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">Global Broadcast</h3>
            </div>

            <div className="flex-1 flex flex-col justify-end space-y-3">
                <textarea
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg p-3 text-sm text-white resize-none h-24 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Type message to all users..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                />

                <div className="flex gap-2">
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="bg-zinc-800 text-xs text-white border border-zinc-700 rounded px-2 outline-none"
                    >
                        <option value="info">Info (Blue)</option>
                        <option value="warning">Warning (Amber)</option>
                        <option value="urgent">Urgent (Red)</option>
                    </select>

                    <button
                        onClick={handleSend}
                        disabled={status === 'sending' || !message}
                        className={`flex-1 py-1.5 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors ${status === 'sent' ? 'bg-green-600 text-white' : 'bg-white hover:bg-zinc-200 text-black'}`}
                    >
                        {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Sent!' : <><Send className="w-3 h-3" /> Broadcast</>}
                    </button>

                    <button
                        onClick={handleClear}
                        className="p-2 border border-zinc-700 rounded hover:bg-red-500/10 hover:text-red-500 text-zinc-500"
                        title="Clear Active Broadcast"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
