'use client';

import { useLanguage } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export function LanguageSwitcher({ ignoreRoute = false }: { ignoreRoute?: boolean }) {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const languages = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'es', label: 'Español', flag: '🇪🇸' }
    ] as const;

    // Don't render global switcher on Link in Bio pages (handled locally)
    if (!ignoreRoute && pathname?.startsWith('/linkinbio')) {
        return null;
    }

    const currentLang = languages.find(l => l.code === language);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-background/50 backdrop-blur border border-border hover:bg-secondary/50 transition-colors text-sm font-medium"
            >
                <Globe className="w-4 h-4" />
                <span className="hidden md:inline">{currentLang?.label}</span>
                <span className="md:hidden">{currentLang?.code.toUpperCase()}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 rounded-xl border border-border bg-popover/95 backdrop-blur shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code as any);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-secondary/50 transition-colors ${language === lang.code ? 'bg-secondary font-semibold text-primary' : 'text-foreground'
                                    }`}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
