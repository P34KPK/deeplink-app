'use client';

import { useEffect } from 'react';

export default function ErrorMonitor() {
    useEffect(() => {
        const reportError = async (data: { message: string; stack?: string; type: string }) => {
            try {
                // Avoid loops if the reporting itself fails
                if (data.message?.includes('/api/report/error')) return;

                await fetch('/api/report/error', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...data,
                        url: window.location.href,
                        userAgent: navigator.userAgent
                    }),
                    keepalive: true // Ensure it sends even if page closes
                });
            } catch (e) {
                // Silent fail
            }
        };

        // 1. Global Error Handler
        const errorHandler = (event: ErrorEvent) => {
            reportError({
                message: event.message,
                stack: event.error?.stack,
                type: 'Uncaught Exception'
            });
        };

        // 2. Promise Rejection Handler
        const rejectionHandler = (event: PromiseRejectionEvent) => {
            reportError({
                message: event.reason?.message || 'Unhandled Promise Rejection',
                stack: event.reason?.stack,
                type: 'Unhandled Rejection'
            });
        };

        window.addEventListener('error', errorHandler);
        window.addEventListener('unhandledrejection', rejectionHandler);

        return () => {
            window.removeEventListener('error', errorHandler);
            window.removeEventListener('unhandledrejection', rejectionHandler);
        };
    }, []);

    return null; // Invisible component
}
