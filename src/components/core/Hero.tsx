"use client";

import { useState, useRef, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { SparklesIcon, CalendarIcon, MusicIcon, UsersIcon, TrophyIcon, StarIcon, ZapIcon } from 'lucide-react';

import TargetCursor from '@/components/ui/target-cursor';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';

export default function Hero() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const [isHovered, setIsHovered] = useState(false);

    const springConfig = { stiffness: 100, damping: 30 };
    const springX = useSpring(useTransform(mouseX, (v) => v * 0.05), springConfig);
    const springY = useSpring(useTransform(mouseY, (v) => v * 0.05), springConfig);

    const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
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

    const sectionRef = useRef<HTMLElement>(null);

    const categories = [
        { icon: MusicIcon, label: 'Concerts', color: '#ef4444', delay: 0.4 },
        { icon: UsersIcon, label: 'Conferences', color: '#3b82f6', delay: 0.45 },
        { icon: CalendarIcon, label: 'Workshops', color: '#22c55e', delay: 0.5 },
        { icon: TrophyIcon, label: 'Sports', color: '#eab308', delay: 0.55 },
        { icon: StarIcon, label: 'Arts', color: '#a855f7', delay: 0.6 },
        { icon: ZapIcon, label: 'Technology', color: '#6366f1', delay: 0.65 },
    ];

    return (
        <section
            id="home"
            ref={sectionRef}
            className="relative w-full min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] flex flex-col justify-center items-center overflow-hidden bg-gradient-to-b from-[hsl(210,40%,96.1%)] to-white pt-24 pb-12 sm:pt-28 sm:pb-16"
            onMouseMove={handleMouseMove}
        >
            <div className="hidden lg:block">
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
                    className="absolute top-[-5%] right-[-30%] sm:right-[-20%] lg:right-[-10%] w-[80vw] sm:w-[60vw] lg:w-[40vw] h-[80vw] sm:h-[60vw] lg:h-[40vw] min-w-[250px] min-h-[250px] rounded-full blur-[60px] sm:blur-[80px] lg:blur-[100px] opacity-30 lg:opacity-40"
                    style={{
                        background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2% / 0.2), hsl(270 70% 50% / 0.2), hsl(330 80% 60% / 0.2))',
                        x: springX,
                        y: springY,
                    }}
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute bottom-[-10%] left-[-30%] sm:left-[-20%] lg:left-[-10%] w-[70vw] sm:w-[50vw] lg:w-[35vw] h-[70vw] sm:h-[50vw] lg:h-[35vw] min-w-[250px] min-h-[250px] rounded-full blur-[60px] sm:blur-[80px] lg:blur-[100px] opacity-30 lg:opacity-40"
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
                        className="absolute w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full"
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

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-center items-center">
                <motion.div
                    className="max-w-5xl mx-auto text-center w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.span
                        className="font-primary inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] lg:text-xs font-medium mb-4 sm:mb-6"
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
                        <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse text-yellow-400" />
                        Discover Amazing Events
                    </motion.span>

                    <motion.h1
                        className="font-special text-3xl sm:text-4xl lg:text-6xl leading-[1.1] sm:leading-tight mb-4 sm:mb-6 px-2 sm:px-0"
                        style={{ color: 'hsl(222.2 47.4% 11.2%)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        Connect, Create and Celebrate <br className="hidden lg:block" />with{' '}
                        <span className="relative inline-block mt-1 sm:mt-2 lg:mt-0">
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
                        className="font-secondary text-xs sm:text-sm lg:text-lg mb-6 sm:mb-8 max-w-[90%] sm:max-w-2xl mx-auto leading-relaxed"
                        style={{ color: 'hsl(215.4 16.3% 46.9%)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Your all-in-one platform for discovering exciting events, creating
                        unforgettable experiences, and connecting with like-minded individuals.
                    </motion.p>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full px-6 sm:px-0 mb-8 sm:mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <Button
                            className="font-primary w-full sm:w-auto relative cursor-target group overflow-hidden inline-flex items-center justify-center h-10 lg:h-12 px-5 sm:px-7 text-xs sm:text-sm text-white rounded-xl shadow-lg transition-all duration-500 hover:scale-[1.02] sm:hover:scale-105"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={() => Toast('Feature Coming Soon', 'Event discovery is launching soon. Stay tuned!', 'warning')}
                            style={{
                                background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))',
                                backgroundSize: '200% auto',
                                backgroundPosition: isHovered ? '100% 0' : '0 0',
                                transition: 'background-position 0.5s ease',
                                boxShadow: '0 10px 15px -3px hsl(222.2 47.4% 11.2% / 0.2)',
                            }}
                        >
                            <span className="relative z-10">Explore Events</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="font-primary w-full sm:w-auto relative cursor-target group overflow-hidden inline-flex items-center justify-center h-10 lg:h-12 px-5 sm:px-7 text-xs sm:text-sm rounded-xl border-2 transition-all duration-500 shadow-lg bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
                            onClick={() => Toast('Feature Coming Soon', 'Organizer sign-up is launching soon. Stay tuned!', 'warning')}
                            style={{
                                color: 'hsl(222.2 47.4% 11.2%)',
                                borderColor: 'hsl(222.2 47.4% 11.2% / 0.2)',
                                boxShadow: '0 10px 15px -3px hsl(222.2 47.4% 11.2% / 0.1)',
                            }}
                        >
                            <span className="relative z-10">Become an Organizer</span>
                            <span
                                className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"
                                style={{ background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2% / 0.1), hsl(270 70% 50% / 0.1))' }}
                            />
                        </Button>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 items-center px-4 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    {categories.map(({ icon: Icon, label, color, delay }) => (
                        <motion.div
                            key={label}
                            className="font-secondary flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] lg:text-xs cursor-pointer group px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors duration-200 bg-white/60 backdrop-blur-md border border-gray-100 hover:border-gray-300 shadow-sm"
                            style={{ color: 'hsl(215.4 16.3% 46.9%)' }}
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.9)' }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay }}
                            onClick={() => Toast('Feature Coming Soon', `${label} events are launching soon. Stay tuned!`, 'warning')}
                        >
                            <Icon size={14} style={{ color }} className="group-hover:scale-110 transition-transform" />
                            {label}
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <motion.div
                className="absolute top-1/4 left-4 sm:left-8 lg:left-10 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded-full"
                style={{ background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%))' }}
                animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute bottom-1/4 right-4 sm:right-8 lg:right-10 w-3 h-3 sm:w-4 sm:h-4 lg:w-6 lg:h-6 rounded-full"
                style={{ background: 'linear-gradient(to right, hsl(210 100% 60%), hsl(180 70% 50%))' }}
                animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
        </section>
    );
}
