'use client';

import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';

interface UsageNotifierProps {
    stats: {
        usage: { clicks: number };
        limits: { clicks: number };
    };
}

export default function UsageNotifier({ stats }: UsageNotifierProps) {
    useEffect(() => {
        if (!stats?.usage || !stats?.limits) return;

        const checkAndNotify = async () => {
            // Request permission on mount (safe to call multiple times)
            try {
                await LocalNotifications.requestPermissions();
            } catch (e) { console.log('Notifications not supported on web usually'); }

            const usage = stats.usage.clicks;
            const limit = stats.limits.clicks;
            const percent = (usage / limit) * 100;

            // Thresholds
            const keyBase = `notified_v1_${new Date().getMonth()}_`;

            if (percent >= 100) {
                trigger(keyBase + '100', 'Usage Limit Reached 🚨', 'You hit 100% of your free monthly clicks. Upgrade to keep links active!', 100);
            } else if (percent >= 75) {
                trigger(keyBase + '75', 'Warning: 75% Used ⚠️', 'You have used 75% of your free clicks. Consider upgrading soon.', 101);
            } else if (percent >= 50) {
                trigger(keyBase + '50', 'Halfway There 📉', 'You have used 50% of your 200 monthly clicks. Doing great!', 102);
            }
        };

        const trigger = async (key: string, title: string, body: string, id: number) => {
            if (localStorage.getItem(key)) return; // Already Notified this month

            console.log(`Triggering Notification: ${title}`);
            localStorage.setItem(key, 'true');

            try {
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title,
                            body,
                            id,
                            schedule: { at: new Date(Date.now() + 1000) }, // 1 sec delay
                            sound: undefined,
                            attachments: undefined,
                            actionTypeId: "",
                            extra: null
                        }
                    ]
                });

                // Web Fallback (since Capacitor LocalNotifications might not show system notifs on pure web)
                if (Notification.permission === 'granted') {
                    new Notification(title, { body });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification(title, { body });
                        }
                    });
                }

            } catch (e) {
                console.error("Notification Error", e);
            }
        };

        checkAndNotify();
    }, [stats]);

    return null; // Logic only component
}
