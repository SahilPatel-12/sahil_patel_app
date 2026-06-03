
"use client";

import React, { useEffect, useState } from "react";

interface EmberParticlesProps {
    count?: number;
    color?: string;
    className?: string;
}

const EmberParticles: React.FC<EmberParticlesProps> = ({
    count = 15,
    color = "bg-orange-500",
    className = ""
}) => {
    // Generate static random values for hydration consistency
    const [particles, setParticles] = useState<Array<{
        id: number;
        left: string;
        delay: string;
        duration: string;
        size: string;
    }>>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${(i * 17) % 100}%`,
            delay: `${(i * 1.3) % 5}s`,
            duration: `${3 + ((i * 0.7) % 4)}s`,
            size: `${2 + (i % 4)}px`
        }));
        setParticles(newParticles);
    }, [count]);

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className={`absolute bottom-0 rounded-full ${color} animate-float-up opacity-0`}
                    style={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                        boxShadow: `0 0 ${parseInt(p.size) * 2}px currentColor`
                    }}
                />
            ))}
        </div>
    );
};

export default EmberParticles;
