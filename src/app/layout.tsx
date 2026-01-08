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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DeepLinkrs - Smart Amazon Deep Links",
  description: "Create smart deep links for Amazon affiliate marketing",
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
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
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
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

