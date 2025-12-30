'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

export default function Home() {
  const [inputUrl, setInputUrl] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [inputSlug, setInputSlug] = useState(''); // Custom Alias

  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ArchivedLink[]>([]);

  // Load history on mount
  useEffect(() => {
    fetch('/api/links')
      .then(res => res.json())
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
  }, []);

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

      // seek ASIN
      const asinMatch = targetUrl.match(/(?:dp|o|gp\/product)\/([A-Z0-9]{10})/);
      const asin = asinMatch ? asinMatch[1] : null;

      // seek Tag
      const tagMatch = targetUrl.match(/[?&]tag=([^&]+)/);
      const tag = tagMatch ? tagMatch[1] : null;

      // seek Domain (amazon.com, amazon.fr, etc)
      const domainMatch = targetUrl.match(/amazon\.([a-z\.]+)/);
      const domain = domainMatch ? domainMatch[1] : 'com';

      if (!asin) {
        throw new Error('Could not find product ASIN in the URL.');
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

      const shortenData = await shortenRes.json();

      if (!shortenRes.ok) {
        throw new Error(shortenData.error || 'Failed to generate short link');
      }

      const newLink = shortenData.shortUrl;
      setGeneratedLink(newLink);

      // Add to History (use full Short Link info)
      const newEntry: ArchivedLink = {
        id: Math.random().toString(36).substr(2, 9),
        original: inputUrl,
        generated: newLink,
        asin: asin,
        title: inputTitle || 'Untitled Product',
        description: inputDesc || 'No location specified',
        date: Date.now()
      };

      // Save to server
      const saveRes = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });

      if (saveRes.ok) {
        const updatedHistory = await saveRes.json();
        setHistory(updatedHistory);
      }

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
      <div className="matte-card p-8 md:p-12 w-full max-w-xl animate-fade shadow-xl">
        <div className="relative w-48 h-24 mb-4">
          <Image
            src="/logo.png"
            alt="DeepLinker Logo"
            width={192}
            height={96}
            className="object-contain invert dark:invert-0"
            priority
          />
        </div>
        <p className="text-sm text-muted-foreground">
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
        </div>
      </div>
    </div>
    </main >
  );
}
