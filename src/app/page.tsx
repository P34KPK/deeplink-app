'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Link as LinkIcon, Copy, Check, BarChart3, LayoutDashboard, Activity } from "lucide-react";
import { ThemeToggle } from '@/components/theme-toggle';

type ArchivedLink = {
  id: string;
  original: string;
  generated: string;
  asin: string;
  title: string;
  description: string;
  date: number;
};

import { SignedIn, SignedOut, UserButton, useAuth, SignOutButton } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const [inputUrl, setInputUrl] = useState('');
  // ... (keep usage of state)
  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [inputSlug, setInputSlug] = useState(''); // Custom Alias

  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ArchivedLink[]>([]);
  const [isPro, setIsPro] = useState(false);

  // Bug Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [sendingReport, setSendingReport] = useState(false);

  const handleReportSubmit = async () => {
    if (!reportMessage.trim()) return;
    setSendingReport(true);
    try {
      await fetch('/api/report', {
        method: 'POST',
        body: JSON.stringify({ message: reportMessage }),
        headers: { 'Content-Type': 'application/json' }
      });
      setReportMessage('');
      setReportOpen(false);
      alert('Thanks for your feedback! We will look into it.');
    } catch (e) {
      alert('Failed to send report.');
    } finally {
      setSendingReport(false);
    }
  };

  // Load history on mount (ONLY if signed in)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    fetch('/api/links')
      .then(res => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then(serverData => {
        if (Array.isArray(serverData)) {
          // Check for local migration
          const localSaved = localStorage.getItem('deeplink_history');
          if (localSaved) {
            try {
              const localHistory = JSON.parse(localSaved);
              if (Array.isArray(localHistory) && localHistory.length > 0) {
                // Sync local to server
                fetch('/api/links', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(localHistory)
                })
                  .then(res => res.json())
                  .then(mergedData => {
                    setHistory(mergedData);
                    localStorage.removeItem('deeplink_history'); // Clear local after sync
                    console.log("Migrated local history to server");
                  })
                  .catch(e => {
                    console.error("Failed to sync local history", e);
                    setHistory(serverData); // Fallback
                  });
              } else {
                setHistory(serverData);
              }
            } catch (e) {
              setHistory(serverData);
            }
          } else {
            setHistory(serverData);
          }
        }
      })
      .catch(err => console.error("Failed to load history", err));

    // Check Plan Status
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.plan === 'pro') {
          setIsPro(true);
        }
      })
      .catch(e => console.error("Failed to check plan", e));

  }, [isLoaded, isSignedIn]);

  const generateLink = async () => {
    setError('');
    setGeneratedLink('');
    setLoading(true);

    try {
      let targetUrl = inputUrl;

      // Basic validation
      if (!targetUrl.includes('amazon') && !targetUrl.includes('amzn.to')) {
        throw new Error('Please enter a valid Amazon URL');
      }

      // Check for short link expansion
      if (targetUrl.includes('amzn.to')) {
        try {
          const res = await fetch('/api/expand', {
            method: 'POST',
            body: JSON.stringify({ url: targetUrl }),
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await res.json();
          if (data.fullUrl) {
            targetUrl = data.fullUrl;
          } else {
            console.warn("Could not expand URL, trying raw parsing");
          }
        } catch (e) {
          console.warn("Expansion API failed", e);
        }
      }

      // seek ASIN - Very Permissive Regex
      // Looks for 10-char alphanumeric sequence, usually starting with B, preceded by slash or equal sign
      const asinMatch = targetUrl.match(/(?:\/|=)([A-Z0-9]{10})(?:$|\/|\?|&|%)/i);
      const asin = asinMatch ? asinMatch[1].toUpperCase() : null;

      // seek Tag
      const tagMatch = targetUrl.match(/[?&]tag=([^&]+)/);
      const tag = tagMatch ? tagMatch[1] : null;

      // seek Domain (amazon.com, amazon.fr, etc)
      const domainMatch = targetUrl.match(/amazon\.([a-z\.]+)/);
      const domain = domainMatch ? domainMatch[1] : 'com';

      if (!asin) {
        throw new Error(`Could not find product ASIN in URL: "${targetUrl}". Try expanding generic short links first.`);
      }

      // Call Shortener API instead of local construction
      const shortenRes = await fetch('/api/shorten', {
        method: 'POST',
        body: JSON.stringify({
          asin,
          domain,
          tag: tag || undefined,
          title: inputTitle,
          slug: inputSlug.trim() || undefined // Only send if not empty
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (shortenRes.status === 401) {
        window.location.href = '/sign-in';
        return;
      }

      const shortenData = await shortenRes.json();

      if (!shortenRes.ok) {
        throw new Error(shortenData.error || 'Failed to generate short link');
      }

      const newLink = shortenData.shortUrl;
      setGeneratedLink(newLink);

      // Add to History
      // The server already saved it (to enforce limits/counting). We just need to update UI.
      if (shortenData.link) {
        setHistory(prev => [shortenData.link, ...prev]);
      } else {
        // Fallback if server didn't return link object (shouldn't happen with new API)
        const newEntry: ArchivedLink = {
          id: Math.random().toString(36).substr(2, 9),
          original: inputUrl,
          generated: newLink,
          asin: asin,
          title: inputTitle || 'Untitled Product',
          description: inputDesc || 'No location specified',
          date: Date.now()
        };
        setHistory(prev => [newEntry, ...prev]);
      }

      // REMOVED: Redundant fetch('/api/links') which caused DUPLICATES.
      // Server is now Single Source of Truth.

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Link copied!');
  };


  return (
    <main className="flex min-h-screen flex-col items-center py-12 p-6 bg-background text-foreground transition-colors duration-300">

      {/* Authentication & Navigation */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
        {/* Admin Access is now Stealth Mode (Direct URL only) */}
        <SignedOut>
          <Link
            href="/sign-in"
            className="text-sm font-medium hover:underline text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-4 mr-4">
            {/* User Links */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              title="My Links"
            >
              <BarChart3 className="w-4 h-4" />
              <span>My Links</span>
            </Link>
            {/* Explicit Sign Out Text */}
            <div className="hidden md:block">
              <SignOutButton>
                <button className="text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors">
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>

      <div className="matte-card p-8 md:p-12 w-full max-w-xl animate-fade shadow-xl">
        <div className="mb-10 flex flex-col items-center justify-center">
          <div className="relative w-48 h-24 mb-8">
            {/* Dynamic Logo Strategy: Single White Logo with CSS Inversion Filter */}
            <Image
              src="/logo.png"
              alt="DeepLinkrs Logo"
              width={192}
              height={96}
              className="object-contain transition-all duration-300"
              style={{ filter: 'var(--logo-filter)' }}
              priority
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Amazon Affiliate Deep Linking Tool
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground ml-1 mb-1 block">Product Title</label>
              <input
                type="text"
                placeholder="e.g. Sony Headphones"
                className="input-minimal"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground ml-1 mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Instagram"
                  className="input-minimal"
                  value={inputDesc}
                  onChange={(e) => setInputDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground ml-1 mb-1 block">Custom Alias (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. headphone-deal"
                  className="input-minimal"
                  value={inputSlug}
                  onChange={(e) => setInputSlug(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground ml-1 mb-1 block">Amazon Link</label>
              <input
                type="text"
                placeholder="Paste Amazon Product Link..."
                className="input-minimal"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={generateLink}
            disabled={loading || !inputUrl}
            className="btn-primary w-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            {loading ? 'Processing...' : 'Generate Deep Link'}
          </button>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center">
              {error}
            </div>
          )}

          {generatedLink && (
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">Latest Generated Link</p>
              <div className="flex items-center gap-3 bg-secondary/50 border border-border p-2 pr-2 rounded-lg">
                <code className="text-foreground text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1 px-2 font-mono">
                  {generatedLink}
                </code>
                <button
                  onClick={() => copyLink(generatedLink)}
                  className="bg-background hover:bg-muted text-foreground transition-colors p-2 rounded-md border border-border shadow-sm"
                  title="Copy"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2-2v1"></path></svg>
                </button>
              </div>

            </div>
          )}

          <div className="mt-8 space-y-3 pt-6 border-t border-border">
            <SignedOut>
              <Link
                href="/sign-in"
                className="w-full bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                View My Links
              </Link>
              <Link
                href="/sign-in"
                className="w-full bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                View Analytics Dashboard
              </Link>
            </SignedOut>

            <SignedIn>
              <Link
                href="/history"
                className="w-full bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                View My Links
              </Link>

              <Link
                href="/dashboard"
                className="w-full bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                View Analytics Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>

        {!isPro && (
          <div className="mt-16 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-up">

            {/* FREE TIER CARD */}
            <div className="matte-card p-8 border-t-4 border-t-muted-foreground/30 flex flex-col relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-3 opacity-5">
                <LinkIcon className="w-24 h-24" />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider mb-2">Free Starter</h3>
              <div className="text-4xl font-extrabold mb-6">$0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-green-500" /> 20 Deep Links / Month
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-green-500" /> 200 Clicks / Month
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-green-500" /> Basic App Opening
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-green-500" /> Link History
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground/50">
                  <span className="w-5 h-5 flex items-center justify-center font-bold text-xs">✕</span> No Detailed Analytics
                </li>
              </ul>

              <Link href="/sign-up" className="w-full btn-primary bg-secondary text-foreground hover:bg-secondary/80 border border-border mt-auto">
                Get Started Free
              </Link>
            </div>

            {/* PRO TIER CARD */}
            <div className="matte-card p-8 border-t-4 border-t-yellow-500 flex flex-col relative shadow-2xl shadow-yellow-500/10 h-full">
              <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                RECOMMENDED
              </div>
              <div className="absolute top-10 right-0 p-3 opacity-10">
                <Activity className="w-24 h-24 text-yellow-500" />
              </div>

              <h3 className="text-xl font-bold uppercase tracking-wider mb-2 text-yellow-500">Pro Power</h3>
              <div className="text-4xl font-extrabold mb-6">$9.99<span className="text-lg text-muted-foreground font-normal">/mo</span></div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm font-medium">
                  <div className="bg-green-500/20 p-1 rounded-full"><Check className="w-3 h-3 text-green-500" /></div>
                  <strong>Unlimited</strong> Links
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <div className="bg-green-500/20 p-1 rounded-full"><Check className="w-3 h-3 text-green-500" /></div>
                  <strong>Unlimited</strong> Clicks
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <div className="bg-green-500/20 p-1 rounded-full"><Check className="w-3 h-3 text-green-500" /></div>
                  Smart iOS/Android Redirects
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <div className="bg-green-500/20 p-1 rounded-full"><Check className="w-3 h-3 text-green-500" /></div>
                  Full <strong>Analytics & Devices</strong>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <div className="bg-green-500/20 p-1 rounded-full"><Check className="w-3 h-3 text-green-500" /></div>
                  Priority Support
                </li>
              </ul>

              <Link href="/sign-up" className="w-full btn-primary bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-lg hover:shadow-yellow-500/20 mt-auto">
                Upgrade to Pro
              </Link>
            </div>

          </div>
        )}

        <div className="mt-12 text-center space-y-4">
          <a
            href="https://www.p34k.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Visit P34K"
          >
            <div className="relative w-24 h-8 mx-auto">
              <Image
                src="/p34k-logo.png"
                alt="P34K"
                fill
                className="object-contain brightness-0 dark:invert"
              />
            </div>
          </a>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setReportOpen(true)}
              className="text-xs text-muted-foreground/60 hover:text-red-400 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Report a Bug
            </button>
            <a
              href="mailto:info@p34k.com"
              className="text-xs text-muted-foreground/60 hover:text-primary transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
              Contact
            </a>
          </div>
        </div>
      </div>

      {/* BUG REPORT MODAL */}
      {reportOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade">
          <div className="matte-card p-6 w-full max-w-md border border-red-500/20 bg-black">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
              <span className="text-red-500">⚠</span> Report an Issue
            </h3>
            <textarea
              className="w-full h-32 bg-secondary/50 border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-primary mb-4"
              placeholder="Describe what happened..."
              value={reportMessage}
              onChange={(e) => setReportMessage(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReportOpen(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={sendingReport || !reportMessage.trim()}
                className="px-4 py-2 text-sm bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {sendingReport ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </div>
        </div>
      )}

    </main >
  );
}
