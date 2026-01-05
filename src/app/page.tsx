'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Link as LinkIcon, Copy, Check, BarChart3, LayoutDashboard, Activity, Wand2, DollarSign, Image as ImageIcon, RefreshCw, Camera, Upload, ShoppingBag } from "lucide-react";
import { ThemeToggle } from '@/components/theme-toggle';
import OnboardingTour from '@/components/OnboardingTour';

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

  const [inputTitle, setInputTitle] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const [inputSlug, setInputSlug] = useState(''); // Custom Alias

  // PRO Image Options
  const [scrapedImage, setScrapedImage] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [aiMockupUrl, setAiMockupUrl] = useState('');
  const [aiMockupLoading, setAiMockupLoading] = useState(false);
  const [imageOption, setImageOption] = useState<'auto' | 'default' | 'custom' | 'ai'>('default');
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ArchivedLink[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [clicksUsed, setClicksUsed] = useState(0);

  // Bug Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [sendingReport, setSendingReport] = useState(false);

  const fetchMetadata = async () => {
    if (!inputUrl) return;
    setFetchingMetadata(true);
    try {
      const res = await fetch('/api/metadata', {
        method: 'POST',
        body: JSON.stringify({ url: inputUrl }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.image) {
        setScrapedImage(data.image);
        setImageOption('auto');
        if (data.title && !inputTitle) setInputTitle(data.title);
      } else {
        alert('Could not find an image on this page.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingMetadata(false);
    }
  };

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImageUrl(reader.result as string);
        setImageOption('custom');
      };
      reader.readAsDataURL(file);
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
        } else {
          // Free Plan - Set usage
          if (data.usage?.clicks) {
            setClicksUsed(data.usage.clicks);
          }
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

      let chosenImage = undefined;
      if (isPro) {
        if (imageOption === 'auto') chosenImage = scrapedImage || undefined;
        if (imageOption === 'custom') chosenImage = customImageUrl || undefined;
        if (imageOption === 'ai') chosenImage = aiMockupUrl || undefined;
      }

      // Call Shortener API instead of local construction
      const shortenRes = await fetch('/api/shorten', {
        method: 'POST',
        body: JSON.stringify({
          asin,
          domain,
          tag: tag || undefined,
          title: inputTitle,
          slug: inputSlug.trim() || undefined, // Only send if not empty
          image: chosenImage
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
      <OnboardingTour />
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
            {isPro && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                title="My Links"
              >
                <BarChart3 className="w-4 h-4" />
                <span>My Links</span>
              </Link>
            )}
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
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Amazon Product Link..."
                  className="input-minimal flex-1"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                />
                {isPro && (
                  <button
                    onClick={fetchMetadata}
                    disabled={fetchingMetadata || !inputUrl}
                    className="bg-secondary hover:bg-secondary/80 border border-border rounded-lg px-3 transition-colors disabled:opacity-50"
                    title="Fetch Preview Image"
                  >
                    <RefreshCw className={`w-4 h-4 ${fetchingMetadata ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* PRO IMAGE SELECTION */}
            {/* PRO IMAGE SELECTION - REDESIGNED */}
            {isPro && inputUrl.length > 0 && (
              <div className="mt-8 space-y-3 animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out fill-mode-forwards">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-3 h-3 text-purple-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Social Mockup Studio</span>
                  </div>
                  <span className="text-[9px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full shadow-lg shadow-purple-500/20">
                    PRO STUDIO
                  </span>
                </div>

                {/* MAIN STUDIO CARD */}
                <div className="relative w-full aspect-[1.91/1] bg-black/40 rounded-xl border border-white/10 overflow-hidden group shadow-2xl transition-all hover:border-white/20">

                  {/* PREVIEW AREA */}
                  {(imageOption === 'auto' && scrapedImage) || (imageOption === 'custom' && customImageUrl) || (imageOption === 'ai' && aiMockupUrl) ? (
                    <img
                      key={imageOption === 'auto' ? scrapedImage! : imageOption === 'custom' ? customImageUrl : aiMockupUrl}
                      src={imageOption === 'auto' ? scrapedImage! : imageOption === 'custom' ? customImageUrl : aiMockupUrl}
                      className="w-full h-full object-cover animate-in fade-in zoom-in-110 duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-3 bg-[url('/grid-pattern.svg')] animate-pulse">
                      <div className="p-4 rounded-full bg-white/5 backdrop-blur-sm border border-white/5">
                        <ImageIcon className="w-8 h-8 opacity-50" />
                      </div>
                      <span className="text-xs font-medium tracking-wide">Select a source below</span>
                    </div>
                  )}

                  {/* TOOLBAR OVERLAY */}
                  <div className="absolute bottom-4 left-4 right-4 p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg flex items-center gap-2 shadow-2xl">

                    {/* 1. AMAZON PRODUCT */}
                    <button
                      onClick={() => setImageOption('auto')}
                      disabled={!scrapedImage}
                      className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${imageOption === 'auto' ? 'bg-white text-black font-bold shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wide">Product</span>
                    </button>

                    {/* 2. UPLOAD */}
                    <button
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all ${imageOption === 'custom' ? 'bg-white text-black font-bold shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold tracking-wide">Upload</span>
                    </button>
                    <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} accept="image/*" />

                    <div className="w-px h-4 bg-white/20 mx-1"></div>

                    {/* 3. AI STUDIO */}
                    <button
                      onClick={() => setImageOption('ai')}
                      className={`flex-[1.2] py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all relative overflow-hidden ${imageOption === 'ai' ? 'text-white font-bold' : 'text-pink-400 hover:text-pink-300 hover:bg-pink-500/10'}`}
                    >
                      {imageOption === 'ai' && <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-100"></div>}
                      <div className="relative flex items-center gap-2">
                        <Wand2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase font-bold tracking-wide">AI Studio</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* AI EXPANDABLE PANEL */}
                {imageOption === 'ai' && (
                  <div className="animate-in slide-in-from-top-4 duration-300">
                    <div className="p-1 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/20">
                      <div className="bg-zinc-950/80 backdrop-blur rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] uppercase font-bold text-pink-400 flex items-center gap-1.5">
                            <Camera className="w-3 h-3" />
                            <span>Describe Your Scene</span>
                          </label>
                          <span className="text-[9px] text-zinc-500">✨ Powered by Generative AI</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="mockup-prompt-input"
                            placeholder="e.g. Luxury marble table with sunset lighting..."
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all placeholder:text-zinc-600"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const btn = document.getElementById('generate-btn');
                                if (btn) btn.click();
                              }
                            }}
                          />
                          <button
                            id="generate-btn"
                            onClick={async () => {
                              const promptInput = document.getElementById('mockup-prompt-input') as HTMLInputElement;
                              const prompt = promptInput.value;
                              if (!prompt) return alert("Please enter a scene description");
                              if (!scrapedImage) return alert("Please fetch the product image first (Paste Amazon Link above)");

                              setAiMockupLoading(true);
                              try {
                                const res = await fetch('/api/ai/generate-mockup', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ url: scrapedImage, prompt })
                                });
                                const data = await res.json();
                                if (data.aiUrl) {
                                  setAiMockupUrl(data.aiUrl);
                                } else {
                                  alert("Failed to generate. Try again.");
                                }
                              } catch (e) {
                                alert("Generation failed");
                              } finally {
                                setAiMockupLoading(false);
                              }
                            }}
                            disabled={aiMockupLoading}
                            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg px-4 flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20"
                          >
                            {aiMockupLoading ? <span className="animate-spin">⏳</span> : <Wand2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
              {!isPro && (
                <>
                  <Link
                    href="/history"
                    className="w-full bg-card hover:bg-accent border border-border text-muted-foreground hover:text-foreground py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    View My Links
                  </Link>
                  <div className="mt-3 text-center">
                    <span className="text-xs font-mono text-muted-foreground/80 bg-secondary/30 px-3 py-1 rounded-full border border-border/50">
                      {Math.max(0, 200 - clicksUsed)} clicks remaining
                    </span>
                  </div>
                </>
              )}
            </SignedIn>
          </div>
        </div>



        {/* --- HOW IT WORKS / BENEFITS / PRICING (Hidden for PRO users) --- */}
        {!isPro && (
          <>
            <div className="mt-16 w-full max-w-4xl text-center space-y-12 animate-fade-up">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="p-6 rounded-xl bg-secondary/20 border border-white/5 flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <Copy className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">1. Paste Link</h3>
                  <p className="text-sm text-muted-foreground">Copy any product link from Amazon and paste it above.</p>
                </div>
                <div className="p-6 rounded-xl bg-secondary/20 border border-white/5 flex flex-col items-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                    <Wand2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">2. Deep Link</h3>
                  <p className="text-sm text-muted-foreground">We instantly create a smart link that opens the App.</p>
                </div>
                <div className="p-6 rounded-xl bg-secondary/20 border border-white/5 flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">3. Earn More</h3>
                  <p className="text-sm text-muted-foreground">Triple your conversions by bypassing the browser login.</p>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-900/10 to-purple-900/10 border border-white/5">
                <h2 className="text-2xl font-bold mb-6">Why Influencers Love DeepLinkrs</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="font-bold text-3xl text-white mb-1">3x</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Conversion Rate</div>
                  </div>
                  <div>
                    <div className="font-bold text-3xl text-white mb-1">100%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">App Opening</div>
                  </div>
                  <div>
                    <div className="font-bold text-3xl text-white mb-1">24/7</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Uptime</div>
                  </div>
                  <div>
                    <div className="font-bold text-3xl text-white mb-1">Safe</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Amazon Compliant</div>
                  </div>
                </div>
              </div>

            </div>

            {/* PRICING TABLE - ALWAYS VISIBLE */}
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
                    Custom <strong>Link-in-Bio</strong> Page
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
          </>
        )}


        <div className="mt-12 text-center space-y-4">
          <a
            href="https://www.p34k.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-opacity"
            aria-label="Visit P34K"
          >
            <div className="relative w-24 h-8 mx-auto">
              <img
                src="/p34k-logo.png"
                alt="P34K"
                className="w-full h-full object-contain"
                style={{ filter: 'var(--logo-filter)' }}
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
      </div >

      {/* BUG REPORT MODAL */}
      {
        reportOpen && (
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
        )
      }

    </main >
  );
}
