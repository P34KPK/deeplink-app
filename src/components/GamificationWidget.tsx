'use client';

import CheckoutButton from '@/components/CheckoutButton';
import { Trophy, Star, Crown, Zap } from 'lucide-react';

export default function GamificationWidget({ totalClicks }: { totalClicks: number }) {
    let level = 'Rookie';
    let nextLevel = 'Pro';
    let min = 0;
    let max = 100;
    let icon = Star;
    let color = 'text-blue-400';
    let bg = 'bg-blue-500';

    if (totalClicks >= 100 && totalClicks < 1000) {
        level = 'Pro';
        nextLevel = 'Influencer';
        min = 100;
        max = 1000;
        icon = Zap;
        color = 'text-purple-400';
        bg = 'bg-purple-500';
    } else if (totalClicks >= 1000 && totalClicks < 10000) {
        level = 'Influencer';
        nextLevel = 'Titan';
        min = 1000;
        max = 10000;
        icon = Trophy;
        color = 'text-amber-400';
        bg = 'bg-amber-500';
    } else if (totalClicks >= 10000) {
        level = 'Titan';
        nextLevel = 'Legend';
        min = 10000;
        max = 100000;
        icon = Crown;
        color = 'text-red-500';
        bg = 'bg-red-600';
    }

    const progress = Math.min(((totalClicks - min) / (max - min)) * 100, 100);

    const Icon = icon;

    return (
        <div className="matte-card p-6 flex flex-col justify-between relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className="w-24 h-24" />
            </div>

            <div className="flex items-center gap-3 mb-2 z-10">
                <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Affiliate Level</h3>
                    <p className={`font-bold text-lg ${color}`}>{level}</p>
                </div>
            </div>

            <div className="space-y-2 z-10 mt-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{totalClicks} XP</span>
                    <span>{max} XP</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                        className={`h-full ${bg} transition-all duration-1000 ease-out`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="flex justify-between items-center text-[10px] z-10">
                <span className="text-muted-foreground">{Math.floor(max - totalClicks)} clicks to {nextLevel}</span>
                <span className="font-bold text-foreground/80 flex items-center gap-1">
                    <span className="opacity-50">Reward:</span>
                    <span className={color}>
                        {nextLevel === 'Pro' ? 'Verified Badge' : nextLevel === 'Influencer' ? 'Custom Themes' : 'Monetization Access'}
                    </span>
                </span>
            </div>

            {level !== 'Titan' && level !== 'Influencer' && (
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between z-10">
                    <span className="text-[10px] text-muted-foreground w-1/2 leading-tight">Can't wait for Custom Themes?</span>
                    <CheckoutButton
                        priceId="price_unlock_themes_99"
                        label="Unlock Now $99"
                        className="text-[10px] font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-2 py-1.5 rounded transition-all flex items-center gap-1.5 text-zinc-300 h-auto"
                    />
                </div>
            )}
        </div>
    );
}
