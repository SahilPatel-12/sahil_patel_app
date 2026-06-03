'use client';
import StarsGalaxyBackground from './StarsGalaxyBackground';

const backgroundIcons = [
    "/zodiac/aquarius.png", "/zodiac/aries.png", "/zodiac/cancer.png", "/zodiac/capricorn.png",
    "/zodiac/leo.png", "/zodiac/libra.png", "/zodiac/pisces.png",
    "/zodiac/sagittarius.png", "/zodiac/scorpion.png", "/zodiac/taurus.png", "/zodiac/virgo.png",
    "/bhagwan/brahma.png", "/bhagwan/durga.png", "/bhagwan/ganesha.png", "/bhagwan/hanuman.png",
    "/bhagwan/krishna.png", "/bhagwan/lakshmi.png", "/bhagwan/rama.png", "/bhagwan/shiv.png",
    "/bhagwan/shiva.png", "/bhagwan/surya.png", "/bhagwan/vishnu.png",
    "/astrology/astrology.png", "/astrology/chiromancy.png", "/astrology/constellation.png",
    "/astrology/crystal-ball.png", "/astrology/fortune-wheel.png", "/astrology/galaxy.png",
    "/astrology/horoscope.png", "/astrology/stars.png", "/astrology/tarot.png",
    "/diya.png", "/havan.png", "/kalasha.png", "/moon.png", "/sun.png", "/premium-loader.png", "/temple.png"
];

const getIconName = (path: string): string => {
    const filename = path.split('/').pop() || '';
    return filename.replace('.png', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Vedic Symbol';
};

export default function EnhancedBackground() {
    return (
        <>
            {/* Stars & Galaxy Background for Dark Mode */}
            <StarsGalaxyBackground />

            {/* Vedic Cosmic Background Layers */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
                {/* Layer 1: Base Cosmic Blobs */}
                <div className="absolute top-10 left-10 w-64 h-64 dark:bg-saffron-900/10 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 dark:bg-gold-900/10 rounded-full blur-3xl opacity-60"></div>

                {/* Layer 2: Planetary Systems - Hidden on Mobile */}
                <div className="hidden md:block">
                    {/* System 1 (Top-Left) */}
                    <div className="absolute top-[10%] left-[5%] scale-[0.8] animate-drift-1" style={{ animationDuration: '60s' }}>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 animate-pulse shadow-[0_0_40px_rgba(251,146,60,0.6)]"></div>
                            {[
                                { r: 40, d: '8s', s: 'w-2 h-2', c: 'bg-stone-400' },
                                { r: 60, d: '12s', s: 'w-3 h-3', c: 'bg-orange-400' },
                                { r: 80, d: '15s', s: 'w-3 h-3', c: 'bg-blue-400' },
                                { r: 100, d: '20s', s: 'w-2.5 h-2.5', c: 'bg-red-400' },
                                { r: 140, d: '30s', s: 'w-8 h-8', c: 'bg-orange-200' },
                            ].map((orbit, i) => (
                                <div key={i} className="absolute rounded-full border border-dashed border-gray-400/60 dark:border-gray-600 animate-spin-slow"
                                    style={{ width: orbit.r * 2, height: orbit.r * 2, animationDuration: orbit.d }}>
                                    <div className={`absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full ${orbit.s} ${orbit.c} shadow-sm`}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System 2 (Bottom-Right) */}
                    <div className="absolute top-[85%] left-[90%] scale-[0.8] animate-drift-2" style={{ animationDuration: '70s' }}>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 animate-pulse shadow-[0_0_40px_rgba(251,146,60,0.6)]"></div>
                            {[
                                { r: 40, d: '8s', s: 'w-2 h-2', c: 'bg-stone-400' },
                                { r: 60, d: '12s', s: 'w-3 h-3', c: 'bg-orange-400' },
                                { r: 80, d: '15s', s: 'w-3 h-3', c: 'bg-blue-400' },
                                { r: 100, d: '20s', s: 'w-2.5 h-2.5', c: 'bg-red-400' },
                                { r: 140, d: '30s', s: 'w-8 h-8', c: 'bg-orange-200' },
                            ].map((orbit, i) => (
                                <div key={i} className="absolute rounded-full border border-dashed border-gray-400/60 dark:border-gray-600 animate-spin-slow"
                                    style={{ width: orbit.r * 2, height: orbit.r * 2, animationDuration: orbit.d }}>
                                    <div className={`absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full ${orbit.s} ${orbit.c} shadow-sm`}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System 3 (Bottom-Left) */}
                    <div className="absolute top-[75%] left-[10%] scale-[0.6] animate-drift-3" style={{ animationDuration: '65s' }}>
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 animate-pulse shadow-[0_0_40px_rgba(251,146,60,0.6)]"></div>
                            {[
                                { r: 40, d: '8s', s: 'w-2 h-2', c: 'bg-stone-400' },
                                { r: 60, d: '12s', s: 'w-3 h-3', c: 'bg-orange-400' },
                                { r: 80, d: '15s', s: 'w-3 h-3', c: 'bg-blue-400' },
                                { r: 100, d: '20s', s: 'w-2.5 h-2.5', c: 'bg-red-400' },
                                { r: 140, d: '30s', s: 'w-8 h-8', c: 'bg-orange-200' },
                            ].map((orbit, i) => (
                                <div key={i} className="absolute rounded-full border border-dashed border-gray-400/60 dark:border-gray-600 animate-spin-slow"
                                    style={{ width: orbit.r * 2, height: orbit.r * 2, animationDuration: orbit.d }}>
                                    <div className={`absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full ${orbit.s} ${orbit.c} shadow-sm`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Layer 3: Vedic Icon Scatter */}
                <div className="hidden md:block">
                    {[...Array(16)].map((_, i) => {
                        const iconPath = backgroundIcons[(i + 15) % backgroundIcons.length];

                        const possibleSlots = [
                            // Left Side
                            { x: 4, y: 25 }, { x: 12, y: 20 },
                            { x: 5, y: 35 }, { x: 13, y: 40 },
                            { x: 4, y: 55 }, { x: 12, y: 60 },
                            { x: 8, y: 90 },
                            // Right Side
                            { x: 95, y: 15 }, { x: 88, y: 25 },
                            { x: 96, y: 35 }, { x: 89, y: 45 },
                            { x: 95, y: 55 }, { x: 88, y: 65 },
                            { x: 94, y: 75 }, { x: 87, y: 10 },
                        ];

                        const slot = possibleSlots[i % possibleSlots.length];
                        const jitterX = (i % 3) - 1.5;
                        const jitterY = (i % 2) - 1;
                        const finalLeft = slot.x + jitterX;
                        const finalTop = slot.y + jitterY;
                        const size = 30 + ((i * 7) % 20);
                        const animIndex = (i % 8) + 1;
                        const wanderClass = `animate-wander-${animIndex}`;
                        const wanderDuration = 120 + ((i * 13) % 40);
                        const wanderDelay = (i * 7) % 20;
                        const spinDuration = 40 + ((i * 11) % 30);
                        const spinDirection = (i % 2 === 0) ? 'normal' : 'reverse';

                        return (
                            <div
                                key={`v-icon-${i}`}
                                className={`absolute ${wanderClass}`}
                                style={{
                                    top: `${finalTop}%`,
                                    left: `${finalLeft}%`,
                                    animationDuration: `${wanderDuration}s`,
                                    animationDelay: `${wanderDelay}s`,
                                    transform: 'scale(1)',
                                }}
                            >
                                <img
                                    src={iconPath}
                                    alt={getIconName(iconPath)}
                                    className="opacity-20 dark:opacity-30 select-none animate-spin-slow transition-all duration-700 hover:scale-125"
                                    style={{
                                        width: `${size}px`,
                                        height: `${size}px`,
                                        animationDuration: `${spinDuration}s`,
                                        animationDirection: spinDirection,
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
