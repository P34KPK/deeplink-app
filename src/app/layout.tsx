import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import InAppBrowserGuard from "@/components/InAppBrowserGuard";
import ErrorMonitor from "@/components/ErrorMonitor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DeepLinkrs - Smart Amazon Deep Links",
  description: "Create smart deep links for Amazon affiliate marketing",
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
            <ErrorMonitor />
            <InAppBrowserGuard>
              <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
              </div>
              {children}
            </InAppBrowserGuard>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
