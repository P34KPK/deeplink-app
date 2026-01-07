'use client';

import { useState, useEffect } from 'react';
import { User, Check, AlertTriangle, Instagram, Youtube, Edit, Globe, ShoppingBag, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface IdentityWidgetProps {
    userId: string;
    onEditProfile: () => void;
}

interface UserProfile {
    username: string;
    avatarUrl?: string;
    amazonTag?: string;
    socials: {
        instagram?: string;
        tiktok?: string;
        youtube?: string;
        [key: string]: any;
    };
    handle?: string;
}

export default function IdentityWidget({ userId, onEditProfile }: IdentityWidgetProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        fetch('/api/user/profile')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setProfile(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load profile", err);
                setLoading(false);
            });
    }, [userId]);

    if (loading) {
        return (
            <div className="matte-card p-6 h-full flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-zinc-800 rounded-full mb-4"></div>
                <div className="h-4 w-32 bg-zinc-800 rounded mb-2"></div>
                <div className="h-3 w-24 bg-zinc-800 rounded"></div>
            </div>
        );
    }

    const hasAmazonTag = !!profile?.amazonTag && profile.amazonTag.trim().length > 0;
    const socialCount = Object.values(profile?.socials || {}).filter(v => v && v.length > 0).length;
    const displayName = profile?.username || 'Influencer';

    return (
        <div className="matte-card p-6 h-full flex flex-col items-center text-center justify-between relative group overflow-hidden bg-gradient-to-br from-card to-zinc-900/50">

            {/* Edit Button (Absolute Top Left) - Subtle */}
            <button
                onClick={onEditProfile}
                className="absolute top-3 left-3 p-1.5 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800 transition-colors z-20"
                title="Edit Profile"
            >
                <Edit className="w-4 h-4" />
            </button>

            {/* Top Section: Avatar & Identity */}
            <div className="flex flex-col items-center mt-2 w-full">
                <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-full border-2 border-zinc-700 overflow-hidden bg-zinc-800 flex items-center justify-center shadow-lg relative z-10 transition-transform group-hover:scale-105">
                        {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-zinc-500" />
                        )}
                    </div>
                </div>

                <h3 className="font-bold text-lg leading-tight w-full max-w-[200px] truncate px-2">{displayName}</h3>

                {/* Handle / UserID - Truncated */}
                <p className="text-xs text-muted-foreground w-full max-w-[180px] truncate mt-0.5 opacity-70">
                    @{profile?.handle || userId}
                </p>

                {/* Status Badge - Centered */}
                <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${hasAmazonTag ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse'}`}>
                    {hasAmazonTag ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    <span>{hasAmazonTag ? 'Store ID Active' : 'Store ID Missing'}</span>
                </div>
            </div>

            {/* Bottom Section: Compact Stats */}
            <div className="w-full grid grid-cols-2 gap-3 mt-4">
                <div className="flex flex-col items-center bg-secondary/30 rounded-lg py-2 border border-white/5">
                    <span className="text-lg font-bold">{socialCount}</span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">Socials</span>
                </div>
                <div className="flex flex-col items-center bg-secondary/30 rounded-lg py-2 border border-white/5 opacity-50 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
                        <span className="text-[8px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">SOON</span>
                    </div>
                    <Globe className="w-4 h-4 mb-0.5 text-indigo-400" />
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wide">Page</span>
                </div>
            </div>
        </div>
    );
}
