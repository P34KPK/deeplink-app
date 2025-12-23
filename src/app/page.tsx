'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type ArchivedLink = {
  id: string;
  original: string;
  generated: string;
  asin: string;
  date: number;
};

export default function Home() {
  const [inputUrl, setInputUrl] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<ArchivedLink[]>([]);
  const [viewHistory, setViewHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('deeplink_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history helper
  const saveHistory = (newHistory: ArchivedLink[]) => {
    setHistory(newHistory);
    localStorage.setItem('deeplink_history', JSON.stringify(newHistory));
  };

  const deleteLink = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    saveHistory(newHistory);
  };

  const generateLink = async () => {
    setError('');
    setGeneratedLink('');
    setLoading(true);

    try {
      if (!inputUrl.includes('amazon') && !inputUrl.includes('amzn.to')) {
        throw new Error('Please enter a valid Amazon URL');
      }

      const asinMatch = inputUrl.match(/(?:dp|o|gp\/product)\/([A-Z0-9]{10})/);
      const asin = asinMatch ? asinMatch[1] : null;

      const tagMatch = inputUrl.match(/[?&]tag=([^&]+)/);
      const tag = tagMatch ? tagMatch[1] : null;

      const domainMatch = inputUrl.match(/amazon\.([a-z\.]+)/);
      const domain = domainMatch ? domainMatch[1] : 'com';

      if (!asin) {
        throw new Error('Could not find product ASIN in the URL.');
      }

      const baseUrl = window.location.origin;
      const cleanTag = tag || '';

      const newLink = `${baseUrl}/go?asin=${asin}&domain=${domain}${cleanTag ? `&tag=${cleanTag}` : ''}`;

      setGeneratedLink(newLink);

      // Add to History
      const newEntry: ArchivedLink = {
        id: Math.random().toString(36).substr(2, 9),
        original: inputUrl,
        generated: newLink,
        asin: asin,
        date: Date.now()
      };

      const newHistory = [newEntry, ...history];
      saveHistory(newHistory);

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
    <main className="flex min-h-screen flex-col items-center py-12 p-6 bg-[#050505] text-white">
      <div className="matte-card p-8 md:p-12 w-full max-w-xl animate-fade">
        <div className="mb-10 flex flex-col items-center justify-center">
          <div className="relative w-48 h-24 mb-4">
            <Image
              src="/logo.png"
              alt="DeepLinker Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-sm text-gray-500">
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
            {loading ? 'Processing...' : 'Generate Deep Link'}
          </button>

          {error && (
            <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {generatedLink && (
            <div className="mt-8 pt-8 border-t border-[#222]">
              <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Latest Generated Link</p>
              <div className="flex items-center gap-3 bg-black border border-[#222] p-2 pr-2 rounded-lg">
                <code className="text-gray-300 text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1 px-2">
                  {generatedLink}
                </code>
                <button
                  onClick={() => copyLink(generatedLink)}
                  className="bg-[#222] hover:bg-[#333] text-white transition-colors p-2 rounded-md"
                  title="Copy"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      {history.length > 0 && (
        <div className="w-full max-w-xl mt-12 animate-fade" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg font-medium text-gray-400">History ({history.length})</h2>
            <button onClick={() => setViewHistory(!viewHistory)} className="text-xs text-gray-600 hover:text-gray-400">
              {viewHistory ? 'Hide' : 'Show'}
            </button>
          </div>

          {viewHistory && (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="matte-card p-4 flex items-center justify-between gap-4 group hover:border-[#333] transition-colors">
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500 bg-[#111] px-1 rounded border border-[#222]">{item.asin}</span>
                      <span className="text-xs text-gray-600">{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-300 truncate font-mono">{item.generated}</div>
                  </div>

                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyLink(item.generated)}
                      className="p-2 text-gray-400 hover:text-white bg-[#111] hover:bg-[#222] rounded-md border border-[#222]"
                      title="Copy Link"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <button
                      onClick={() => deleteLink(item.id)}
                      className="p-2 text-red-900 hover:text-red-500 bg-[#111] hover:bg-[#222] rounded-md border border-[#222]"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
