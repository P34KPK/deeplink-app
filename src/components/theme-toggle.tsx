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
            <button className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors">
                <Sun className="h-5 w-5 opacity-0" />
            </button>
        )
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors relative"
            aria-label="Toggle theme"
        >
            <Sun className={`h-5 w-5 transition-all scale-100 rotate-0 dark:scale-0 dark:-rotate-90 ${theme === 'dark' ? 'hidden' : 'block'}`} />
            <Moon className={`h-5 w-5 transition-all absolute top-2 left-2 scale-0 rotate-90 dark:scale-100 dark:rotate-0 ${theme === 'dark' ? 'block' : 'hidden'}`} />
        </button>
    )
}
