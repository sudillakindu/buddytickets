"use client";

import React from 'react';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Settings, Clock } from 'lucide-react';

export default function MaintenancePage() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { stiffness: 100, damping: 30 };
    const springX = useSpring(useTransform(mouseX, (v: number) => v * 0.05), springConfig);
    const springY = useSpring(useTransform(mouseY, (v: number) => v * 0.05), springConfig);

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        hue: i * 18,
        left: `${(i * 37 + 13) % 100}%`,
        top: `${(i * 53 + 7) % 100}%`,
        duration: 3 + (i % 5) * 0.4,
        delay: (i % 8) * 0.25,
    }));

    const sectionRef = React.useRef<HTMLElement>(null);

    return (
        <section
            id="maintenance"
            ref={sectionRef}
            className="relative w-full min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] flex flex-col justify-center items-center overflow-hidden bg-gradient-to-b from-[hsl(210,40%,96.1%)] to-white p-4 sm:p-6"
            onMouseMove={handleMouseMove}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-[-5%] right-[-30%] sm:right-[-20%] md:right-[-10%] w-[80vw] sm:w-[60vw] md:w-[40vw] h-[80vw] sm:h-[60vw] md:h-[40vw] min-w-[250px] min-h-[250px] rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px] opacity-30 md:opacity-40"
                    style={{
                        background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2% / 0.2), hsl(270 70% 50% / 0.2), hsl(330 80% 60% / 0.2))',
                        x: springX,
                        y: springY,
                    }}
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[-10%] left-[-30%] sm:left-[-20%] md:left-[-10%] w-[70vw] sm:w-[50vw] md:w-[35vw] h-[70vw] sm:h-[50vw] md:h-[35vw] min-w-[250px] min-h-[250px] rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px] opacity-30 md:opacity-40"
                    style={{
                        background: 'linear-gradient(to right, hsl(210 100% 60% / 0.2), hsl(180 70% 50% / 0.2), hsl(160 70% 45% / 0.2))',
                        x: springX,
                        y: springY,
                    }}
                    animate={{ scale: [1.2, 1, 1.2], rotate: [45, 0, 45] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />

                <div
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(circle at center, hsl(222.2 47.4% 11.2% / 0.05), transparent, transparent)' }}
                />

                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />

                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        className="absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-full pointer-events-none"
                        style={{
                            background: `hsl(${particle.hue}, 70%, 50%)`,
                            left: particle.left,
                            top: particle.top,
                        }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3], y: [0, -20, 0] }}
                        transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: 'easeInOut' }}
                    />
                ))}
            </div>

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-center items-center">
                <motion.div
                    className="max-w-3xl mx-auto text-center w-full flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-full bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                    >
                        <Settings
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-indigo-500"
                            style={{ animation: 'spin 8s linear infinite' }}
                        />
                    </motion.div>

                    <motion.span
                        className="font-primary inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 bg-white/50 backdrop-blur-sm"
                        style={{
                            border: '1px solid hsl(222.2 47.4% 11.2% / 0.2)',
                            color: 'hsl(222.2 47.4% 11.2%)',
                            boxShadow: '0 10px 15px -3px hsl(222.2 47.4% 11.2% / 0.1)',
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                        System Update in Progress
                    </motion.span>

                    <motion.h1
                        className="font-special text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-4 sm:mb-6 px-2 sm:px-0"
                        style={{ color: 'hsl(222.2 47.4% 11.2%)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        We'll be right <br className="hidden sm:block" />
                        <span className="relative inline-block mt-2 sm:mt-0">
                            <span
                                className="relative z-10 font-special font-semibold px-2"
                                style={{
                                    backgroundImage: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(330 80% 60%))',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                                }}
                            >
                                Back Soon!
                            </span>
                            <motion.span
                                className="absolute inset-0 rounded-lg -z-10 blur-sm"
                                style={{ background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2% / 0.2), hsl(270 70% 50% / 0.2), hsl(330 80% 60% / 0.2))' }}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </span>
                    </motion.h1>

                    <motion.p
                        className="font-secondary text-sm sm:text-base md:text-lg lg:text-xl max-w-full sm:max-w-2xl mx-auto leading-relaxed px-2"
                        style={{ color: 'hsl(215.4 16.3% 46.9%)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        BuddyTickets is currently undergoing scheduled maintenance to improve your experience.
                        Please grab a cup of coffee and check back in a few minutes.
                    </motion.p>
                </motion.div>
            </div>

            <motion.div
                className="absolute top-1/4 left-4 sm:left-8 md:left-10 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full"
                style={{ background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%))' }}
                animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute bottom-1/4 right-4 sm:right-8 md:right-10 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full"
                style={{ background: 'linear-gradient(to right, hsl(210 100% 60%), hsl(180 70% 50%))' }}
                animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
        </section>
    );
}