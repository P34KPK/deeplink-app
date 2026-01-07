'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Wand2 } from 'lucide-react';
import ImageCropperModal from '@/components/ImageCropperModal';

interface ProfileEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSaveSuccess?: () => void;
    isPro?: boolean;
}

// ... imports

export default function ProfileEditorModal({ isOpen, onClose, userId, onSaveSuccess, isPro = false }: ProfileEditorModalProps) {
    // ... existing state

    // ... existing functions (updateProfile, updateSocial, saveProfile, generateBackground)

    const handleAiBio = async () => {
        if (!isPro) return alert("AI Bio writing is a PRO feature. Please upgrade to unlock.");
        if (!userProfile.username) return alert('Enter a display name first!');
        // ... rest of logic
        const btn = document.getElementById('bio-magic-btn');
        if (btn) btn.innerHTML = '✨ Writing...';

        try {
            const res = await fetch('/api/ai/generate-text', {
                method: 'POST',
                body: JSON.stringify({
                    product: userProfile.username,
                    context: 'Influencer Bio',
                    type: 'bio'
                })
            });
            const data = await res.json();
            if (data.result) updateProfile('bio', data.result);
        } catch (e) {
            console.error(e);
        } finally {
            if (btn) btn.innerHTML = '✨ AI Magic';
        }
    };

    // ... render

    <button
        onClick={handleAiBio}
        id="bio-magic-btn"
        className={`text-[9px] font-bold flex items-center gap-1 transition-colors ${!isPro ? 'text-zinc-600 cursor-not-allowed' : 'text-pink-500 hover:text-pink-400'}`}
    >
        {!isPro && <span className="mr-0.5">🔒</span>}
        ✨ AI Magic
    </button>
                                </label >
        <textarea className="input-minimal w-full py-2 px-3 text-sm resize-none h-20 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-pink-500 outline-none transition-colors" placeholder="Tell your audience about your style..." value={userProfile.bio || ''} onChange={e => updateProfile('bio', e.target.value)} />
                            </div >

        {/* Theme Customization Section */ }
        < div >
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block">Page Theme</label>
                                    <span className="text-[9px] text-pink-500 font-bold border border-pink-500/20 bg-pink-500/10 px-1.5 rounded">INFLUENCER UNLOCK</span>
                                </div>
                                <div className="grid grid-cols-6 gap-2">
                                    {/* ... Colors ... */}
                                    {[
                                        { v: '#000000', n: 'Black' }, { v: '#ffffff', n: 'White' },
                                        { v: '#1a1a2e', n: 'Midnight' }, { v: '#27272a', n: 'Zinc' },
                                        { v: '#f4f4f5', n: 'Light Gray' }, { v: '#e1e1e1', n: 'Silver' },
                                        { v: '#f97316', n: 'Orange' }, { v: '#ef4444', n: 'Red' },
                                        { v: '#ec4899', n: 'Pink' }, { v: '#a855f7', n: 'Purple' },
                                        { v: '#3b82f6', n: 'Blue' }, { v: '#10b981', n: 'Green' },
                                        // Gradients
                                        { v: 'linear-gradient(to bottom right, #4f46e5, #ec4899)', n: 'Sunset' },
                                        { v: 'linear-gradient(to bottom right, #22c1c3, #fdbb2d)', n: 'Summer' },
                                        { v: 'linear-gradient(to bottom right, #ff00cc, #333399)', n: 'Neon' },
                                        { v: 'linear-gradient(to bottom right, #000000, #434343)', n: 'Dark Steel' }
                                    ].map(theme => (
                                        <div
                                            key={theme.v}
                                            className={`h-8 rounded cursor-pointer border transition-all relative group ${userProfile.theme === theme.v ? 'border-white ring-2 ring-pink-500 ring-offset-2 ring-offset-zinc-900 z-10' : 'border-white/10 hover:border-white/50'}`}
                                            style={{ background: theme.v }}
                                            onClick={() => updateProfile('theme', theme.v)}
                                            title={theme.n}
                                        >
                                            {userProfile.theme === theme.v && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div></div>}
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            if (!isPro) return alert("AI Background Generation is a PRO feature.");
                                            generateBackground();
                                        }} 
                                        className={`col-span-4 mt-1 flex items-center justify-center gap-2 py-2 rounded border border-dashed text-xs transition-colors group ${!isPro ? 'border-zinc-800 text-zinc-600 bg-zinc-900/50 cursor-not-allowed' : 'border-zinc-700 hover:border-pink-500 hover:text-pink-500 text-zinc-500'}`}
                                    >
                                        {!isPro ? <span className="mr-1">🔒</span> : <Wand2 className="w-3 h-3 group-hover:animate-pulse" />}
                                        <span>{userProfile.backgroundImage ? 'Generate New Background' : 'Generate with AI'}</span>
                                        {!isPro && <span className="ml-1 text-[8px] bg-zinc-800 px-1 rounded border border-zinc-700">PRO</span>}
                                    </button>

                                    {/* Pending Approval UI */}
                                    {(pendingImage || isGenerating) && (
                                        <div className="col-span-4 mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg animate-in fade-in zoom-in-95 duration-200">
                                            <p className="text-[10px] text-zinc-400 mb-2 uppercase font-bold text-center">Preview</p>
                                            <div className="h-64 rounded-lg bg-zinc-950 mb-3 border border-zinc-700 shadow-inner relative overflow-hidden flex items-center justify-center">
                                                {pendingImage && (
                                                    <img
                                                        src={pendingImage}
                                                        alt="AI Preview"
                                                        className={`w-full h-full object-contain transition-opacity duration-500 ${isGenerating ? 'opacity-0' : 'opacity-100'}`}
                                                        onLoad={() => setIsGenerating(false)}
                                                        onError={() => {
                                                            console.error("AI Image failed to load");
                                                            setIsGenerating(false);
                                                            setPendingImage(null);
                                                        }}
                                                    />
                                                )}
                                                {isGenerating && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm z-10">
                                                        <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setPendingImage(null); setIsGenerating(false); }}
                                                    className="flex-1 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-400 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    disabled={isGenerating}
                                                    onClick={() => {
                                                        updateProfile('backgroundImage', pendingImage);
                                                        setPendingImage(null);
                                                    }}
                                                    className={`flex-1 py-1.5 rounded text-xs font-bold text-black transition-colors shadow-lg shadow-green-500/20 ${isGenerating ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                                                >
                                                    {isGenerating ? 'Generating...' : 'Apply Background'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Active Background UI */}
                                    {userProfile.backgroundImage && !pendingImage && (
                                        <div className="col-span-4 mt-2 h-20 rounded-lg bg-cover bg-center border border-zinc-800 relative group overflow-hidden" style={{ backgroundImage: `url(${userProfile.backgroundImage})` }}>
                                            <button onClick={() => updateProfile('backgroundImage', '')} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </button>
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="bg-black/40 backdrop-blur px-2 py-1 rounded text-[10px] text-white font-bold">Active Background</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div >

                            <div className="pt-2">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1.5 block">Amazon Associate Tag (Important!)</label>
                                <div className="flex items-center gap-2 bg-zinc-900 px-3 rounded-lg border border-purple-500/30 focus-within:border-purple-500 transition-colors">
                                    <span className="text-purple-400 text-xs font-bold whitespace-nowrap">Store ID</span>
                                    <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                                    <input
                                        className="bg-transparent border-none outline-none text-xs w-full py-2.5 text-white placeholder-zinc-600"
                                        placeholder="e.g. sebastien-20"
                                        value={userProfile.amazonTag || ''}
                                        onChange={e => updateProfile('amazonTag', e.target.value)}
                                    />
                                </div>
                                <p className="text-[9px] text-zinc-500 mt-1">
                                    <span className="text-purple-400 font-bold">*Fallback:</span> If we cannot detect a tag in your pasted link, we automatically use this one to ensure you get paid.
                                </p>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold block">Social Links</label>
                                <div className="grid grid-cols-1 gap-3 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                                    {[
                                        { id: 'website', label: 'Website' },
                                        { id: 'instagram', label: 'Instagram' },
                                        { id: 'tiktok', label: 'TikTok' },
                                        { id: 'youtube', label: 'YouTube' },
                                        { id: 'twitter', label: 'X / Twitter' },
                                        { id: 'discord', label: 'Discord' },
                                        { id: 'twitch', label: 'Twitch' },
                                        { id: 'facebook', label: 'Facebook' },
                                    ].map(social => (
                                        <div key={social.id} className="flex items-center gap-2 bg-zinc-900 px-3 rounded-lg border border-zinc-800 focus-within:border-zinc-700 transition-colors">
                                            <span className="text-zinc-500 text-xs w-16 shrink-0 font-medium">{social.label}</span>
                                            <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                                            <input
                                                className="bg-transparent border-none outline-none text-xs w-full py-2.5 text-zinc-200 placeholder-zinc-700"
                                                placeholder={social.id === 'discord' ? 'Invite Link or User' : 'Profile URL'}
                                                value={userProfile.socials?.[social.id] || ''}
                                                onChange={e => updateSocial(social.id, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )
}
                </div >

    <div className="pt-4 flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-transparent border border-zinc-700 hover:bg-zinc-800 transition-colors">
            Cancel
        </button>
        <button onClick={saveProfile} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20 transition-colors">
            Save Changes
        </button>
    </div>
            </div >


    {/* Image Cropper */ }
    < ImageCropperModal
isOpen = {!!rawFileImage}
imageSrc = { rawFileImage }
onClose = {() => setRawFileImage(null)}
onSave = {(cropped) => {
    updateProfile('avatarUrl', cropped);
    setRawFileImage(null);
}}
            />
        </div >
    );
}
