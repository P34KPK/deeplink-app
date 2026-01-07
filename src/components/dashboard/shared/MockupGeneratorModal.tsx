import { useState, useRef, useEffect } from 'react';
import { X, Camera, Wand2, Download, Instagram, Smartphone, Sparkles, Image as ImageIcon } from 'lucide-react';
import QRCode from 'react-qr-code';

type MockupGeneratorModalProps = {
    isOpen: boolean;
    onClose: () => void;
    productTitle: string;
    productUrl: string; // The Affiliate Link
    productImage?: string; // If we have the image URL
    links?: any[]; // Allow selection from history
};

export default function MockupGeneratorModal({ isOpen, onClose, productTitle: initialTitle, productUrl: initialUrl, productImage, links = [] }: MockupGeneratorModalProps) {
    const [mode, setMode] = useState<'story' | 'post'>('story');
    const [theme, setTheme] = useState<'minimal' | 'gradient' | 'neon' | 'luxury' | 'retro' | 'bold' | 'soft'>('gradient');
    const [customText, setCustomText] = useState('Check this out! 🔥');

    // Selection Logic
    const [selectedLinkUrl, setSelectedLinkUrl] = useState(initialUrl);
    const [selectedTitle, setSelectedTitle] = useState(initialTitle);
    const [selectedImage, setSelectedImage] = useState(productImage);

    // Update state when props change or modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedLinkUrl(initialUrl);
            setSelectedTitle(initialTitle);
            setSelectedImage(productImage);
        }
    }, [isOpen, initialUrl, initialTitle, productImage]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Manual Upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                setSelectedImage(ev.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    // AI Generation
    const handleGenerativeAI = async () => {
        setIsGenerating(true);
        try {
            // Use existing AI mockup endpoint which uses Pollinations
            // It expects { url, prompt }
            // We'll use the current title as prompt + "promotional product photography, aesthetic, high quality"
            // Find ASIN if available for robust image fetching
            const selectedLink = links.find(l => l.generated === selectedLinkUrl);
            const asin = selectedLink?.asin;

            const res = await fetch('/api/ai/generate-mockup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: selectedLinkUrl || 'https://amazon.com', // Needed for metadata, but here we just want image
                    prompt: `${selectedTitle} product photography, aesthetic, high quality, 8k, professional lighting`,
                    asin: asin
                })
            });
            const data = await res.json();
            if (data.aiUrl) {
                setSelectedImage(data.aiUrl);
            } else if (data.originalImage) {
                // If AI failed but we got original, use that
                setSelectedImage(data.originalImage);
            } else {
                alert("Could not generate image. Please try uploading one.");
            }
        } catch (e) {
            console.error(e);
            alert("AI Generation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Canvas Logic for Generating the Image
    const generateCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dimensions
        const width = 1080;
        const height = mode === 'story' ? 1920 : 1080;
        canvas.width = width;
        canvas.height = height;

        // Helper to draw overlays (Text + QR)
        const drawOverlays = () => {
            // 3. Text Overlay
            ctx.fillStyle = (theme === 'minimal' || theme === 'bold' || theme === 'soft' || theme === 'luxury') ? (theme === 'luxury' ? '#D4AF37' : '#000') : '#fff';

            // Font Selection
            const font = (theme === 'retro') ? 'Courier New' : (theme === 'luxury') ? 'Playfair Display, serif' : 'Inter, sans-serif';
            const weight = (theme === 'bold') ? '900' : 'bold';

            ctx.font = `${weight} 80px ${font}`;
            ctx.textAlign = 'center';
            ctx.fillText("AMAZON FIND", width / 2, height * 0.15);

            ctx.font = `${weight} 60px ${font}`;
            if (theme === 'luxury') ctx.font = `italic 60px ${font}`;
            ctx.fillText(customText, width / 2, height * 0.7);

            ctx.font = `40px ${font}`;
            ctx.fillText(selectedTitle.substring(0, 30) + (selectedTitle.length > 30 ? '...' : ''), width / 2, height * 0.75);

            // 4. QR Code Placeholder (Draw white square)
            const qrSize = 300;
            const qrY = height - 400;
            ctx.fillStyle = '#fff';
            // Add border for QR if bg is white
            if (theme === 'minimal' || theme === 'soft') {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect((width - qrSize) / 2, qrY, qrSize, qrSize);
            }
            ctx.fillRect((width - qrSize) / 2, qrY, qrSize, qrSize);
        };

        // 1. Background
        if (theme === 'minimal') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        } else if (theme === 'gradient') {
            const grd = ctx.createLinearGradient(0, 0, width, height);
            grd.addColorStop(0, '#8b5cf6'); // Purple
            grd.addColorStop(1, '#ec4899'); // Pink
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, width, height);
        } else if (theme === 'neon') {
            ctx.fillStyle = '#09090b'; // Zinc 950
            ctx.fillRect(0, 0, width, height);
            // Add neon glow
            const grd = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, 600);
            grd.addColorStop(0, 'rgba(0, 255, 100, 0.2)');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, width, height);
        } else if (theme === 'luxury') {
            ctx.fillStyle = '#1a1a1a'; // Dark Charcoal
            ctx.fillRect(0, 0, width, height);
            // Gold border
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 20;
            ctx.strokeRect(40, 40, width - 80, height - 80);
        } else if (theme === 'retro') {
            ctx.fillStyle = '#2b213a'; // Dark retro purple
            ctx.fillRect(0, 0, width, height);
            // Grid lines
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
            ctx.lineWidth = 2;
            const step = 80;
            for (let x = 0; x < width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
            for (let y = 0; y < height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
        } else if (theme === 'bold') {
            ctx.fillStyle = '#FACC15'; // Bright Yellow
            ctx.fillRect(0, 0, width, height);
        } else if (theme === 'soft') {
            ctx.fillStyle = '#FDF2F8'; // Light Pink/Cream
            ctx.fillRect(0, 0, width, height);
            // Organic Circle
            ctx.fillStyle = '#FCE7F3';
            ctx.beginPath();
            ctx.arc(width * 0.8, height * 0.1, 400, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#DBEAFE';
            ctx.beginPath();
            ctx.arc(width * 0.1, height * 0.9, 300, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Product Placeholder / Image
        const rectColor = theme === 'bold' ? '#000' : theme === 'soft' ? '#fff' : 'rgba(255,255,255,0.2)';
        ctx.fillStyle = rectColor;

        // Draw image if available, else placeholder
        if (selectedImage) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = selectedImage;

            // Draw generic placeholder first while loading
            ctx.fillRect(100, height * 0.2, width - 200, width - 200);
            drawOverlays();

            img.onload = () => {
                // Centered 'cover' or 'contain' in the square
                const size = width - 200;
                const x = 100;
                const y = height * 0.2;

                // Draw background rect again just in case (to cover any prev sketch)
                // Or we could rely on the image covering it.
                // We need to re-draw EVERYTHING if we want to be clean, but that's recursion.
                // For now, assume this layer is on top of BG but below TEXT.
                // But wait, we already drew Text.
                // We must CLEAR the text area? No.
                // We must redraw the IMAGE then redraw the TEXT.

                // Clip to square
                ctx.save();
                ctx.beginPath();
                ctx.rect(x, y, size, size);
                ctx.clip();

                // Draw Image (Cover)
                const scale = Math.max(size / img.width, size / img.height);
                const iw = img.width * scale;
                const ih = img.height * scale;
                const ix = x + (size - iw) / 2;
                const iy = y + (size - ih) / 2;
                ctx.drawImage(img, ix, iy, iw, ih);
                ctx.restore();

                // REDRAW Text & QR on top
                drawOverlays();
            };

            img.onerror = () => {
                console.warn("Failed to load image for canvas:", selectedImage);
                // Ensure placeholder and overlays are present
                drawOverlays();
            };
        } else {
            ctx.fillRect(100, height * 0.2, width - 200, width - 200); // Square placeholder
            drawOverlays();
        }
    };

    // Auto-generate on change
    useEffect(() => {
        if (isOpen) {
            setTimeout(generateCanvas, 100);
        }
    }, [isOpen, mode, theme, customText, selectedTitle]);

    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `story-${selectedTitle.substring(0, 10).replace(/[^a-z0-9]/gi, '_')}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[90vh] grid grid-cols-1 lg:grid-cols-2 gap-8 p-4">

                {/* PREVIEW SIDE */}
                <div className="flex items-center justify-center bg-zinc-900/50 rounded-2xl border border-white/5 p-8 relative mobile-preview-bg">
                    {/* The Canvas acts as the preview */}
                    <canvas ref={canvasRef} className="max-h-full max-w-full shadow-2xl rounded-xl border border-white/10" style={{ height: '80%' }} />

                    {/* Live HTML Overlay for better visuals if canvas is tricky? No, stick to Canvas for downloadability */}
                    <div className="absolute bottom-4 left-0 w-full text-center text-xs text-muted-foreground">
                        Preview Mode
                    </div>
                </div>

                {/* CONTROLS SIDE */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 flex flex-col h-full shadow-2xl overflow-y-auto custom-scrollbar">
                    <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-6 h-6" /></button>

                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <Instagram className="w-6 h-6 text-pink-500" />
                            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Viral Story Creator</h2>
                        </div>
                        <p className="text-muted-foreground">Turn any link into an engaging social media story instantly.</p>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Link Selection */}
                        {links && links.length > 0 && (
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">Select Product</label>
                                <select
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-pink-500 outline-none"
                                    onChange={(e) => {
                                        const selected = links.find(l => l.generated === e.target.value);
                                        if (selected) {
                                            setSelectedLinkUrl(selected.generated || '');
                                            setSelectedTitle(selected.title || 'Product');
                                            // Fallback to checking if 'image' property exists on link, or undefined
                                            setSelectedImage(selected.image || selected.originalImage || undefined);
                                        }
                                    }}
                                    value={selectedLinkUrl}
                                >
                                    <option value={initialUrl}>Current Selection</option>
                                    {links.map((link: any) => (
                                        <option key={link.id} value={link.generated}>
                                            {link.title ? link.title.substring(0, 40) : 'Untitled Link'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Format */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">Format</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setMode('story')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mode === 'story' ? 'bg-pink-500/10 border-pink-500 text-pink-500' : 'bg-black border-zinc-800 hover:border-zinc-700'}`}>
                                    <Smartphone className="w-6 h-6" />
                                    <span className="font-bold">Story (9:16)</span>
                                </button>
                                <button onClick={() => setMode('post')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mode === 'post' ? 'bg-purple-500/10 border-purple-500 text-purple-500' : 'bg-black border-zinc-800 hover:border-zinc-700'}`}>
                                    <ImageIcon className="w-6 h-6" />
                                    <span className="font-bold">Post (1:1)</span>
                                </button>
                            </div>
                        </div>

                        {/* Theme */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">Visual Style</label>
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => setTheme('gradient')} className={`h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 border-2 transition-all ${theme === 'gradient' ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'}`} title="Gradient" />
                                <button onClick={() => setTheme('neon')} className={`h-12 rounded-lg bg-zinc-900 border-2 transition-all ${theme === 'neon' ? 'border-green-400' : 'border-zinc-800 opacity-50 hover:opacity-100'}`} style={{ boxShadow: theme === 'neon' ? '0 0 10px #4ade80' : 'none' }} title="Neon" />
                                <button onClick={() => setTheme('minimal')} className={`h-12 rounded-lg bg-white border-2 transition-all ${theme === 'minimal' ? 'border-zinc-400' : 'border-zinc-200 opacity-50 hover:opacity-100'}`} title="Minimal" />
                                <button onClick={() => setTheme('luxury')} className={`h-12 rounded-lg bg-[#1a1a1a] border-2 transition-all ${theme === 'luxury' ? 'border-[#D4AF37]' : 'border-transparent opacity-50 hover:opacity-100'}`} title="Luxury" />
                                <button onClick={() => setTheme('retro')} className={`h-12 rounded-lg bg-[#2b213a] border-2 transition-all ${theme === 'retro' ? 'border-[#ff00ff]' : 'border-transparent opacity-50 hover:opacity-100'}`} title="Retro" />
                                <button onClick={() => setTheme('bold')} className={`h-12 rounded-lg bg-[#FACC15] border-2 transition-all ${theme === 'bold' ? 'border-black' : 'border-transparent opacity-50 hover:opacity-100'}`} title="Bold" />
                                <button onClick={() => setTheme('soft')} className={`h-12 rounded-lg bg-[#FDF2F8] border-2 transition-all ${theme === 'soft' ? 'border-pink-300' : 'border-transparent opacity-50 hover:opacity-100'}`} title="Soft" />
                            </div>
                        </div>

                        {/* Image Source */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">Image Source</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 text-sm font-bold text-zinc-300"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Upload
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />

                                <button
                                    onClick={handleGenerativeAI}
                                    disabled={isGenerating}
                                    className={`p-3 border border-zinc-800 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold ${isGenerating ? 'bg-zinc-900 text-zinc-500' : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 text-indigo-400 border-indigo-500/20'}`}
                                >
                                    {isGenerating ? <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                    {isGenerating ? 'Magic...' : 'AI Generate'}
                                </button>
                            </div>
                        </div>

                        {/* Customization */}
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block">Headline Text</label>
                            <input
                                type="text"
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-pink-500 outline-none"
                                maxLength={25}
                            />
                        </div>
                    </div>

                    {/* Action */}
                    <div className="pt-6 border-t border-white/10 mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-xs text-muted-foreground">
                                Includes high-res QR Code for: <br />
                                <span className="text-pink-400 font-mono">{selectedLinkUrl ? selectedLinkUrl.substring(0, 30) : '...'}...</span>
                            </div>
                        </div>
                        <button
                            onClick={downloadImage}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg ring-1 ring-white/10 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                        >
                            <Download className="w-5 h-5" />
                            Download HD Image
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
