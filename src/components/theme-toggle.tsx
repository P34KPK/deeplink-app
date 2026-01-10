"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const { isSignedIn, isLoaded } = useUser()
    const [mounted, setMounted] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)
    const pathname = usePathname();
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        setMounted(true)

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Don't render the global toggle on Link in Bio pages
    if (pathname?.startsWith('/linkinbio')) {
        return null;
    }

    if (!mounted || !isLoaded) {
        return <div className="w-9 h-9 bg-muted rounded-md animate-pulse" />
    }

    // Hide toggle if not signed in
    if (!isSignedIn) {
        return null;
    }

    // Determine which icon to show for the trigger
    const getTriggerIcon = () => {
        if (theme === 'system') return <Monitor className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
        if (theme === 'dark') return <Moon className="w-4 h-4 text-zinc-100" />
        return <Sun className="w-4 h-4 text-zinc-900" />
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Select theme"
                title="Change Theme"
            >
                {getTriggerIcon()}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-0.5">
                        <button
                            onClick={() => { setTheme("light"); setIsOpen(false) }}
                            className={`relative flex items-center gap-2 px-2.5 py-2 text-sm rounded-md transition-colors w-full text-left
                                ${theme === 'light'
                                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-medium'
                                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                                }`}
                        >
                            <Sun className="w-4 h-4" />
                            <span>Light</span>
                            {theme === 'light' && <span className="absolute right-2"><Check className="w-3.5 h-3.5" /></span>}
                        </button>
                        <button
                            onClick={() => { setTheme("dark"); setIsOpen(false) }}
                            className={`relative flex items-center gap-2 px-2.5 py-2 text-sm rounded-md transition-colors w-full text-left
                                ${theme === 'dark'
                                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-medium'
                                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                                }`}
                        >
                            <Moon className="w-4 h-4" />
                            <span>Dark</span>
                            {theme === 'dark' && <span className="absolute right-2"><Check className="w-3.5 h-3.5" /></span>}
                        </button>
                        <button
                            onClick={() => { setTheme("system"); setIsOpen(false) }}
                            className={`relative flex items-center gap-2 px-2.5 py-2 text-sm rounded-md transition-colors w-full text-left
                                ${theme === 'system'
                                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-medium'
                                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'
                                }`}
                        >
                            <Monitor className="w-4 h-4" />
                            <span>System</span>
                            {theme === 'system' && <span className="absolute right-2"><Check className="w-3.5 h-3.5" /></span>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
