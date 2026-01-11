import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface PixelConfig {
    fbPixelId?: string;
    tiktokPixelId?: string;
    googleAdsId?: string;
}

interface PixelWidgetProps {
    initialConfig?: PixelConfig;
    onSave: (config: PixelConfig) => Promise<void>;
}

export default function PixelWidget({ initialConfig = {}, onSave }: PixelWidgetProps) {
    const [config, setConfig] = useState<PixelConfig>(initialConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSave = async () => {
        setIsSaving(true);
        setStatus('idle');
        try {
            await onSave(config);
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e) {
            console.error(e);
            setStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="matte-card p-6 h-full flex flex-col bg-gradient-to-br from-card to-blue-950/10 border-blue-500/10">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                        <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                            <div className="w-1 h-1 bg-current rounded-full" />
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-blue-500 font-bold tracking-wider uppercase">Pro Feature</div>
                        <h3 className="text-sm font-bold">Retargeting Pixels</h3>
                    </div>
                </div>
                <div className="group relative">
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    <div className="absolute right-0 top-6 w-48 p-2 bg-popover border border-border rounded-lg text-[10px] text-muted-foreground shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        Pixels fire immediately when a user clicks your deep link, allowing you to build custom audiences on ad platforms.
                    </div>
                </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {/* Facebook / Meta */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-2">
                        <svg className="w-3 h-3 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        Meta Pixel ID
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. 1234567890"
                        className="input-minimal w-full text-xs font-mono"
                        value={config.fbPixelId || ''}
                        onChange={(e) => setConfig({ ...config, fbPixelId: e.target.value })}
                    />
                </div>

                {/* TikTok */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-2">
                        <svg className="w-3 h-3 text-white bg-black rounded-full p-[1px]" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                        TikTok Pixel ID
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. C5J8K9..."
                        className="input-minimal w-full text-xs font-mono"
                        value={config.tiktokPixelId || ''}
                        onChange={(e) => setConfig({ ...config, tiktokPixelId: e.target.value })}
                    />
                </div>

                {/* Google Ads */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-2">
                        <svg className="w-3 h-3 text-[#EA4335]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 13.9v-3.7h9.36c.33 1.1.5 2.12.5 3.31 0 5.4-3.64 9.12-9.25 9.12a9.5 9.5 0 0 1 0-19 9.38 9.38 0 0 1 6.59 2.36l-2.85 2.5a5.36 5.36 0 0 0-3.8-1.4 5.72 5.72 0 0 0 0 11.43c3.48 0 4.96-2.18 5.23-3.9h-5.28z" /></svg>
                        Google Ads Tag (G-)
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. AW-123..."
                        className="input-minimal w-full text-xs font-mono"
                        value={config.googleAdsId || ''}
                        onChange={(e) => setConfig({ ...config, googleAdsId: e.target.value })}
                    />
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/50">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${status === 'success' ? 'bg-green-500/20 text-green-500 border border-green-500/50' : 'btn-primary'}`}
                >
                    {isSaving ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : status === 'success' ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" /> Saved!
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" /> Save Pixels
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
