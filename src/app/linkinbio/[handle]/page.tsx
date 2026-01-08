'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, ShoppingBag, Share2, Copy, Search, CheckCircle2, Instagram, Twitter, Youtube, Facebook, Sun, Moon } from 'lucide-react';

type LinkData = {
    id: string;
    title: string;
    generated: string;
    asin: string;
    image?: string;
    hits: number;
    tags?: string[];
};

export default function UserBioPage() {
    const params = useParams();
    const handle = params?.handle as string;

    const [links, setLinks] = useState<LinkData[]>([]);
    const [user, setUser] = useState<any>(null);
    const [filteredLinks, setFilteredLinks] = useState<LinkData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    useEffect(() => {
        if (!handle) return;

        // API supports both userId and handle resolution
        fetch(`/api/public/u/${handle}`)
            .then(res => {
                if (!res.ok) throw new Error('Profile not found');
                return res.json();
            })
            .then(data => {
                const fetchedLinks = data.links || [];
                setLinks(fetchedLinks);
                setFilteredLinks(fetchedLinks);
                if (data.user) {
                    setUser(data.user);
                    if (data.user.theme) setTheme(data.user.theme);
                }
            })
            .catch(err => {
                console.error(err);
                setError('Could not load profile.');
            })
            .finally(() => setLoading(false));
    }, [handle]);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredLinks(links);
        } else {
            const lowerQ = searchQuery.toLowerCase();
            setFilteredLinks(links.filter(l =>
                l.title.toLowerCase().includes(lowerQ) ||
                l.asin.toLowerCase().includes(lowerQ)
            ));
        }
    }, [searchQuery, links]);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: user?.username || 'My Amazon Favorites',
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('URL copied!');
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
                <div className="animate-pulse flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-full mb-4 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                    <div className={`h-4 w-32 rounded mb-2 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
                <p className="text-zinc-500">{error}</p>
            </div>
        );
    }

    // Real User Profile Data
    const username = user?.username || "Influencer Picks";
    const bio = user?.bio || "Curated deals and my favorite Amazon finds. Shop below! 👇";

    // Handle Theme Logic
    // If no theme is set, default to dark
    const themeValue = user?.theme || '#000000';

    // Check if it's a gradient or hex
    const isGradient = themeValue.includes('gradient');
    const isDark = !['#ffffff', '#f4f4f5', '#e1e1e1'].includes(themeValue) && !themeValue.includes('#ffffff');

    // Dynamic Style for bg
    const bgStyle = {
        background: themeValue
    };

    return (
        <div className={`min-h-screen flex flex-col items-center relative overflow-hidden font-sans transition-colors duration-500`} style={{ color: isDark ? 'white' : '#18181b', ...bgStyle }}>


            {/* Dynamic Background Mesh */}
            <div className="fixed inset-0 z-0">
                {user?.backgroundImage ? (
                    <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000" style={{ backgroundImage: `url(${user.backgroundImage})` }}>
                        <div className={`absolute inset-0 backdrop-blur-[2px] ${isDark ? 'bg-black/60' : 'bg-white/40'}`}></div>
                    </div>
                ) : (
                    <>
                        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse ${isDark ? 'bg-purple-900/20' : 'bg-purple-500/10'}`} style={{ animationDuration: '4s' }} />
                        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] animate-pulse ${isDark ? 'bg-blue-900/20' : 'bg-blue-500/10'}`} style={{ animationDuration: '6s' }} />
                    </>
                )}
            </div>

            <div className={`w-full max-w-lg relative z-10 flex flex-col min-h-screen backdrop-blur-sm border-x shadow-2xl transition-colors duration-500`} style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)' }}>

                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button onClick={toggleTheme} className={`p-2.5 rounded-full border transition-all shadow-md active:scale-95 ${isDark ? 'bg-zinc-950 border-white/20 text-white hover:bg-zinc-900' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`}>
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <button onClick={handleShare} className={`p-2.5 rounded-full border transition-all shadow-md active:scale-95 ${isDark ? 'bg-zinc-950 border-white/20 text-white hover:bg-zinc-900' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50'}`}>
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Profile Section */}
                <div className="pt-4 pb-6 px-6 flex flex-col items-center text-center">
                    <div className="relative mb-4 group cursor-pointer">
                        <div className={`w-24 h-24 rounded-full border-2 overflow-hidden shadow-2xl relative transition-colors ${isDark ? 'bg-zinc-800 border-zinc-700/50' : 'bg-zinc-200 border-white'}`}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt={username} className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${isDark ? 'from-zinc-800 to-zinc-900' : 'from-zinc-100 to-zinc-200'}`}>
                                    <ShoppingBag className={`w-8 h-8 ${isDark ? 'text-white/20' : 'text-zinc-400'}`} />
                                </div>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-transparent shadow-sm" title="Verified Creator">
                            <CheckCircle2 className="w-3 h-3" />
                        </div>
                    </div>

                    <h1 className={`text-xl font-bold tracking-tight mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                        {username}
                    </h1>
                    <p className={`text-sm max-w-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {bio}
                    </p>

                    {/* Socials Row */}
                    <div className="flex items-center gap-4 mt-6">
                        {user?.socials?.instagram && (
                            <a href={user.socials.instagram} target="_blank" rel="noopener noreferrer" className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} hover:text-pink-500 transition-colors`}><Instagram className="w-5 h-5" /></a>
                        )}
                        {user?.socials?.tiktok && (
                            <a href={user.socials.tiktok} target="_blank" rel="noopener noreferrer" className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} hover:text-white transition-colors`}><Twitter className="w-5 h-5" /></a>
                        )}
                        {user?.socials?.youtube && (
                            <a href={user.socials.youtube} target="_blank" rel="noopener noreferrer" className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} hover:text-red-500 transition-colors`}><Youtube className="w-5 h-5" /></a>
                        )}
                        {user?.socials?.facebook && (
                            <a href={user.socials.facebook} target="_blank" rel="noopener noreferrer" className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} hover:text-blue-600 transition-colors`}><Facebook className="w-5 h-5" /></a>
                        )}
                    </div>

                    {/* Custom Links (Dynamic) */}
                    {user?.customLinks && user.customLinks.length > 0 && (
                        <div className="w-full flex flex-col gap-2 mt-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
                            {user.customLinks.map((link: any) => (
                                <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`
                                        w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg
                                        flex items-center justify-center gap-2
                                        ${isDark
                                            ? 'bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-white hover:border-pink-500/50 hover:shadow-pink-500/10'
                                            : 'bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 hover:border-pink-500/30'
                                        }
                                    `}
                                >
                                    <span>{link.label}</span>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search Bar */}
                <div className="px-6 mb-6">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className={`w-full text-sm px-10 py-3 rounded-xl focus:outline-none focus:ring-1 transition-all ${isDark ? 'bg-zinc-900/80 border border-white/10 text-white focus:border-white/20 focus:ring-white/20 placeholder:text-zinc-600' : 'bg-white border border-zinc-200 text-zinc-900 focus:border-zinc-300 focus:ring-zinc-300 placeholder:text-zinc-400 shadow-sm'}`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${isDark ? 'text-zinc-500 group-focus-within:text-white' : 'text-zinc-400 group-focus-within:text-zinc-600'}`} />
                    </div>
                </div>

                {/* Links Feed */}
                <div className="flex-1 px-4 pb-32 space-y-3">
                    {filteredLinks.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-zinc-500 text-sm">No products found.</p>
                        </div>
                    ) : (
                        filteredLinks.map((link, idx) => (
                            <a
                                key={link.id}
                                href={link.generated}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className={`
                                    relative overflow-hidden
                                    border rounded-[1.25rem] p-1.5 pr-4
                                    transition-all duration-300 ease-out
                                    hover:scale-[1.01] hover:shadow-xl
                                    flex items-center gap-3
                                    ${isDark
                                        ? 'bg-zinc-900 hover:bg-zinc-800/80 border-white/5 hover:border-white/20 hover:shadow-purple-500/5'
                                        : 'bg-white hover:bg-zinc-50 border-zinc-100 hover:border-zinc-200 hover:shadow-zinc-200/50 shadow-sm'}
                                `}>
                                    {/* Thumbnail */}
                                    <div className={`w-12 h-12 shrink-0 rounded-2xl overflow-hidden relative ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                                        {link.image ? (
                                            <img src={link.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag className={`w-5 h-5 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 py-1">
                                        <h3 className={`font-semibold text-sm truncate pr-2 transition-colors ${isDark ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-800 group-hover:text-black'}`}>
                                            {link.title || 'Amazon Product'}
                                        </h3>
                                        {link.tags && link.tags.length > 0 && (
                                            <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">
                                                {link.tags[0]}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Icon */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                        <ExternalLink className={`w-4 h-4 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                                    </div>
                                </div>
                            </a>
                        ))
                    )}
                </div>

                {/* Branding Footer */}
                <div className="absolute bottom-6 left-0 w-full flex justify-center pointer-events-none">
                    <Link href="/" className={`pointer-events-auto backdrop-blur border rounded-full px-4 py-1.5 flex items-center gap-2 transition-colors shadow-lg ${isDark ? 'bg-zinc-950/80 border-white/10 hover:bg-white/10' : 'bg-white/80 border-zinc-200 hover:bg-zinc-50'}`}>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className={`text-[10px] font-bold tracking-wide ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Create your own DeepLinkrs</span>
                    </Link>
                </div>

            </div>
        </div>
    );
}
