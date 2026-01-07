'use client';

import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';

export default function GlobeWidget({ className, markers = [] }: { className?: string, markers?: any[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let phi = 0;

        if (!canvasRef.current) return;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: 600 * 2,
            height: 600 * 2,
            phi: 0,
            theta: 0,
            dark: 1,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.3, 0.3, 0.3],
            markerColor: [0.1, 0.8, 1], // Cyan markers
            glowColor: [0.5, 0.5, 0.5], // Subtle glow
            markers: markers, // Real markers (empty by default)
            onRender: (state) => {
                // Called on every animation frame.
                // state.phi = phi
                state.phi = phi;
                phi += 0.003;
            },
        });

        return () => {
            globe.destroy();
        };
    }, []);

    return (
        <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
            <canvas
                ref={canvasRef}
                style={{ width: 600, height: 600, maxWidth: '100%', aspectRatio: 1 }}
                className="opacity-80 hover:opacity-100 transition-opacity duration-500"
            />
        </div>
    );
}
