import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'DeepLinkrs Command Center',
    description: 'Admin Dashboard for Power Users',
    icons: {
        icon: '/admin-icon.png?v=1',
        shortcut: '/admin-icon.png?v=1',
        apple: '/admin-icon.png?v=1',
    },
    appleWebApp: {
        capable: true,
        title: 'Command Center',
        statusBarStyle: 'black-translucent',
        startupImage: ['/admin-icon.png?v=1'],
    },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
