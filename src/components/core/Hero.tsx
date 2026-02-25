'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { SparklesIcon, CalendarIcon, MusicIcon, UsersIcon, TrophyIcon, StarIcon, ZapIcon } from 'lucide-react';

import TargetCursor from '@/components/ui/target-cursor';
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

const CATEGORIES = [
    { icon: MusicIcon, label: 'Concerts', color: '#ef4444', delay: 0.4 },
    { icon: UsersIcon, label: 'Conferences', color: '#3b82f6', delay: 0.45 },
    { icon: CalendarIcon, label: 'Workshops', color: '#22c55e', delay: 0.5 },
    { icon: TrophyIcon, label: 'Sports', color: '#eab308', delay: 0.55 },
    { icon: StarIcon, label: 'Arts', color: '#a855f7', delay: 0.6 },
    { icon: ZapIcon, label: 'Technology', color: '#6366f1', delay: 0.65 },
];

export function Hero() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [isHovered, setIsHovered] = React.useState(false);

    const springX = useSpring(useTransform(mouseX, (v) => v * 0.05), SPRING_CONFIG);
    const springY = useSpring(useTransform(mouseY, (v) => v * 0.05), SPRING_CONFIG);

    const sectionRef = React.useRef<HTMLElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    return (
        <section
            id="home"
            ref={sectionRef}
            className="relative w-full min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] flex flex-col justify-center items-center overflow-hidden bg-gradient-to-b from-[hsl(210,40%,96.1%)] to-white pt-[96px] pb-[48px]"
            onMouseMove={handleMouseMove}
        >
            <div className="block">
                <TargetCursor
                    spinDuration={2}
                    hideDefaultCursor={false}
                    parallaxOn
                    hoverDuration={0.2}
                    containerRef={sectionRef}
                />
            </div>

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
                        className="absolute w-[6px] h-[6px] rounded-full"
                        style={{
                            background: `hsl(${particle.hue}, 70%, 50%)`,
                            left: particle.left,
                            top: particle.top,
                        }}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: 'easeInOut' }}
                    />
                ))}
            </div>

            <div className="w-full max-w-[1280px] mx-auto px-[16px] relative z-10 flex flex-col justify-center items-center">
                <motion.div
                    className="max-w-[1024px] mx-auto text-center w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.span
                        className="font-primary inline-flex items-center gap-[6px] px-[12px] py-[6px] rounded-full text-[11px] font-medium mb-[16px]"
                        style={{
                            border: '1px solid hsl(222.2 47.4% 11.2% / 0.2)',
                            color: 'hsl(222.2 47.4% 11.2%)',
                            boxShadow: '0 10px 15px -3px hsl(222.2 47.4% 11.2% / 0.1)',
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.05 }}
                    >
                            <SparklesIcon className="w-[14px] h-[14px] animate-pulse text-yellow-400" />
                        Discover Amazing Events
                    </motion.span>

                    <motion.h1
                        className="font-special text-[60px] leading-tight mb-[24px] px-[8px]"
                        style={{ color: 'hsl(222.2 47.4% 11.2%)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        Connect, Create and Celebrate <br />with{' '}
                            <span className="relative inline-block mt-[4px]">
                            <span
                                className="relative z-10 font-special font-semibold"
                                style={{
                                    backgroundImage: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(330 80% 60%))',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                                }}
                            >
                                BuddyTicket.lk
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
                        className="font-secondary text-[16px] mb-[32px] max-w-[672px] mx-auto leading-relaxed"
                        style={{ color: 'hsl(215.4 16.3% 46.9%)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Your all-in-one platform for discovering exciting events, creating
                        unforgettable experiences, and connecting with like-minded individuals.
                    </motion.p>

                    <motion.div
                        className="flex flex-row gap-[16px] justify-center items-center w-full mb-[40px]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <Button
                            asChild
                            className="font-primary relative cursor-target group overflow-hidden inline-flex items-center justify-center h-[48px] px-[32px] text-[14px] text-white rounded-xl shadow-lg transition-all duration-500 hover:scale-[1.02]"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            style={{
                                background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))',
                                backgroundSize: '200% auto',
                                backgroundPosition: isHovered ? '100% 0' : '0 0',
                                transition: 'background-position 0.5s ease',
                                boxShadow: '0 10px 15px -3px hsl(222.2 47.4% 11.2% / 0.2)',
                            }}
                        >
                            <Link href="/events">
                                <span className="relative z-10">Explore Events</span>
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="font-primary relative cursor-target group overflow-hidden inline-flex items-center justify-center h-[48px] px-[32px] text-[14px] rounded-xl border-2 transition-all duration-500 shadow-lg hover:bg-transparent"
                            style={{
                                color: 'hsl(222.2 47.4% 11.2%)',
                                borderColor: 'hsl(222.2 47.4% 11.2% / 0.2)',
                                boxShadow: '0 10px 15px -3px hsl(222.2 47.4% 11.2% / 0.1)',
                            }}
                        >
                            <Link href="/become-an-organizer">
                                <span className="relative z-10">Become an Organizer</span>
                                <span
                                    className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"
                                    style={{ background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2% / 0.1), hsl(270 70% 50% / 0.1))' }}
                                />
                            </Link>
                        </Button>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="flex flex-wrap justify-center gap-[8px] items-center px-[16px] max-w-[768px]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    {CATEGORIES.map(({ icon: Icon, label, color, delay }) => (
                        <motion.div
                            key={label}
                            className="font-secondary flex items-center gap-[6px] text-[11px] cursor-pointer group px-[12px] py-[6px] rounded-full transition-colors duration-200 bg-white/60 backdrop-blur-md border border-gray-100 hover:border-gray-300 shadow-sm"
                            style={{ color: 'hsl(215.4 16.3% 46.9%)' }}
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.9)' }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay }}
                        >
                            <Icon size={14} style={{ color }} className="group-hover:scale-110 transition-transform" />
                            {label}
                        </motion.div>
                    ))}
                </motion.div>
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
        </section>
    );
}

export default Hero;