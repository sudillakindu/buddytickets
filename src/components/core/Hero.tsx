// components/core/Hero.tsx
'use client';

import React, { useRef, memo } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import { SparklesIcon, CalendarIcon, MusicIcon, UsersIcon, TrophyIcon, StarIcon, ZapIcon, LucideIcon } from 'lucide-react';

import { cn } from '@/lib/ui/utils';
import { Button } from '@/components/ui/button';
import { TargetCursor } from '@/components/shared/target-cursor';

interface Particle {
  id: number;
  hue: number;
  left: string;
  top: string;
  duration: number;
  delay: number;
}

interface Category {
  icon: LucideIcon;
  label: string;
  color: string;
  delay: number;
}

const SPRING_CONFIG = { stiffness: 100, damping: 30 } as const;

const PARTICLES: Particle[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  hue: i * 18,
  left: `${(i * 37 + 13) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  duration: 3 + (i % 5) * 0.4,
  delay: (i % 8) * 0.25,
}));

const CATEGORIES: Category[] = [
  { icon: MusicIcon, label: 'Concerts', color: '#ef4444', delay: 0.4 },
  { icon: UsersIcon, label: 'Conferences', color: '#3b82f6', delay: 0.45 },
  { icon: CalendarIcon, label: 'Workshops', color: '#22c55e', delay: 0.5 },
  { icon: TrophyIcon, label: 'Sports', color: '#eab308', delay: 0.55 },
  { icon: StarIcon, label: 'Arts', color: '#a855f7', delay: 0.6 },
  { icon: ZapIcon, label: 'Technology', color: '#6366f1', delay: 0.65 },
];

interface HeroBackgroundProps {
  springX: MotionValue<number>;
  springY: MotionValue<number>;
}

const HeroBackground = memo(({ springX, springY }: HeroBackgroundProps) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute top-[-5%] right-[-30%] w-[50vw] h-[50vw] min-w-[200px] min-h-[200px] rounded-full blur-[80px] opacity-30"
        style={{
          background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2% / 0.2), hsl(270 70% 50% / 0.2), hsl(330 80% 60% / 0.2))',
          x: springX,
          y: springY,
        }}
        animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[-30%] w-[50vw] h-[50vw] min-w-[200px] min-h-[200px] rounded-full blur-[80px] opacity-30"
        style={{
          background: 'linear-gradient(to right, hsl(210 100% 60% / 0.2), hsl(180 70% 50% / 0.2), hsl(160 70% 45% / 0.2))',
          x: springX,
          y: springY,
        }}
        animate={{ scale: [1.2, 1, 1.2], rotate: [45, 0, 45] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(222.2_47.4%_11.2%/_0.05),transparent,transparent)]" />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ background: `hsl(${p.hue}, 70%, 50%)`, left: p.left, top: p.top }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
});

HeroBackground.displayName = 'HeroBackground';

const CategoryPill = memo(({ icon: Icon, label, color, delay }: Category) => {
  return (
    <motion.div
      className="font-secondary flex items-center gap-1.5 text-sm cursor-pointer group px-3 sm:px-4 py-2 rounded-full transition-colors duration-200 bg-white/60 backdrop-blur-md border border-gray-100 hover:border-gray-300 shadow-sm text-[hsl(215.4,16.3%,46.9%)]"
      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.9)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Icon 
        size={14} 
        style={{ color }} 
        className="w-3.5 h-3.5 flex-shrink-0 group-hover:scale-110 transition-transform" 
      />
      <span className="whitespace-nowrap">{label}</span>
    </motion.div>
  );
});

CategoryPill.displayName = 'CategoryPill';

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(useTransform(mouseX, (v) => v * 0.05), SPRING_CONFIG);
  const springY = useSpring(useTransform(mouseY, (v) => v * 0.05), SPRING_CONFIG);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative w-full h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col justify-center items-center overflow-hidden bg-gradient-to-b from-[hsl(210,40%,96.1%)] to-white pt-24 pb-5"
      onMouseMove={handleMouseMove}
      aria-label="Hero section"
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

      <HeroBackground springX={springX} springY={springY} />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-center items-center gap-6">
        <motion.div
          className="max-w-4xl mx-auto text-center w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.span
            className="font-primary inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-[13px] sm:text-[14px] font-medium mb-5 border border-[hsl(222.2,47.4%,11.2%)]/20 shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.1)] bg-white/50 backdrop-blur-sm text-[hsl(222.2,47.4%,11.2%)]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <SparklesIcon className="w-3.5 h-3.5 animate-pulse text-yellow-400" aria-hidden="true" />
            Discover Amazing Events
          </motion.span>

          <motion.h1
            className="font-special text-[36px] sm:text-[48px] lg:text-[60px] leading-tight mb-5 px-2 sm:px-6 text-[hsl(222.2,47.4%,11.2%)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            Connect, Create and Celebrate{' '}
            <br className="hidden sm:block" />
            with{' '}
            <span className="relative inline-block mt-2">
              <span
                className="relative z-10 font-special font-semibold bg-clip-text text-transparent drop-shadow-sm"
                style={{
                  backgroundImage: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(330 80% 60%))',
                }}
              >
                BuddyTickets
              </span>
              <motion.span
                className="absolute inset-0 rounded-lg -z-10 blur-md bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)]/35 via-[hsl(270,70%,50%)]/30 to-[hsl(330,80%,60%)]/35"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden="true"
              />
            </span>
          </motion.h1>

          <motion.p
            className="font-secondary text-[14px] sm:text-[15px] mb-6 max-w-2xl mx-auto leading-relaxed px-2 sm:px-4 text-[hsl(215.4,16.3%,46.9%)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your all-in-one platform for discovering exciting events, creating unforgettable experiences, and connecting with like-minded individuals.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full mb-0 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              asChild
              className="cursor-target font-primary relative cursor-pointer group overflow-hidden inline-flex items-center justify-center h-11 px-8 w-full sm:w-auto text-[15px] text-white rounded-xl shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.2)] transition-all duration-500 hover:scale-[1.02] border-none bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)]"
            >
              <Link href="/events">
                <span className="relative z-10">Explore Events</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="cursor-target font-primary relative cursor-pointer group overflow-hidden inline-flex items-center justify-center h-11 w-full sm:w-auto px-8 text-[15px] rounded-xl border-2 transition-all duration-500 shadow-lg hover:bg-transparent border-[hsl(222.2,47.4%,11.2%)]/20 text-[hsl(222.2,47.4%,11.2%)]"
            >
              <Link href="/become-an-organizer">
                <span className="relative z-10">Become an Organizer</span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)]/10 to-[hsl(270,70%,50%)]/10" aria-hidden="true" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-2 sm:gap-3 items-center px-4 max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          role="list"
          aria-label="Event categories"
        >
          {CATEGORIES.map((cat) => (
            <div key={cat.label} role="listitem">
              <CategoryPill {...cat} />
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="hidden sm:block absolute top-1/4 left-8 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]"
        animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <motion.div
        className="hidden sm:block absolute bottom-1/4 right-8 w-3 h-3 rounded-full bg-gradient-to-r from-[hsl(210,100%,60%)] to-[hsl(180,70%,50%)]"
        animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
    </section>
  );
}