'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Settings } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

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

export default function NotFound() {
    const router = useRouter();
    const [isHomeHovered, setIsHomeHovered] = useState(false);

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
            className="relative w-full min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[hsl(210,40%,96.1%)] to-white p-4"
            onMouseMove={handleMouseMove}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div className="absolute top-[-5%] right-[-30%] w-[80vw] h-[80vw] min-w-[250px] min-h-[250px] rounded-full blur-[60px] opacity-30 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)]/20 via-[hsl(270,70%,50%)]/20 to-[hsl(330,80%,60%)]/20" style={{ x: springX, y: springY }} animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute bottom-[-10%] left-[-30%] w-[70vw] h-[70vw] min-w-[250px] min-h-[250px] rounded-full blur-[60px] opacity-30 bg-gradient-to-r from-[hsl(210,100%,60%)]/20 via-[hsl(180,70%,50%)]/20 to-[hsl(160,70%,45%)]/20" style={{ x: springX, y: springY }} animate={{ scale: [1.2, 1, 1.2], rotate: [45, 0, 45] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(222.2_47.4%_11.2%/_0.05),transparent,transparent)]" />
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                
                {PARTICLES.map((particle) => (
                    <motion.div key={particle.id} className="absolute w-1.5 h-1.5 rounded-full pointer-events-none" style={{ background: `hsl(${particle.hue}, 70%, 50%)`, left: particle.left, top: particle.top }} animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3], y: [0, -20, 0] }} transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: 'easeInOut' }} />
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="max-w-2xl w-full text-center relative z-10">
                <motion.div className="mb-6 inline-flex p-3 rounded-full bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-xl" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}>
                    <Settings className="w-10 h-10 text-indigo-500 animate-[spin_8s_linear_infinite]" />
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
                    <h2 className="font-primary text-3xl sm:text-4xl font-bold text-gray-900 mt-4 tracking-tight">Oops! Page Not Found</h2>
                    <p className="font-secondary text-gray-500 mt-3 mb-8 text-base leading-relaxed max-w-lg mx-auto">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Let's get you back on track.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild variant="outline" className="font-primary relative group overflow-hidden inline-flex items-center justify-center gap-2 h-12 px-8 text-sm rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-md hover:bg-gray-50 text-[hsl(222.2,47.4%,11.2%)] border-[hsl(222.2,47.4%,11.2%)]/20 w-full sm:w-auto">
                            <a onClick={() => router.back()} className="cursor-pointer w-full">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                                <span>Go Back</span>
                            </a>
                        </Button>
                        <Button asChild className="font-primary relative cursor-pointer group overflow-hidden inline-flex items-center justify-center gap-2 h-12 px-8 text-sm text-white rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] border-none w-full sm:w-auto" style={{ background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))', backgroundSize: '200% auto', backgroundPosition: isHomeHovered ? '100% 0' : '0 0' }} onMouseEnter={() => setIsHomeHovered(true)} onMouseLeave={() => setIsHomeHovered(false)}>
                            <Link href="/" className="w-full">
                                <Home className="w-4 h-4" />
                                <span>Home Page</span>
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}