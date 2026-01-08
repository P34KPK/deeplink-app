'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, ShoppingBag, Share2, Search, CheckCircle2, Instagram, Twitter, Youtube, Facebook, ArrowUpRight, Sun, Moon } from 'lucide-react';

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

    // Theme State: Defaults to 'light'
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const isDark = theme === 'dark';

    useEffect(() => {
        if (!handle) return;

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
                title: user?.username || 'My Picks',
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard');
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                    <div className={`h-2 w-32 rounded ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black text-zinc-400' : 'bg-gray-50 text-zinc-600'}`}>
                <p>{error}</p>
            </div>
        );
    }

    const username = user?.username || "Creator";
    const bio = user?.bio || "Welcome to my curated collection.";

    return (
        <div
            className={`min-h-screen w-full relative transition-colors duration-500 font-sans ${isDark ? 'bg-[#050505] text-white' : 'bg-[#fafafa] text-black'}`}
            style={{ color: isDark ? 'white' : 'black' }}
        >

            {/* Background Ambient Effects */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                {user?.backgroundImage ? (
                    <>
                        <div className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${isDark ? 'opacity-30' : 'opacity-15'}`} style={{ backgroundImage: `url(${user.backgroundImage})`, filter: 'blur(40px)' }} />
                        <div className={`absolute inset-0 ${isDark ? 'bg-black/60' : 'bg-white/60'}`} />
                    </>
                ) : (
                    <>
                        {/* Dynamic Orbs based on Theme */}
                        <div className={`absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] mix-blend-screen animate-pulse ${isDark ? 'bg-purple-900 opacity-40' : 'bg-purple-300 opacity-30 mix-blend-multiply'}`} style={{ animationDuration: '8s' }} />
                        <div className={`absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] mix-blend-screen animate-pulse ${isDark ? 'bg-blue-900 opacity-40' : 'bg-blue-300 opacity-30 mix-blend-multiply'}`} style={{ animationDuration: '10s', animationDelay: '1s' }} />
                    </>
                )}
            </div>

            {/* Theme Toggle (Fixed Top Right) */}
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={toggleTheme}
                    className={`p-3 rounded-full backdrop-blur-md shadow-lg border transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-zinc-900/80 border-white/10 text-white hover:bg-zinc-800' : 'bg-white/80 border-zinc-200 text-black hover:bg-zinc-50'}`}
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>

            {/* Main Layout Container */}
            <div className="relative z-10 w-full max-w-7xl mx-auto md:min-h-screen flex flex-col md:flex-row md:p-8 lg:p-12 gap-8">

                {/* --- LEFT PANEL: PROFILE (Sticky Desktop) --- */}
                <div className="w-full md:w-[360px] lg:w-[400px] shrink-0 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className={`
                        w-full md:sticky md:top-12 
                        backdrop-blur-xl rounded-[2rem] border shadow-2xl overflow-hidden
                        transition-all duration-500
                        ${isDark
                            ? 'bg-zinc-900/60 border-white/5 shadow-black/20'
                            : 'bg-white/70 border-white/60 shadow-zinc-200/50'
                        }
                    `}>
                        {/* Profile Header Image/Color */}
                        <div className={`h-36 w-full relative ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                            {user?.backgroundImage && (
                                <img src={user.backgroundImage} className="w-full h-full object-cover opacity-80" alt="" />
                            )}
                            <div className="absolute -bottom-10 left-1/2 md:left-8 -translate-x-1/2 md:translate-x-0">
                                <div className={`w-28 h-28 rounded-full p-1.5 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                                    <div className={`w-full h-full rounded-full overflow-hidden border-2 relative ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-white">{username.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-0.5 rounded-full border-2 border-inherit shadow-sm">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Body */}
                        <div className="pt-14 pb-8 px-6 md:px-8 flex flex-col items-center md:items-start w-full">
                            <h1
                                className="text-2xl md:text-3xl font-bold tracking-tight mb-2"
                                style={{ color: isDark ? 'white' : 'black' }}
                            >
                                {username}
                            </h1>
                            <p
                                className="text-sm leading-relaxed mb-6 font-medium max-w-xs"
                                style={{ color: isDark ? '#a1a1aa' : '#52525b' }} // zinc-400 / zinc-600
                            >
                                {bio}
                            </p>

                            {/* Socials */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
                                {[
                                    { icon: ExternalLink, href: user?.socials?.website, color: isDark ? 'hover:text-cyan-400' : 'hover:text-cyan-700' },
                                    { icon: Instagram, href: user?.socials?.instagram, color: isDark ? 'hover:text-pink-500' : 'hover:text-pink-600' },
                                    { icon: Twitter, href: user?.socials?.tiktok, color: isDark ? 'hover:text-white' : 'hover:text-black' },
                                    { icon: Youtube, href: user?.socials?.youtube, color: isDark ? 'hover:text-red-500' : 'hover:text-red-600' },
                                    { icon: Facebook, href: user?.socials?.facebook, color: isDark ? 'hover:text-blue-500' : 'hover:text-blue-700' }
                                ].map((item, i) => item.href && (
                                    <a
                                        key={i}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`p-2.5 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${isDark ? 'bg-white/5 text-zinc-400 hover:bg-white/10' : 'bg-gray-100 text-zinc-600 hover:bg-gray-200'} ${item.color}`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>

                            {/* Utility Buttons */}
                            <div className="flex items-center gap-3 w-full">
                                <button
                                    onClick={handleShare}
                                    className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${isDark ? 'bg-white text-black hover:bg-zinc-200 shadow-white/5' : 'bg-black text-white hover:bg-zinc-800 shadow-zinc-200'}`}
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                            </div>
                        </div>

                        {/* Custom Links Section (Embedded) */}
                        {user?.customLinks && user.customLinks.length > 0 && (
                            <div className={`border-t px-6 py-4 flex flex-col gap-2 w-full ${isDark ? 'border-white/5 bg-zinc-900/40' : 'border-zinc-100 bg-gray-50/50'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1 px-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Links</p>
                                {user.customLinks.map((link: any) => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`
                                            w-full py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-between group
                                            ${isDark ? 'hover:bg-white/5 text-zinc-300 hover:text-white' : 'hover:bg-white text-zinc-700 hover:text-black hover:shadow-sm border border-transparent hover:border-zinc-200'}
                                        `}
                                    >
                                        <span className="truncate">{link.label}</span>
                                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT PANEL: CONTENT --- */}
                <div className="flex-1 w-full min-w-0 flex flex-col pb-24 md:pb-0">

                    {/* Search Bar (Floating) */}
                    <div className="sticky top-6 z-30 mb-8 px-4 md:px-0">
                        <div className={`
                            relative group w-full backdrop-blur-xl rounded-2xl shadow-xl transition-all duration-300
                            ${isDark
                                ? 'bg-zinc-900/70 shadow-black/20 ring-1 ring-white/10 focus-within:ring-white/20 focus-within:bg-zinc-900/90'
                                : 'bg-white/80 shadow-zinc-200/50 ring-1 ring-black/5 focus-within:ring-black/10 focus-within:bg-white'}
                        `}>
                            <input
                                type="text"
                                placeholder="Search products, gear, and more..."
                                className={`w-full bg-transparent text-sm py-4 pl-12 pr-4 outline-none font-medium ${isDark ? 'text-white placeholder:text-zinc-500' : 'text-black placeholder:text-zinc-400'}`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isDark ? 'text-zinc-500 group-focus-within:text-white' : 'text-zinc-400 group-focus-within:text-black'}`} />
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="px-4 md:px-0">
                        {filteredLinks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                                <Search className={`w-12 h-12 mb-4 opacity-50 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>No items found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredLinks.map((link) => (
                                    <a
                                        key={link.id}
                                        href={link.generated}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`
                                            group relative flex flex-row sm:flex-col
                                            h-32 sm:h-auto w-full rounded-[1.5rem] overflow-hidden 
                                            transition-all duration-500 ease-out
                                            hover:scale-[1.02] active:scale-[0.98]
                                            ${isDark
                                                ? 'bg-zinc-900/40 hover:bg-zinc-800/60 ring-1 ring-white/10 hover:ring-white/20 shadow-lg shadow-black/10'
                                                : 'bg-white hover:bg-white border border-gray-100 hover:border-gray-300 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5'}
                                        `}
                                    >
                                        {/* Image Container */}
                                        <div className={`
                                                relative w-32 sm:w-full shrink-0 sm:aspect-[4/3] overflow-hidden
                                                ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}
                                            `}>
                                            {link.image ? (
                                                <img
                                                    src={link.image}
                                                    alt={link.title}
                                                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!isDark && 'mix-blend-multiply opacity-95'}`}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900">
                                                    <ShoppingBag className="opacity-20 w-8 h-8" />
                                                </div>
                                            )}

                                            {/* Top Right Tag */}
                                            {link.tags && link.tags.length > 0 && (
                                                <div className={`absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold uppercase tracking-wider border shadow-lg ${isDark ? 'bg-black/50 text-white border-white/10' : 'bg-white/90 text-black border-black/10'}`}>
                                                    {link.tags[0]}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-4 flex flex-col justify-center sm:justify-start">
                                            <h3 className={`font-semibold text-sm leading-snug line-clamp-2 mb-2 transition-colors ${isDark ? 'text-zinc-200 group-hover:text-white' : 'text-black group-hover:text-indigo-600'}`}>
                                                {link.title}
                                            </h3>

                                            <div className="mt-auto pt-1 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                                                <span className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Shop Now</span>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Mobile Footer Branding */}
            <div className="md:hidden fixed bottom-6 left-0 w-full flex justify-center pointer-events-none z-50">
                <Link href="/" className={`pointer-events-auto backdrop-blur-xl pl-4 pr-5 py-2 rounded-full text-[10px] font-bold tracking-widest ring-1 shadow-2xl flex items-center gap-2 transform active:scale-95 transition-transform ${isDark ? 'bg-black/80 text-white ring-white/20' : 'bg-white/90 text-black ring-black/10'}`}>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    POWERED BY DEEPLINK
                </Link>
            </div>
        </div>
    );
}
