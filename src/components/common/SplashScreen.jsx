import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [phase, setPhase] = useState(0); // 0=particles, 1=logo, 2=text, 3=exit

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 400),
            setTimeout(() => setPhase(2), 2200),
            setTimeout(() => setPhase(3), 3600),
            setTimeout(() => {
                setIsVisible(false);
                setTimeout(onComplete, 900);
            }, 4000),
        ];
        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    const logoVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { duration: 1.8, ease: [0.43, 0.13, 0.23, 0.96] },
                opacity: { duration: 0.6 },
            }
        }
    };

    // Generate floating particles
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 2,
        duration: Math.random() * 3 + 3,
    }));

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{
                        clipPath: 'circle(0% at 50% 50%)',
                        transition: { duration: 1.2, ease: [0.77, 0, 0.175, 1] }
                    }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}
                >
                    {/* Floating particles */}
                    {particles.map(p => (
                        <motion.div
                            key={p.id}
                            className="absolute rounded-full"
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                width: p.size,
                                height: p.size,
                                background: p.id % 3 === 0 ? '#6366F1' : p.id % 3 === 1 ? '#22D3EE' : '#818CF8',
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: [0, 0.6, 0],
                                scale: [0, 1, 0],
                                y: [0, -60, -120],
                            }}
                            transition={{
                                duration: p.duration,
                                delay: p.delay,
                                repeat: Infinity,
                                ease: 'easeOut',
                            }}
                        />
                    ))}

                    {/* Radial glow behind logo */}
                    <motion.div
                        className="absolute w-[400px] h-[400px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: phase >= 1 ? [1, 1.2, 1] : 0,
                            opacity: phase >= 1 ? 1 : 0,
                        }}
                        transition={{
                            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                            opacity: { duration: 0.8 },
                        }}
                    />

                    {/* Second glow — cyan */}
                    <motion.div
                        className="absolute w-[300px] h-[300px] rounded-full"
                        style={{
                            background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: phase >= 1 ? [1.2, 1, 1.2] : 0,
                            opacity: phase >= 1 ? 1 : 0,
                        }}
                        transition={{
                            scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                            opacity: { duration: 1 },
                        }}
                    />

                    <div className="relative flex flex-col items-center z-10">
                        {/* Logo SVG */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: phase >= 1 ? 1 : 0.8,
                                opacity: phase >= 1 ? 1 : 0,
                            }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <svg
                                width="120"
                                height="120"
                                viewBox="0 0 100 100"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="mb-10"
                            >
                                {/* Glow filter */}
                                <defs>
                                    <filter id="splashGlow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Main triangle */}
                                <motion.path
                                    d="M10 90L50 10L90 90"
                                    stroke="#6366F1"
                                    strokeWidth="2.5"
                                    strokeLinecap="square"
                                    filter="url(#splashGlow)"
                                    variants={logoVariants}
                                    initial="hidden"
                                    animate={phase >= 1 ? "visible" : "hidden"}
                                />
                                {/* Crossbar */}
                                <motion.path
                                    d="M28 62H72"
                                    stroke="#22D3EE"
                                    strokeWidth="2.5"
                                    strokeLinecap="square"
                                    filter="url(#splashGlow)"
                                    variants={logoVariants}
                                    initial="hidden"
                                    animate={phase >= 1 ? "visible" : "hidden"}
                                    transition={{ delay: 0.8 }}
                                />
                                {/* Base line */}
                                <motion.path
                                    d="M20 88H80"
                                    stroke="#6366F1"
                                    strokeWidth="1"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{
                                        pathLength: phase >= 1 ? 1 : 0,
                                        opacity: phase >= 1 ? 0.3 : 0,
                                    }}
                                    transition={{ delay: 1.2, duration: 0.8 }}
                                />
                            </svg>
                        </motion.div>

                        {/* Brand Text — letter by letter */}
                        <motion.div
                            className="text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: phase >= 2 ? 1 : 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex items-center justify-center gap-[2px] mb-6">
                                {'THEKEDAAR'.split('').map((letter, i) => (
                                    <motion.span
                                        key={i}
                                        className="text-5xl md:text-6xl font-extrabold tracking-[-0.04em] text-white inline-block"
                                        style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
                                        initial={{ opacity: 0, y: 20, rotateX: -90 }}
                                        animate={{
                                            opacity: phase >= 2 ? 1 : 0,
                                            y: phase >= 2 ? 0 : 20,
                                            rotateX: phase >= 2 ? 0 : -90,
                                        }}
                                        transition={{
                                            delay: i * 0.05,
                                            duration: 0.4,
                                            ease: [0.16, 1, 0.3, 1],
                                        }}
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </div>

                            <motion.div
                                className="flex items-center justify-center gap-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{
                                    opacity: phase >= 2 ? 1 : 0,
                                    y: phase >= 2 ? 0 : 10,
                                }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                            >
                                <span className="w-8 h-[1px] bg-indigo-500/30" />
                                <p className="text-[10px] tracking-[0.5em] text-indigo-300/50 font-medium uppercase">
                                    Precision • Excellence • Trust
                                </p>
                                <span className="w-8 h-[1px] bg-indigo-500/30" />
                            </motion.div>
                        </motion.div>

                        {/* Progress bar */}
                        <div className="absolute bottom-[-120px] w-40 h-[2px] bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{
                                    background: 'linear-gradient(90deg, #6366F1, #22D3EE)',
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 4.5, ease: 'easeInOut' }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
