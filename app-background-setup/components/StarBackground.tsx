'use client';

import React, { useEffect, useState } from 'react';

export const StarBackground = ({ starCount = 150 }: { starCount?: number }) => {
    const [stars, setStars] = useState<{ id: number; top: string; left: string; animationDuration: string; delay: string; size: string }[]>([]);
    const [shootingStars, setShootingStars] = useState<{ id: number; top: string; left: string; delay: string }[]>([]);

    useEffect(() => {
        const generateStars = () => {
            // Use prop instead of hardcoded value
            const newStars = Array.from({ length: starCount }).map((_, i) => ({
                id: i,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                delay: `${Math.random() * 5}s`,
                size: `${Math.random() * 2 + 1}px`
            }));
            setStars(newStars);

            const shootingStarCount = 5;
            const newShootingStars = Array.from({ length: shootingStarCount }).map((_, i) => ({
                id: i,
                top: `${Math.random() * 50}%`, // Start from top half
                left: `${Math.random() * 50 + 50}%`, // Start from right half usually
                delay: `${Math.random() * 10 + 2}s` // Random infrequent delays
            }));
            setShootingStars(newShootingStars);
        };

        generateStars();
    }, [starCount]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {stars.map((star) => (
                <div
                    key={star.id}
                    style={{
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        animationDuration: star.animationDuration,
                        animationDelay: star.delay,
                    }}
                    className={`absolute bg-white rounded-full opacity-60 ${star.id % 3 === 0 ? 'animate-twinkle' : star.id % 3 === 1 ? 'animate-float-up' : 'opacity-40'}`}
                ></div>
            ))}

            {/* Shooting Stars */}
            {shootingStars.map((star) => (
                <div
                    key={`shooting-${star.id}`}
                    style={{
                        top: star.top,
                        left: star.left,
                        animationDelay: star.delay,
                    }}
                    className="absolute w-[2px] h-[2px] bg-white rounded-full animate-shooting-star opacity-0 shadow-[0_0_10px_2px_rgba(255,255,255,0.8)] dark:shadow-[0_0_15px_3px_rgba(249,115,22,0.6)] before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-1/2 before:right-0 before:w-[100px] before:h-[1px] before:bg-gradient-to-r before:from-transparent before:to-white dark:before:to-orange-300"
                ></div>
            ))}
        </div>
    );
};
