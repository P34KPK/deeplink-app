import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import InAppBrowserGuard from "@/components/InAppBrowserGuard";
import ErrorMonitor from "@/components/ErrorMonitor";
import { LanguageProvider } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import OfflineStatus from "@/components/OfflineStatus";
import { ThemeSync } from "@/components/theme-sync";

const inter = Inter({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.deeplinkrs.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "DeepLinkrs | #1 Amazon Deep Linking Tool for Influencers",
    template: "%s | DeepLinkrs"
  },
  description: "Maximize your Amazon affiliate earnings with smart deep links that open directly in the App. The ultimate Link in Bio tool for influencers and creators.",
  keywords: [
    "Amazon deep linking",
    "affiliate marketing tool",
    "link in bio",
    "open amazon app links",
    "influencer marketing tools",
    "increase amazon commissions",
    "content creator software",
    "social media monetization"
  ],
  authors: [{ name: "P34K Productions", url: "https://www.p34k.com" }],
  creator: "P34K Productions",
  publisher: "DeepLinkrs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "DeepLinkrs - Triple Your Amazon Commissions",
    description: "Stop losing sales to the browser login. DeepLinkrs opens your affiliate links directly in the Amazon App. Try it free.",
    url: baseUrl,
    siteName: "DeepLinkrs",
    images: [
      {
        url: 'https://deeplink-app-seven.vercel.app/social-preview.png?v=2',
        width: 1200,
        height: 630,
        alt: "DeepLinkrs Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeepLinkrs | Smart Deep Links for Creators",
    description: "Don't let browser logins kill your commissions. Use DeepLinkrs to open links in the Amazon App automatically.",
    images: ['https://deeplink-app-seven.vercel.app/social-preview.png?v=2'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-official.jpg', type: 'image/jpeg' },
    ],
    shortcut: '/favicon-official.jpg',
    apple: '/favicon-official.jpg',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/favicon-official.jpg',
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'DeepLinkrs',
    statusBarStyle: 'black-translucent',
    startupImage: ['/apple-icon.png?v=3'],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "DeepLinkrs",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "description": "Free Starter Plan available"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.9",
                  "ratingCount": "120"
                }
              })
            }}
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeSync />
            <OfflineStatus />
            <ErrorMonitor />
            <LanguageProvider>
              <InAppBrowserGuard>
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
                {children}
              </InAppBrowserGuard>
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
// Force Rebuild v2
