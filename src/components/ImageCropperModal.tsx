'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check, Move } from 'lucide-react';

interface ImageCropperModalProps {
    isOpen: boolean;
    imageSrc: string | null;
    onClose: () => void;
    onSave: (croppedImage: string) => void;
}

export default function ImageCropperModal({ isOpen, imageSrc, onClose, onSave }: ImageCropperModalProps) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imgState, setImgState] = useState<{ aspect: number } | null>(null);

    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setImgState(null);
        }
    }, [isOpen, imageSrc]);



    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        const touch = e.touches[0];
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y
        });
    };

    // Ensure state is captured if image loads instantly
    useEffect(() => {
        if (imageRef.current && imageRef.current.complete) {
            const { naturalWidth, naturalHeight } = imageRef.current;
            if (naturalWidth > 0) {
                setImgState({ aspect: naturalWidth / naturalHeight });
            }
        }
    }, [imageSrc]);

    const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setImgState({
            aspect: naturalWidth / naturalHeight
        });
    };

    const handleSave = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;
        if (!ctx || !img) return;

        // Fallback for aspect
        const currentAspect = imgState?.aspect || (img.naturalWidth / img.naturalHeight) || 1;

        // Output size
        const size = 400;
        const containerSize = 256;

        canvas.width = size;
        canvas.height = size;

        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);

        // Center context
        ctx.translate(size / 2, size / 2);

        // Apply Zoom & Pan
        // Scale Factor maps visual pixels (256) to output pixels (400)
        const outputRatio = size / containerSize;

        ctx.scale(zoom, zoom);
        ctx.translate(position.x * outputRatio, position.y * outputRatio);

        // Determine Base Draw Dimensions (Visual Size scaled to Output)
        let renderW, renderH;

        // Logic must match CSS styles exactly
        if (currentAspect > 1) {
            // Landscape: Height is constrained to containerSize (100%)
            renderH = containerSize;
            renderW = containerSize * currentAspect;
        } else {
            // Portrait: Width is constrained to containerSize (100%)
            renderW = containerSize;
            renderH = containerSize / currentAspect;
        }

        // Draw scaled
        const drawW = renderW * outputRatio;
        const drawH = renderH * outputRatio;

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        // Optimize: WebP at 80% quality
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        onSave(dataUrl);
        onClose();
    };

    if (!isOpen || !imageSrc) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="font-bold text-white">Adjust Photo</h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-8 flex flex-col items-center justify-center bg-black/50 relative select-none">
                    <p className="absolute top-2 text-[10px] text-zinc-500 font-medium">DRAG TO MOVE</p>

                    {/* Viewport Mask */}
                    <div
                        ref={containerRef}
                        className="w-64 h-64 rounded-full border-4 border-pink-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-10 overflow-hidden relative cursor-move touch-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                    >
                        {/* 
                           Use CSS to force "Cover" logic based on aspect ratio.
                           This ensures the image is constrained to the viewport size initially.
                        */}
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            onLoad={onImgLoad}
                            alt="Crop Target"
                            draggable={false}
                            className="absolute max-w-none origin-center pointer-events-none"
                            style={{
                                left: '50%',
                                top: '50%',
                                // If loaded, apply fitting logic. If not, hidden or default.
                                width: imgState ? (imgState.aspect < 1 ? '100%' : 'auto') : 'auto',
                                height: imgState ? (imgState.aspect >= 1 ? '100%' : 'auto') : 'auto',
                                minWidth: '0',
                                minHeight: '0',
                                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                            }}
                        />
                    </div>
                </div>

                <div className="p-4 space-y-4 bg-zinc-900 z-20">
                    <div className="flex items-center gap-4">
                        <ZoomOut className="w-4 h-4 text-zinc-400" />
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                        <ZoomIn className="w-4 h-4 text-zinc-400" />
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 py-3 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="flex-1 py-3 text-xs font-bold bg-pink-600 hover:bg-pink-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <Check className="w-4 h-4" />
                            Use Photo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
