import { useState } from 'react';
import { X, Camera, Wand2, Download } from 'lucide-react';

type MockupGeneratorModalProps = {
    isOpen: boolean;
    onClose: () => void;
    productTitle: string;
    productUrl: string; // We might need the URL to fetch the image in the API
};

export default function MockupGeneratorModal({ isOpen, onClose, productTitle, productUrl }: MockupGeneratorModalProps) {
    const [mockupResult, setMockupResult] = useState<string | null>(null);
    const [isMockupLoading, setIsMockupLoading] = useState(false);
    const [prompt, setPrompt] = useState('');

    const handleCreateMockup = async (customPrompt: string) => {
        setIsMockupLoading(true);
        setMockupResult(null);
        try {
            const res = await fetch('/api/ai/generate-mockup', {
                method: 'POST',
                body: JSON.stringify({ url: productUrl, prompt: customPrompt }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.aiUrl) {
                setMockupResult(data.aiUrl);
            } else {
                alert('Detailed generation failed. Try a simpler prompt.');
            }
        } catch (e) {
            console.error(e);
            alert('AI Service overloaded. Please try again later.');
        } finally {
            setIsMockupLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-lg p-6 relative shadow-2xl">
                <button
                    onClick={() => { onClose(); setMockupResult(null); }}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-6 text-pink-400">
                    <Camera className="w-6 h-6" />
                    <h2 className="text-xl font-bold text-white">AI Product Mockup_</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Product</label>
                        <p className="text-sm text-zinc-300 font-medium truncate">{productTitle}</p>
                    </div>

                    {!mockupResult && (
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Scene Description</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none h-24 resize-none"
                                placeholder="e.g. on a wooden table in a sunny garden, warm lighting..."
                            ></textarea>
                            <button
                                onClick={() => handleCreateMockup(prompt || "luxury aesthetic setting")}
                                disabled={isMockupLoading}
                                className="w-full mt-4 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                            >
                                {isMockupLoading ? <span className="animate-spin">⏳</span> : <Wand2 className="w-4 h-4" />}
                                {isMockupLoading ? 'Generating Scene...' : 'Generate Mockup'}
                            </button>
                        </div>
                    )}

                    {mockupResult && (
                        <div className="space-y-4 animate-in zoom-in-95 duration-300">
                            <div className="rounded-lg overflow-hidden border border-zinc-700 relative group min-h-[300px] bg-zinc-900 flex items-center justify-center">
                                <img
                                    src={mockupResult}
                                    alt="Mockup"
                                    className="w-full h-auto object-cover"
                                    onError={(e) => {
                                        // Fallback if image fails to load (pollinations timeout)
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        alert("The AI generated an image but it failed to load (Timeout). Please try again.");
                                        setMockupResult(null);
                                    }}
                                />
                                <a
                                    href={mockupResult}
                                    target="_blank"
                                    className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                >
                                    <Download className="w-3 h-3" /> Download
                                </a>
                            </div>
                            <button
                                onClick={() => setMockupResult(null)}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 rounded-lg text-sm transition-colors"
                            >
                                Try Another Prompt
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
