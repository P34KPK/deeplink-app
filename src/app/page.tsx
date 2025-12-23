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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#050505]">
      <div className="matte-card p-8 md:p-12 w-full max-w-xl animate-fade">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold mb-2 text-white">
            DeepLinker
          </h1>
          <p className="text-sm">
            Amazon Affiliate Deep Linking Tool
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Paste Amazon Product Link..."
              className="input-minimal"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
          </div>

          <button
            onClick={generateLink}
            disabled={loading || !inputUrl}
            className="btn-primary w-full"
          >
            {loading ? 'Processing...' : 'Generate Generate Link'}
          </button>

          {error && (
            <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {generatedLink && (
            <div className="mt-8 pt-8 border-t border-[#222]">
              <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Generated Link</p>
              <div className="flex items-center gap-3 bg-black border border-[#222] p-2 pr-2 rounded-lg">
                <code className="text-gray-300 text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1 px-2">
                  {generatedLink}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="bg-[#222] hover:bg-[#333] text-white transition-colors p-2 rounded-md"
                  title="Copy"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
