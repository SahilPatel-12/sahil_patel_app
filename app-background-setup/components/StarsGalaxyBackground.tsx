"use client";

import { useEffect, useState } from "react";

export default function StarsGalaxyBackground({ forceVisible = false }: { forceVisible?: boolean }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

    }, []);

    if (!mounted) return null;

    return (
        <div className={`absolute inset-0 z-0 pointer-events-none ${forceVisible ? '' : 'hidden dark:block'} overflow-hidden`}>
            {/* Dark Mode Background Base */}
            <div className="absolute inset-0 bg-cosmic-navy"></div>

            {/* Noise Texture Layer (SVG Based to avoid 404) */}
            <div
                className="absolute inset-0 opacity-[0.3] mix-blend-overlay pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
            ></div>

            {/* Vertical Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-cosmic-navy via-transparent to-transparent"></div>

            {/* Stars */}
            <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
            <div className="absolute top-20 left-1/2 w-1 h-1 bg-white/70 rounded-full animate-twinkle delay-500"></div>
            <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-gold/50 rounded-full animate-twinkle delay-1000"></div>
            <div className="absolute bottom-40 left-20 w-1 h-1 bg-white rounded-full animate-twinkle delay-1500"></div>
            <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white/80 rounded-full animate-twinkle delay-700"></div>
            <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-white/60 rounded-full animate-twinkle delay-200"></div>

            {/* Nebula Glow */}
            <div className="absolute top-1/4 -right-20 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl animate-nebula-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl animate-nebula-pulse delay-2000"></div>
        </div>
    );
}
