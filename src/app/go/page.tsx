'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DeepLinkRedirect from '@/components/DeepLinkRedirect';

function RedirectContent() {
    const searchParams = useSearchParams();
    const asin = searchParams.get('asin');
    const tag = searchParams.get('tag');
    const domain = searchParams.get('domain') || 'com';

    if (!asin) return <div>Invalid Link</div>;

    return <DeepLinkRedirect asin={asin} tag={tag} domain={domain} />;
}

export default function RedirectPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white bg-[#050505]">...</div>}>
            <RedirectContent />
        </Suspense>
    );
}
