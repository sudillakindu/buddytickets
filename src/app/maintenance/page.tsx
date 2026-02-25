'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Settings, Clock, RefreshCw, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';

const SPRING_CONFIG = { stiffness: 100, damping: 30 };

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    hue: i * 18,
    left: `${(i * 37 + 13) % 100}%`,
    top: `${(i * 53 + 7) % 100}%`,
    duration: 3 + (i % 5) * 0.4,
    delay: (i % 8) * 0.25,
}));

export default function MaintenancePage() {
    const [isHomeHovered, setIsHomeHovered] = React.useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(useTransform(mouseX, (v: number) => v * 0.05), SPRING_CONFIG);
    const springY = useSpring(useTransform(mouseY, (v: number) => v * 0.05), SPRING_CONFIG);

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    return (
        <section
            id="maintenance"
            className="relative w-full min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[hsl(210,40%,96.1%)] to-white p-[16px]"
            onMouseMove={handleMouseMove}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-[-5%] right-[-30%] w-[80vw] h-[80vw] min-w-[250px] min-h-[250px] rounded-full blur-[60px] opacity-30"
                    style={{
                        background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2% / 0.2), hsl(270 70% 50% / 0.2), hsl(330 80% 60% / 0.2))',
                        x: springX,
                        y: springY,
                    }}
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[-10%] left-[-30%] w-[70vw] h-[70vw] min-w-[250px] min-h-[250px] rounded-full blur-[60px] opacity-30"
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
                {PARTICLES.map((particle) => (
                    <motion.div
                        key={particle.id}
                        className="absolute w-[6px] h-[6px] rounded-full pointer-events-none"
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

            <motion.div
                className="absolute top-1/4 left-[16px] w-[10px] h-[10px] rounded-full"
                style={{ background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%))' }}
                animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute bottom-1/4 right-[16px] w-[12px] h-[12px] rounded-full"
                style={{ background: 'linear-gradient(to right, hsl(210 100% 60%), hsl(180 70% 50%))' }}
                animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="max-w-[672px] w-full text-center relative z-10"
            >
                <motion.div
                    className="mb-[24px] inline-flex p-[12px] rounded-full bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
                >
                    <Settings
                        className="w-[40px] h-[40px] text-indigo-500"
                        style={{ animation: 'spin 8s linear infinite' }}
                    />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                >
                    <motion.span
                        className="font-primary inline-flex items-center gap-[6px] px-[12px] py-[6px] rounded-full text-[12px] font-medium mb-[16px] bg-white/50 backdrop-blur-sm"
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
                        <Clock className="w-[14px] h-[14px] text-orange-500" />
                        System Update in Progress
                    </motion.span>
                    <h2 className="font-primary text-[36px] font-bold text-gray-900 mt-[16px] tracking-tight">
                        We'll be right back soon!
                    </h2>
                    <p className="font-secondary text-gray-500 mt-[12px] mb-[32px] text-[16px] leading-relaxed max-w-[512px] mx-auto">
                        BuddyTickets is currently undergoing scheduled maintenance to improve your experience.
                        Please grab a cup of coffee and check back in a few minutes.
                    </p>

                    <div className="flex flex-row gap-[16px] justify-center">
                        <Button
                            asChild
                            variant="outline"
                            className="font-primary relative group overflow-hidden inline-flex items-center justify-center gap-[8px] h-[48px] px-[32px] text-[14px] rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-md hover:bg-gray-50"
                            style={{
                                color: 'hsl(222.2 47.4% 11.2%)',
                                borderColor: 'hsl(222.2 47.4% 11.2% / 0.2)',
                            }}
                        >
                            <a onClick={() => window.location.reload()} className="cursor-pointer">
                                <RefreshCw className="w-[16px] h-[16px] group-hover:rotate-180 transition-transform duration-500" />
                                <span>Refresh Page</span>
                            </a>
                        </Button>
                        <Button
                            asChild
                            className="font-primary relative cursor-pointer group overflow-hidden inline-flex items-center justify-center gap-[8px] h-[48px] px-[32px] text-[14px] text-white rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))',
                                backgroundSize: '200% auto',
                                backgroundPosition: isHomeHovered ? '100% 0' : '0 0',
                                transition: 'all 0.4s ease',
                            }}
                            onMouseEnter={() => setIsHomeHovered(true)}
                            onMouseLeave={() => setIsHomeHovered(false)}
                        >
                            <Link href="/">
                                <Home className="w-[16px] h-[16px]" />
                                <span>Home Page</span>
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}