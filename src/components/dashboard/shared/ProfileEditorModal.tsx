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

interface UserProfile {
    username: string;
    bio: string;
    avatarUrl?: string;
    backgroundImage?: string;
    amazonTag?: string; // New!
    socials: {
        website?: string;
        instagram?: string;
        tiktok?: string;
        youtube?: string;
        twitter?: string;
        discord?: string;
        twitch?: string;
        facebook?: string;
        [key: string]: string | undefined;
    };
    customLinks?: { id: string, label: string, url: string }[];
    [key: string]: any; // fallback for loose API structure
}

export default function ProfileEditorModal({ isOpen, onClose, userId, onSaveSuccess, isPro = false }: ProfileEditorModalProps) {
    const [userProfile, setUserProfile] = useState<UserProfile>({
        username: '',
        bio: '',
        socials: {}
    });
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [rawFileImage, setRawFileImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            setLoading(true);
            fetch('/api/user/profile')
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) setUserProfile(data);
                })
                .catch(err => console.error("Failed to load profile", err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, userId]);

    const updateProfile = (field: keyof UserProfile, value: any) => {
        setUserProfile((prev) => ({ ...prev, [field]: value }));
    };

    const updateSocial = (platform: string, value: string) => {
        setUserProfile((prev) => ({
            ...prev,
            socials: { ...prev.socials, [platform]: value }
        }));
    };

    const saveProfile = async () => {
        const res = await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userProfile)
        });
        if (res.ok) {
            alert('Profile updated!');
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        }
    };

    const generateBackground = () => {
        const prompt = window.prompt("✨ AI Background Generator\n\nDescribe the vibe you want (e.g., 'cyberpunk city neon rain', 'pastel clouds aesthetic'):", "aesthetic gradient abstract");
        if (prompt === null) return;

        setIsGenerating(true);
        const finalPrompt = prompt || "aesthetic gradient abstract";
        const seed = Math.floor(Math.random() * 1000000);

        const proxyUrl = `/api/ai/generate-image?prompt=${encodeURIComponent(finalPrompt)}&seed=${seed}`;

        setPendingImage(proxyUrl);
    };

    const handleAiBio = async () => {
        if (!isPro) return alert("AI Bio writing is a PRO feature. Please upgrade to unlock.");
        if (!userProfile.username) return alert('Enter a display name first!');
        const btn = document.getElementById('bio-magic-btn');
        if (btn) btn.innerHTML = '✨ Writing...';

        try {
            const res = await fetch('/api/ai/generate-text', {
                method: 'POST',
                body: JSON.stringify({
                    product: userProfile.username, // Reuse product field as "Keywords/Name"
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-10 md:pt-20 p-4 animate-in fade-in duration-200">
            <div className="bg-[#09090b] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700 shadow-sm">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                        <Settings className="w-5 h-5 text-pink-500" />
                    </div>
                    <h2 className="text-xl font-bold">Edit Profile</h2>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">Loading profile...</div>
                    ) : (
                        <>
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1.5 block">Profile Picture</label>
                                <div className="flex gap-4 items-center">
                                    <div className="relative group cursor-pointer w-14 h-14">
                                        {userProfile.avatarUrl ? (
                                            <img src={userProfile.avatarUrl} className="w-full h-full rounded-full border border-zinc-700 object-cover" alt="Preview" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
                                                <span className="text-xs">?</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="text-[8px] text-white font-bold uppercase">Edit</span>
                                        </div>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (readerEvent) => {
                                                        const result = readerEvent.target?.result as string;
                                                        if (result) setRawFileImage(result);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                                e.target.value = ''; // Allow re-select
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-zinc-400 mb-2">Upload a profile picture. JPG, PNG or GIF.</p>
                                        <label htmlFor="avatar-upload" className="text-[10px] border border-zinc-700 hover:bg-zinc-800 px-3 py-1.5 rounded text-zinc-300 transition-colors cursor-pointer inline-block">
                                            Click to Upload
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1.5 block">Display Name</label>
                                <input className="input-minimal w-full py-2 px-3 text-sm bg-zinc-900 border border-zinc-800 rounded-lg focus:border-pink-500 outline-none transition-colors" placeholder="e.g. Sarah's Picks" value={userProfile.username || ''} onChange={e => updateProfile('username', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1.5 flex justify-between">
                                    Bio
                                    <button
                                        onClick={handleAiBio}
                                        id="bio-magic-btn"
                                        className={`text-[9px] font-bold flex items-center gap-1 transition-colors ${!isPro ? 'text-zinc-600 cursor-not-allowed' : 'text-pink-500 hover:text-pink-400'}`}
                                    >
                                        {!isPro && <span className="mr-0.5">🔒</span>}
                                        ✨ AI Magic
                                    </button>
                                </label>
                                <textarea className="input-minimal w-full py-2 px-3 text-sm resize-none h-20 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-pink-500 outline-none transition-colors" placeholder="Tell your audience about your style..." value={userProfile.bio || ''} onChange={e => updateProfile('bio', e.target.value)} />
                            </div>

                            {/* Theme Customization Section */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block">Page Theme</label>
                                    <span className="text-[9px] text-pink-500 font-bold border border-pink-500/20 bg-pink-500/10 px-1.5 rounded">INFLUENCER UNLOCK</span>
                                </div>
                                <div className="grid grid-cols-6 gap-2">
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
                            </div>

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
                    )}
                    {/* Custom Links Section */}
                    <div className="pt-2 border-t border-zinc-800 mt-2">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] text-zinc-500 uppercase font-bold">Custom Links</label>
                            <button
                                onClick={() => {
                                    const newLinks = [...(userProfile.customLinks || [])];
                                    newLinks.push({ id: Date.now().toString(), label: '', url: '' });
                                    updateProfile('customLinks', newLinks);
                                }}
                                className="text-[9px] font-bold bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            >
                                <span>+</span> Add Link
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                            {(userProfile.customLinks || []).map((link: any, idx: number) => (
                                <div key={link.id || idx} className="flex flex-col gap-1 bg-zinc-900/50 p-2 rounded border border-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        <input
                                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-pink-500 outline-none"
                                            placeholder="Label (e.g. My Portfolio)"
                                            value={link.label}
                                            onChange={(e) => {
                                                const newLinks = [...(userProfile.customLinks || [])];
                                                newLinks[idx] = { ...newLinks[idx], label: e.target.value };
                                                updateProfile('customLinks', newLinks);
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const newLinks = userProfile.customLinks.filter((_: any, i: number) => i !== idx);
                                                updateProfile('customLinks', newLinks);
                                            }}
                                            className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                            title="Remove"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input
                                        className="w-full bg-zinc-900/50 border-none outline-none text-[10px] text-zinc-400 placeholder-zinc-700 px-2 font-mono"
                                        placeholder="https://"
                                        value={link.url}
                                        onChange={(e) => {
                                            const newLinks = [...(userProfile.customLinks || [])];
                                            newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                                            updateProfile('customLinks', newLinks);
                                        }}
                                    />
                                </div>
                            ))}
                            {(!userProfile.customLinks || userProfile.customLinks.length === 0) && (
                                <div className="text-center py-4 border border-dashed border-zinc-800 rounded-lg">
                                    <p className="text-[10px] text-zinc-600">No custom links added yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-transparent border border-zinc-700 hover:bg-zinc-800 transition-colors">
                        Cancel
                    </button>
                    <button onClick={saveProfile} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20 transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>


            {/* Image Cropper */}
            <ImageCropperModal
                isOpen={!!rawFileImage}
                imageSrc={rawFileImage}
                onClose={() => setRawFileImage(null)}
                onSave={(cropped) => {
                    updateProfile('avatarUrl', cropped);
                    setRawFileImage(null);
                }}
            />
        </div>
    );
}
