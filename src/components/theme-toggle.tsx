"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-14 h-8 bg-muted rounded-full animate-pulse" />
        )
    }

    const isDark = theme === "dark"

    return (
        <label className="relative inline-flex items-center cursor-pointer group">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={isDark}
                onChange={() => setTheme(isDark ? "light" : "dark")}
            />
            <div className="w-16 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-zinc-400 dark:peer-focus:ring-zinc-600 transition-colors duration-300">
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white dark:bg-zinc-950 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-8' : 'translate-x-0'}`}>
                    {isDark ? (
                        <Moon className="w-3.5 h-3.5 text-zinc-100" />
                    ) : (
                        <Sun className="w-3.5 h-3.5 text-orange-400" />
                    )}
                </div>

                {/* Background Icons/Text for context */}
                <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
                    <Sun className={`w-3 h-3 text-zinc-400 ${isDark ? 'opacity-100' : 'opacity-0'} transition-opacity delay-100`} />
                    <Moon className={`w-3 h-3 text-zinc-500 ${isDark ? 'opacity-0' : 'opacity-100'} transition-opacity delay-100`} />
                </div>
            </div>
        </label>
    )
}
