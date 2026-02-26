'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { SparklesIcon, CalendarIcon, MusicIcon, UsersIcon, TrophyIcon, StarIcon, ZapIcon } from 'lucide-react';

import TargetCursor from '@/components/ui/target-cursor';
import { Button } from '@/components/ui/button';

// --- Constants ---
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

const STYLES = {
  textPrimary: 'text-[hsl(222.2,47.4%,11.2%)]',
  textMuted: 'text-[hsl(215.4,16.3%,46.9%)]',
  btnGradient: 'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)]',
};

// --- Subcomponents ---
const HeroBackground = ({ springX, springY }: { springX: any; springY: any }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-[-5%] right-[-30%] w-[50vw] h-[50vw] min-w-[250px] min-h-[250px] rounded-full blur-[80px] opacity-30"
      style={{
        background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2% / 0.2), hsl(270 70% 50% / 0.2), hsl(330 80% 60% / 0.2))',
        x: springX,
        y: springY,
      }}
      animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-[-10%] left-[-30%] w-[50vw] h-[50vw] min-w-[250px] min-h-[250px] rounded-full blur-[80px] opacity-30"
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
    {PARTICLES.map((particle) => (
      <motion.div
        key={particle.id}
        className="absolute w-2 h-2 rounded-full"
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
);

// --- Main Component ---
export default function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sectionRef = useRef<HTMLElement>(null);

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

      <HeroBackground springX={springX} springY={springY} />

      <div className="w-full max-w-7xl mx-auto px-8 relative z-10 flex flex-col justify-center items-center">
        <motion.div
          className="max-w-4xl mx-auto text-center w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge */}
          <motion.span
            className={`font-primary inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-[14px] font-medium mb-5 border border-[hsl(222.2,47.4%,11.2%)]/20 ${STYLES.textPrimary} shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.1)] bg-white/50 backdrop-blur-sm`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <SparklesIcon className="w-3.5 h-3.5 animate-pulse text-yellow-400" />
            Discover Amazing Events
          </motion.span>

          {/* Title */}
          <motion.h1
            className={`font-special text-[60px] leading-tight mb-5 px-6 ${STYLES.textPrimary}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            Connect, Create and Celebrate <br className="block" />with{' '}
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
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className={`font-secondary text-[15px] mb-6 max-w-2xl mx-auto leading-relaxed ${STYLES.textMuted} px-4`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your all-in-one platform for discovering exciting events, creating
            unforgettable experiences, and connecting with like-minded individuals.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-row gap-4 justify-center items-center w-full mb-6 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              asChild
              className={`font-primary relative cursor-pointer group overflow-hidden inline-flex items-center justify-center h-11 px-8 w-auto text-[15px] text-white rounded-xl shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.2)] transition-all duration-500 hover:scale-[1.02] border-none ${STYLES.btnGradient} bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]`}
            >
              <Link href="/events">
                <span className="relative z-10">Explore Events</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={`font-primary relative cursor-pointer group overflow-hidden inline-flex items-center justify-center h-11 w-auto px-8 text-[15px] rounded-xl border-2 transition-all duration-500 shadow-lg hover:bg-transparent ${STYLES.textPrimary} border-[hsl(222.2,47.4%,11.2%)]/20`}
            >
              <Link href="/become-an-organizer">
                <span className="relative z-10">Become an Organizer</span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)]/10 to-[hsl(270,70%,50%)]/10" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 items-center px-4 max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {CATEGORIES.map(({ icon: Icon, label, color, delay }) => (
            <motion.div
              key={label}
              className={`font-secondary flex items-center gap-1.5 text-sm cursor-pointer group px-4 py-2 rounded-full transition-colors duration-200 bg-white/60 backdrop-blur-md border border-gray-100 hover:border-gray-300 shadow-sm ${STYLES.textMuted}`}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.9)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay }}
            >
              <Icon size={14} style={{ color }} className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              {label}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Floating Orbs */}
      <motion.div
        className="block absolute top-1/4 left-8 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]"
        animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="block absolute bottom-1/4 right-8 w-3 h-3 rounded-full bg-gradient-to-r from-[hsl(210,100%,60%)] to-[hsl(180,70%,50%)]"
        animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </section>
  );
}