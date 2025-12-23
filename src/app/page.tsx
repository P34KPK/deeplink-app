'use client';

import { useState } from 'react';

export default function Home() {
  const [inputUrl, setInputUrl] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateLink = async () => {
    setError('');
    setGeneratedLink('');
    setLoading(true);

    try {
      // Basic validation
      if (!inputUrl.includes('amazon') && !inputUrl.includes('amzn.to')) {
        throw new Error('Please enter a valid Amazon URL');
      }

      // If it's a short link, we might need to expand it (future feature), 
      // for now assume full link or client-side simple parse.

      // seek ASIN
      const asinMatch = inputUrl.match(/(?:dp|o|gp\/product)\/([A-Z0-9]{10})/);
      const asin = asinMatch ? asinMatch[1] : null;

      // seek Tag
      const tagMatch = inputUrl.match(/[?&]tag=([^&]+)/);
      const tag = tagMatch ? tagMatch[1] : null;

      // seek Domain (amazon.com, amazon.fr, etc)
      const domainMatch = inputUrl.match(/amazon\.([a-z\.]+)/);
      const domain = domainMatch ? domainMatch[1] : 'com';

      if (!asin) {
        // Attempt to find ASIN in other formats or just error if critical
        // Some links might be search results which don't have ASIN.
        throw new Error('Could not find product ASIN in the URL. Please use a direct product link.');
      }

      // Construct the local deep link
      // We will route to /go?asin=...&tag=...&domain=...
      const baseUrl = window.location.origin;
      const cleanTag = tag || ''; // If no tag, user might lose money, maybe warn? But proceed.

      const newLink = `${baseUrl}/go?asin=${asin}&domain=${domain}${cleanTag ? `&tag=${cleanTag}` : ''}`;

      setGeneratedLink(newLink);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('Link copied to clipboard!');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0f0f12] to-[#1a1a2e]">
      <div className="glass-card p-8 md:p-12 w-full max-w-2xl animate-entrance">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-teal-400 glow-text">
          DeepLinker
        </h1>
        <p className="text-gray-400 text-center mb-8 text-lg">
          Convert Amazon links into smart app-opening deep links.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-gray-400 ml-1">Paste your Affiliate Link</label>
            <input
              type="text"
              placeholder="https://www.amazon.com/dp/B08..."
              className="input-premium"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
          </div>

          <button
            onClick={generateLink}
            disabled={loading || !inputUrl}
            className="btn-primary w-full"
          >
            {loading ? 'Processing...' : 'Generate Deep Link'}
          </button>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-center animate-pulse">
              {error}
            </div>
          )}

          {generatedLink && (
            <div className="mt-8 p-6 glass rounded-2xl border border-teal-500/30">
              <p className="text-sm text-gray-400 mb-2">Your Deep Link:</p>
              <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/10">
                <code className="text-teal-400 text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                  {generatedLink}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="text-white hover:text-teal-400 transition-colors p-2"
                  title="Copy"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Share this link on Instagram, TikTok, or YouTube. It will open the Amazon App directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
