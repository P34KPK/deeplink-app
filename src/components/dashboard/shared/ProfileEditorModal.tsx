'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Wand2 } from 'lucide-react';

interface ProfileEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

interface UserProfile {
    username: string;
    bio: string;
    avatarUrl?: string;
    backgroundImage?: string;
    socials: {
        instagram?: string;
        tiktok?: string;
        youtube?: string;
        [key: string]: string | undefined;
    };
    [key: string]: any; // fallback for loose API structure
}

export default function ProfileEditorModal({ isOpen, onClose, userId }: ProfileEditorModalProps) {
    const [userProfile, setUserProfile] = useState<UserProfile>({
        username: '',
        bio: '',
        socials: {}
    });
    const [pendingImage, setPendingImage] = useState<string | null>(null);
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
            onClose();
            // TODO: Trigger a refresh of the preview if needed
        }
    };

    const generateBackground = () => {
        const prompt = window.prompt("✨ AI Background Generator\n\nDescribe the vibe you want (e.g., 'cyberpunk city neon rain', 'pastel clouds aesthetic'):", "aesthetic gradient abstract");
        if (prompt === null) return;

        setIsGenerating(true);
        const finalPrompt = prompt || "aesthetic gradient abstract";
        const seed = Math.floor(Math.random() * 1000000);

        // Point directly to local proxy to solve CORS/AdBlock
        const proxyUrl = `/api/ai/generate-image?prompt=${encodeURIComponent(finalPrompt)}&seed=${seed}`;

        setPendingImage(proxyUrl);
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
                                    <div className="relative group cursor-pointer">
                                        {userProfile.avatarUrl ? (
                                            <img src={userProfile.avatarUrl} className="w-14 h-14 rounded-full border border-zinc-700 object-cover" alt="Preview" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500">
                                                <span className="text-xs">?</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] text-white font-bold uppercase">Edit</span>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (readerEvent) => {
                                                        const img = new Image();
                                                        img.onload = () => {
                                                            const canvas = document.createElement('canvas');
                                                            const MAX_SIZE = 400;
                                                            let width = img.width;
                                                            let height = img.height;

                                                            if (width > height) {
                                                                if (width > MAX_SIZE) {
                                                                    height *= MAX_SIZE / width;
                                                                    width = MAX_SIZE;
                                                                }
                                                            } else {
                                                                if (height > MAX_SIZE) {
                                                                    width *= MAX_SIZE / height;
                                                                    height = MAX_SIZE;
                                                                }
                                                            }
                                                            canvas.width = width;
                                                            canvas.height = height;
                                                            const ctx = canvas.getContext('2d');
                                                            ctx?.drawImage(img, 0, 0, width, height);
                                                            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                                            updateProfile('avatarUrl', dataUrl);
                                                        };
                                                        img.src = readerEvent.target?.result as string;
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-zinc-400 mb-2">Upload a profile picture. JPG, PNG or GIF.</p>
                                        <button className="text-[10px] border border-zinc-700 hover:bg-zinc-800 px-3 py-1.5 rounded text-zinc-300 transition-colors pointer-events-none">
                                            Click orb to upload
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1.5 block">Display Name</label>
                                <input className="input-minimal w-full py-2 px-3 text-sm bg-zinc-900 border border-zinc-800 rounded-lg focus:border-pink-500 outline-none transition-colors" placeholder="e.g. Sarah's Picks" value={userProfile.username || ''} onChange={e => updateProfile('username', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1.5 block">Bio</label>
                                <textarea className="input-minimal w-full py-2 px-3 text-sm resize-none h-20 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-pink-500 outline-none transition-colors" placeholder="Tell your audience about your style..." value={userProfile.bio || ''} onChange={e => updateProfile('bio', e.target.value)} />
                            </div>

                            {/* Theme Customization Section */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] text-zinc-500 uppercase font-bold block">Page Theme</label>
                                    <span className="text-[9px] text-pink-500 font-bold border border-pink-500/20 bg-pink-500/10 px-1.5 rounded">INFLUENCER UNLOCK</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {['#000000', '#1a1a2e', '#2e1a1a', '#1a2e1a'].map(color => (
                                        <div key={color} className="h-8 rounded cursor-pointer border border-white/10 hover:border-white/50 transition-colors relative" style={{ backgroundColor: color }}>
                                            {/* Selection Logic would go here */}
                                        </div>
                                    ))}
                                    <button onClick={generateBackground} className="col-span-4 mt-1 flex items-center justify-center gap-2 py-2 rounded border border-dashed border-zinc-700 hover:border-pink-500 hover:text-pink-500 text-zinc-500 text-xs transition-colors group">
                                        <Wand2 className="w-3 h-3 group-hover:animate-pulse" />
                                        <span>{userProfile.backgroundImage ? 'Generate New Background' : 'Generate with AI'}</span>
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

                            <div className="space-y-3 pt-2">
                                <label className="text-[10px] text-zinc-500 uppercase font-bold block">Social Links</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center gap-2 bg-zinc-900 px-3 rounded-lg border border-zinc-800">
                                        <span className="text-zinc-500 text-xs">Instagram</span>
                                        <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                                        <input className="bg-transparent border-none outline-none text-xs w-full py-2.5" placeholder="Profile URL" value={userProfile.socials?.instagram || ''} onChange={e => updateSocial('instagram', e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-2 bg-zinc-900 px-3 rounded-lg border border-zinc-800">
                                        <span className="text-zinc-500 text-xs">TikTok</span>
                                        <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                                        <input className="bg-transparent border-none outline-none text-xs w-full py-2.5" placeholder="Profile URL" value={userProfile.socials?.tiktok || ''} onChange={e => updateSocial('tiktok', e.target.value)} />
                                    </div>
                                    <div className="flex items-center gap-2 bg-zinc-900 px-3 rounded-lg border border-zinc-800">
                                        <span className="text-zinc-500 text-xs">YouTube</span>
                                        <div className="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                                        <input className="bg-transparent border-none outline-none text-xs w-full py-2.5" placeholder="Channel URL" value={userProfile.socials?.youtube || ''} onChange={e => updateSocial('youtube', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
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
        </div>
    );
}
