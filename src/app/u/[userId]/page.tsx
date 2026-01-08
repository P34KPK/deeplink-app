'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LegacyUserRedirect() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.userId as string;

    useEffect(() => {
        if (userId) {
            router.replace(`/linkinbio/${userId}`);
        }
    }, [userId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                <p className="text-sm text-zinc-500">Redirecting to new profile...</p>
            </div>
        </div>
    );
}
