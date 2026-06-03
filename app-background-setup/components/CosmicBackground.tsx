'use client';

import React from 'react';
import { StarBackground } from './StarBackground';

export const CosmicBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            {/* Layer 1: Deep Space Base */}
            {/* Radial gradient from deep indigo/slate to pure black */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/50 via-slate-950 to-[#050a1f]"></div>

            {/* Layer 2: Stars */}
            <StarBackground starCount={150} />

            {/* Layer 3: Sacred Geometry (CSS Mandala) - Rotating Very Slowly */}
            {/* Center the mandala in the background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03] animate-spin-slow" style={{ animationDuration: '60s' }}>
                {/* Outer Circle */}
                <div className="absolute inset-0 border border-gold rounded-full"></div>
                {/* Inner Rotated Squares/Triangles simulation */}
                <div className="absolute inset-[10%] border border-gold rotate-45"></div>
                <div className="absolute inset-[20%] border border-gold rounded-full"></div>
                <div className="absolute inset-[30%] border border-gold rotate-12"></div>
                <div className="absolute inset-[30%] border border-gold -rotate-12"></div>
                <div className="absolute inset-[40%] border border-gold rounded-full"></div>
                <div className="absolute inset-[50%] border border-gold rotate-45"></div>
                {/* Center Point */}
                <div className="absolute inset-[48%] bg-saffron rounded-full blur-xl opacity-20"></div>
            </div>

            {/* Layer 4: Cosmic Smoke / Nebula */}
            {/* Soft blurred blobs floating in corners/edges */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-nebula-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px] animate-nebula-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-saffron/5 rounded-full blur-[80px] animate-pulse"></div>
        </div>
    );
};
