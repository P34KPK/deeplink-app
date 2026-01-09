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
    // Enforce default Light theme for guests (signed out)
    useEffect(() => {
        if (!isLoaded) return;

        // If user is not signed in, and we are not in light mode, force light.
        // This ensures the "landing" experience is always white as requested.
        if (!user && theme !== 'light') {
            // We need to be careful not to fight with user intent if they JUST logged out.
            // But the requirement is "starts white... only signed up can choose".
            // So forcing light on signout is correct.
            setTheme('light')
        }
    }, [isLoaded, user, theme, setTheme])

    // Save preference to DB when theme changes (only if logged in)
    useEffect(() => {
        if (!isLoaded || !user || isFirstLoad.current) return

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

        const timeoutId = setTimeout(savePreference, 1000)
        return () => clearTimeout(timeoutId)

    }, [theme, isLoaded, user])


    return null
}
