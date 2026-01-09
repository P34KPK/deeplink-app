"use client"

import { useTheme } from "next-themes"
import { useUser } from "@clerk/nextjs"
import { useEffect, useRef } from "react"
import { UserProfile } from "@/lib/profile-service"

export function ThemeSync() {
    const { theme, setTheme } = useTheme()
    const { user, isLoaded } = useUser()
    const isFirstLoad = useRef(true)

    // Load preference from DB when user loads
    useEffect(() => {
        if (!isLoaded || !user) return

        const fetchPreference = async () => {
            try {
                const res = await fetch('/api/user/profile')
                if (!res.ok) return
                const data: UserProfile = await res.json()

                if (data.appAppearance && ['light', 'dark', 'system'].includes(data.appAppearance)) {
                    // Only override if it's different to avoid unnecessary flickers or loops
                    // But actually, we want to enforce the account setting on a new device.
                    // Accessing internal storage of next-themes involves just calling setTheme.
                    // We can check if the current persisted theme is different, but checking 'theme' is enough.
                    if (data.appAppearance !== theme) {
                        setTheme(data.appAppearance)
                    }
                }
            } catch (e) {
                console.error("Failed to sync theme preference", e)
            } finally {
                isFirstLoad.current = false
            }
        }

        fetchPreference()
    }, [isLoaded, user?.id]) // Run once per user session start

    // Save preference to DB when theme changes
    useEffect(() => {
        if (!isLoaded || !user || isFirstLoad.current) return

        // Debounce or just save? 
        // Given this event runs infrequently (manual toggle), direct save is likely fine.
        // But we want to avoid saving if we just set it from the DB.
        // isFirstLoad might help, but let's add a small timeout or just accept one redundant save.

        const savePreference = async () => {
            try {
                await fetch('/api/user/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ appAppearance: theme })
                })
            } catch (e) {
                console.error("Failed to save theme preference", e)
            }
        }

        // We only save if isFirstLoad is false.
        // But the fetch effect sets isFirstLoad to false AFTER setting the theme.
        // Actually, if we set theme in the first effect, this effect will trigger.
        // We need to differentiate "change by user" vs "change by sync".
        // A simple way is to use a timestamp or just not worry too much about one extra POST on login.

        // Let's us a simple debounce to avoid rapid toggling spam
        const timeoutId = setTimeout(savePreference, 1000)
        return () => clearTimeout(timeoutId)

    }, [theme, isLoaded, user?.id])

    return null
}
