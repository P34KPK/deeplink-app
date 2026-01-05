'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

const TOUR_STEPS = [
    {
        title: "Welcome to DeepLinkrs! 🚀",
        description: "Ready to boost your Amazon commissions? Let's create your first deep link in seconds.",
        target: "center"
    },
    {
        title: "Step 1: Paste Your Link",
        description: "Copy any Amazon product link (website or app) and paste it here.",
        target: "input_url"
    },
    {
        title: "Step 2: Generate",
        description: "Click this button to create a 'Smart Link' that automatically opens the Amazon App.",
        target: "btn_generate"
    },
    {
        title: "Step 3: Track & Grow",
        description: "See your clicks and performance in the Dashboard. Upgrade to Pro for detailed analytics!",
        target: "link_dashboard"
    }
];

export default function OnboardingTour() {
    const [step, setStep] = useState(-1); // -1 = loading check
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

    useEffect(() => {
        const seen = localStorage.getItem('hasSeenTourV1');
        if (!seen) {
            // Slight delay to ensure UI is mounted
            setTimeout(() => setStep(0), 1000);
        }
    }, []);

    useEffect(() => {
        if (step < 0 || step >= TOUR_STEPS.length) return;

        const currentStep = TOUR_STEPS[step];
        if (currentStep.target === 'center') {
            return; // No highlighting needed
        }

        // Find element
        // We need to map abstract IDs to real DOM elements. 
        // This requires the parent page to retain IDs or we use selectors.
        let el: HTMLElement | null = null;

        if (currentStep.target === 'input_url') {
            el = document.querySelector('input[placeholder*="Paste Amazon"]');
        } else if (currentStep.target === 'btn_generate') {
            el = document.querySelector('button.btn-primary.w-full');
        } else if (currentStep.target === 'link_dashboard') {
            el = document.querySelector('a[href="/sign-in"]'); // Fallback if logged out
            if (!el) el = document.querySelector('a[href="/dashboard"]');
        }

        if (el) {
            const rect = el.getBoundingClientRect();
            requestAnimationFrame(() => {
                setPosition({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height
                });
            });

            // Scroll to element
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

    }, [step]);

    const handleNext = () => {
        if (step < TOUR_STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setStep(-2); // Hidden
        localStorage.setItem('hasSeenTourV1', 'true');
    };

    if (step < 0) return null;

    const currentTour = TOUR_STEPS[step];
    const isCentered = currentTour.target === 'center';

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Backdrop with Hole (Spotlight effect) */}
            {!isCentered && (
                <>
                    <div className="absolute inset-0 bg-black/60 transition-all duration-300"
                        style={{
                            clipPath: `polygon(
                                0% 0%, 
                                0% 100%, 
                                0 ${position.top}px, 
                                ${position.left}px ${position.top}px, 
                                ${position.left}px ${position.top + position.height}px, 
                                ${position.left + position.width}px ${position.top + position.height}px, 
                                ${position.left + position.width}px ${position.top}px, 
                                100% ${position.top}px, 
                                100% 100%, 
                                100% 0%
                            )`
                        }}
                    ></div>
                    {/* Ring */}
                    <div
                        className="absolute border-2 border-primary rounded-lg shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all duration-300 pointer-events-none"
                        style={{
                            top: position.top - 4,
                            left: position.left - 4,
                            width: position.width + 8,
                            height: position.height + 8
                        }}
                    />
                </>
            )}

            {/* Centered Backdrop */}
            {isCentered && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" />
            )}

            {/* Tooltip Card */}
            <div
                className="pointer-events-auto absolute transition-all duration-500 ease-out"
                style={{
                    top: isCentered ? '50%' : position.top + position.height + 20,
                    left: isCentered ? '50%' : position.left + (position.width / 2),
                    transform: isCentered ? 'translate(-50%, -50%)' : 'translateX(-50%)',
                    width: '90%',
                    maxWidth: '400px'
                }}
            >
                <div className="matte-card bg-card border border-primary/20 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                    >
                        <X size={16} />
                    </button>

                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full border border-primary/30">
                            {step + 1} / {TOUR_STEPS.length}
                        </span>
                        <h3 className="font-bold text-lg">{currentTour.title}</h3>
                    </div>

                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                        {currentTour.description}
                    </p>

                    <div className="flex justify-end">
                        <button
                            onClick={handleNext}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {step === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
