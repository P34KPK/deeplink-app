'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ExternalLink, ShoppingBag, Share2, Copy } from 'lucide-react';

type LinkData = {
    id: string;
    title: string;
    generated: string;
    asin: string;
    hits: number;
};

export default function UserBioPage() {
    const params = useParams();
    const userId = params?.userId as string;

    const [links, setLinks] = useState<LinkData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId) return;

        fetch(`/api/public/u/${userId}`)
            .then(res => {
                if (!res.ok) throw new Error('Profile not found');
                return res.json();
            })
            .then(data => {
                setLinks(data.links || []);
            })
            .catch(err => {
                console.error(err);
                setError('Could not load profile.');
            })
            .finally(() => setLoading(false));
    }, [userId]);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'My Amazon Finds',
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Profile URL copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-white/10 rounded mb-2"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />

            {/* Header Profile */}
            <div className="relative z-10 w-full max-w-md px-6 pt-12 pb-6 flex flex-col items-center text-center animate-fade-up">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[2px] mb-4 shadow-xl shadow-blue-500/20">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden relative">
                        {/* Placeholder Avatar - could be replaced by user image */}
                        <ShoppingBag className="w-8 h-8 text-white/50" />
                    </div>
                </div>

                <h1 className="text-xl font-bold tracking-tight mb-1">Recommended Finds</h1>
                <p className="text-sm text-white/50 mb-6">Curated Amazon deals & favorite products.</p>

                <button
                    onClick={handleShare}
                    className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                    <Share2 className="w-5 h-5 text-white/70" />
                </button>
            </div>

            {/* Links List */}
            <div className="w-full max-w-md px-4 pb-24 space-y-4 relative z-10 flex-1">
                {links.length === 0 ? (
                    <div className="text-center py-12 text-white/30 text-sm">
                        No links added yet.
                    </div>
                ) : (
                    links.map((link, idx) => (
                        <a
                            key={link.id}
                            href={link.generated}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block animate-fade-up"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="group relative bg-white/10 hover:bg-white/20 border border-white/5 backdrop-blur-md rounded-full px-6 py-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-center shadow-lg hover:shadow-blue-500/10">
                                <span className="font-semibold text-sm text-white/90 group-hover:text-white transition-colors tracking-wide">
                                    {link.title || 'Amazon Product'}
                                </span>
                            </div>
                        </a>
                    ))
                )}
            </div>

            {/* Footer Branding */}
            <div className="fixed bottom-0 left-0 w-full p-6 text-center bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
                <div className="inline-flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity pointer-events-auto">
                    <span>Powered by</span>
                    <span className="font-bold text-white/50">DeepLinkrs</span>
                </div>
            </div>
        </div>
    );
}
