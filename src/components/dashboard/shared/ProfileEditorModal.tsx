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
    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Modal Container: Flex Column, Max Height ensures it fits in viewport */}
            <div className="bg-[#09090b] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]">

                {/* Header - Fixed */}
                <div className="p-6 pb-4 flex-shrink-0 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-pink-500/10 rounded-lg">
                            <Settings className="w-5 h-5 text-pink-500" />
                        </div>
                        <h2 className="text-xl font-bold">Edit Profile</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-zinc-700 shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-5">
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
                                <div className="grid grid-cols-6 gap-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-2 pb-2">
                                    {[
                                        // Monochrome
                                        { v: '#000000', n: 'Pure Black' },
                                        { v: '#ffffff', n: 'Pure White' },
                                        { v: '#18181b', n: 'Zinc' },
                                        { v: '#27272a', n: 'Dark Zinc' },
                                        { v: '#52525b', n: 'Mid Zinc' },
                                        { v: '#a1a1aa', n: 'Light Zinc' },
                                        // Vibrants
                                        { v: '#ef4444', n: 'Red' },
                                        { v: '#f97316', n: 'Orange' },
                                        { v: '#eab308', n: 'Yellow' },
                                        { v: '#84cc16', n: 'Lime' },
                                        { v: '#22c55e', n: 'Green' },
                                        { v: '#10b981', n: 'Emerald' },
                                        { v: '#14b8a6', n: 'Teal' },
                                        { v: '#06b6d4', n: 'Cyan' },
                                        { v: '#0ea5e9', n: 'Sky' },
                                        { v: '#3b82f6', n: 'Blue' },
                                        { v: '#6366f1', n: 'Indigo' },
                                        { v: '#8b5cf6', n: 'Violet' },
                                        { v: '#d946ef', n: 'Fuchsia' },
                                        { v: '#ec4899', n: 'Pink' },
                                        { v: '#f43f5e', n: 'Rose' },
                                        // Dark Tech
                                        { v: '#020617', n: 'Slate 950' },
                                        { v: '#0f172a', n: 'Slate 900' },
                                        // Gradients - Warm
                                        { v: 'linear-gradient(to right, #f83600 0%, #f9d423 100%)', n: 'Fire' },
                                        { v: 'linear-gradient(to right, #f9d423 0%, #ff4e50 100%)', n: 'Sunset' },
                                        { v: 'linear-gradient(to top, #ff0844 0%, #ffb199 100%)', n: 'Love' },
                                        { v: 'linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)', n: 'Peach' },
                                        { v: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)', n: 'Warmth' },
                                        { v: 'linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)', n: 'Spring' },
                                        // Gradients - Cool
                                        { v: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)', n: 'Malibu' },
                                        { v: 'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)', n: 'Mint' },
                                        { v: 'linear-gradient(to top, #00c6fb 0%, #005bea 100%)', n: 'Royal' },
                                        { v: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)', n: 'Soft' },
                                        { v: 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)', n: 'Cloudy' },
                                        { v: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)', n: 'Deep Sea' },
                                        { v: 'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)', n: 'Lavender' },
                                        { v: 'linear-gradient(to top, #96fbc4 0%, #f9f586 100%)', n: 'Weed' },
                                        // Gradients - Dark/Space
                                        { v: 'linear-gradient(to right, #0f2027, #203a43, #2c5364)', n: 'Space' },
                                        { v: 'linear-gradient(to right, #2b5876 0%, #4e4376 100%)', n: 'Cosmic' },
                                        { v: 'linear-gradient(to top, #09203f 0%, #537895 100%)', n: 'Midnight City' },
                                        { v: 'linear-gradient(to right, #434343 0%, #000000 100%)', n: 'Noir' },
                                        { v: 'linear-gradient(to right, #868f96 0%, #596164 100%)', n: 'Metal' },
                                        { v: 'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)', n: 'Purple Haze' },
                                        { v: 'linear-gradient(to right, #b24592, #f15f79)', n: 'Grapefruit' },
                                        { v: 'linear-gradient(to right, #c2e59c, #64b3f4)', n: 'Green Blue' },
                                        // Special
                                        { v: 'linear-gradient(to right, #ECE9E6, #FFFFFF)', n: 'Clean' },
                                        { v: 'linear-gradient(to bottom, #323232 0%, #3F3F3F 40%, #1C1C1C 150%), linear-gradient(to top, rgba(255,255,255,0.40) 0%, rgba(0,0,0,0.25) 200%)', n: 'Metal 2' },
                                        { v: 'conic-gradient(at center top, rgb(139, 92, 246), rgb(236, 72, 153), rgb(239, 68, 68))', n: 'Conic' },
                                        { v: 'radial-gradient(circle at 50% 50%, #4a90e2, #9013fe)', n: 'Orb' },
                                        { v: 'linear-gradient(45deg, #12c2e9, #c471ed, #f64f59)', n: 'JShine' },
                                        { v: 'linear-gradient(to right, #7f00ff, #e100ff)', n: 'Violet' },
                                    ].map(theme => (
                                        <div
                                            key={theme.v}
                                            className={`h-8 rounded-full md:rounded cursor-pointer border transition-all relative group flex-shrink-0 ${userProfile.theme === theme.v ? 'border-white ring-2 ring-pink-500 ring-offset-2 ring-offset-zinc-900 z-10 scale-105' : 'border-white/10 hover:border-white/50'}`}
                                            style={{ background: theme.v }}
                                            onClick={() => updateProfile('theme', theme.v)}
                                            title={theme.n}
                                        >
                                            {userProfile.theme === theme.v && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div></div>}
                                        </div>
                                    ))}
                                </div>
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
                                                const newLinks = (userProfile.customLinks || []).filter((_: any, i: number) => i !== idx);
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

            </div>

            {/* Footer - Fixed */}
            <div className="p-4 border-t border-white/10 bg-[#09090b] rounded-b-2xl flex gap-3 flex-shrink-0 z-10">
                <button onClick={onClose} className="flex-1 py-3 rounded-lg text-sm font-bold bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 transition-colors">
                    Cancel
                </button>
                <button onClick={saveProfile} className="flex-1 py-3 rounded-lg text-sm font-bold bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02]">
                    Save Changes
                </button>
            </div>
        </div>
        </div >
    );
}
