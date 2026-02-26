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
      className="absolute top-[-5%] right-[-30%] w-[80vw] h-[80vw] sm:w-[70vw] sm:h-[70vw] md:w-[60vw] md:h-[60vw] lg:w-[50vw] lg:h-[50vw] min-w-[250px] min-h-[250px] rounded-full blur-[60px] md:blur-[80px] opacity-30"
      style={{
        background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2% / 0.2), hsl(270 70% 50% / 0.2), hsl(330 80% 60% / 0.2))',
        x: springX,
        y: springY,
      }}
      animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-[-10%] left-[-30%] w-[70vw] h-[70vw] sm:w-[60vw] sm:h-[60vw] md:w-[50vw] md:h-[50vw] lg:w-[40vw] lg:h-[40vw] min-w-[250px] min-h-[250px] rounded-full blur-[60px] md:blur-[80px] opacity-30"
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
        className="absolute w-1.5 h-1.5 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 lg:w-2 lg:h-2 2xl:w-3 2xl:h-3 rounded-full"
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
      className="relative w-full h-screen supports-[height:100dvh]:h-[100dvh] flex flex-col justify-center items-center overflow-hidden bg-gradient-to-b from-[hsl(210,40%,96.1%)] to-white pt-16 sm:pt-20 md:pt-20 lg:pt-20 xl:pt-24 2xl:pt-32 pb-2 sm:pb-4 md:pb-5 lg:pb-6 xl:pb-8 2xl:pb-12"
      onMouseMove={handleMouseMove}
    >
      <div className="hidden md:block">
        <TargetCursor
          spinDuration={2}
          hideDefaultCursor={false}
          parallaxOn
          hoverDuration={0.2}
          containerRef={sectionRef}
        />
      </div>

      <HeroBackground springX={springX} springY={springY} />

      <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 md:px-8 lg:px-8 2xl:px-12 relative z-10 flex flex-col justify-center items-center">
        <motion.div
          className="max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto text-center w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge */}
          <motion.span
            className={`font-primary inline-flex items-center gap-1.5 sm:gap-1.5 md:gap-2 lg:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2 lg:px-6 lg:py-2.5 2xl:px-8 2xl:py-3 rounded-full text-[11px] xs:text-[12px] sm:text-[13px] md:text-[14px] lg:text-[15px] xl:text-base 2xl:text-lg font-medium mb-3 sm:mb-3 md:mb-4 lg:mb-4 xl:mb-5 2xl:mb-6 border border-[hsl(222.2,47.4%,11.2%)]/20 ${STYLES.textPrimary} shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.1)] bg-white/50 backdrop-blur-sm`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <SparklesIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 animate-pulse text-yellow-400" />
            Discover Amazing Events
          </motion.span>

          {/* Title */}
          <motion.h1
            className={`font-special text-3xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-[60px] 2xl:text-[72px] 2xl:leading-[1.1] leading-tight mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-8 2xl:mb-10 px-2 sm:px-4 md:px-6 ${STYLES.textPrimary}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            Connect, Create and Celebrate <br className="hidden sm:block" />with{' '}
            <span className="relative inline-block mt-1 sm:mt-1.5 md:mt-2 lg:mt-2 2xl:mt-3">
              <span
                className="relative z-10 font-special font-semibold bg-clip-text text-transparent drop-shadow-sm"
                style={{
                  backgroundImage: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(330 80% 60%))',
                }}
              >
                BuddyTickets
              </span>
              <motion.span
                className="absolute inset-0 rounded-lg -z-10 blur-sm sm:blur-md bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)]/35 via-[hsl(270,70%,50%)]/30 to-[hsl(330,80%,60%)]/35"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className={`font-secondary text-xs xs:text-sm sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl mb-4 sm:mb-5 md:mb-6 lg:mb-8 xl:mb-10 2xl:mb-12 max-w-[18rem] xs:max-w-md sm:max-w-lg md:max-w-2xl 2xl:max-w-4xl mx-auto leading-relaxed ${STYLES.textMuted} px-4`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your all-in-one platform for discovering exciting events, creating
            unforgettable experiences, and connecting with like-minded individuals.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row md:flex-row gap-3 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-6 2xl:gap-8 justify-center items-center w-full mb-4 sm:mb-5 md:mb-6 lg:mb-8 xl:mb-10 2xl:mb-12 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              asChild
              className={`font-primary relative cursor-pointer group overflow-hidden inline-flex items-center justify-center h-10 sm:h-11 md:h-12 lg:h-12 xl:h-14 2xl:h-16 px-6 sm:px-8 md:px-10 lg:px-10 xl:px-12 2xl:px-14 w-full sm:w-auto text-sm sm:text-sm md:text-base lg:text-base 2xl:text-lg text-white rounded-xl shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.2)] transition-all duration-500 hover:scale-[1.02] border-none ${STYLES.btnGradient} bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]`}
            >
              <Link href="/events">
                <span className="relative z-10">Explore Events</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className={`font-primary relative cursor-pointer group overflow-hidden inline-flex items-center justify-center h-10 sm:h-11 md:h-12 lg:h-12 xl:h-14 2xl:h-16 w-full sm:w-auto px-6 sm:px-8 md:px-10 lg:px-10 xl:px-12 2xl:px-14 text-sm sm:text-sm md:text-base lg:text-base 2xl:text-lg rounded-xl border-2 transition-all duration-500 shadow-lg hover:bg-transparent ${STYLES.textPrimary} border-[hsl(222.2,47.4%,11.2%)]/20`}
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
          className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 2xl:gap-4 items-center px-4 max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl 2xl:max-w-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {CATEGORIES.map(({ icon: Icon, label, color, delay }) => (
            <motion.div
              key={label}
              className={`font-secondary flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2 2xl:gap-3 text-[11px] sm:text-xs md:text-sm lg:text-base 2xl:text-lg cursor-pointer group px-2.5 py-1.5 sm:px-3.5 sm:py-2 md:px-4 md:py-2.5 lg:px-5 lg:py-2.5 2xl:px-6 2xl:py-3 rounded-full transition-colors duration-200 bg-white/60 backdrop-blur-md border border-gray-100 hover:border-gray-300 shadow-sm ${STYLES.textMuted}`}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.9)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay }}
            >
              <Icon size={14} style={{ color }} className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 group-hover:scale-110 transition-transform lg:w-4 lg:h-4 2xl:w-5 2xl:h-5" />
              {label}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Floating Orbs */}
      <motion.div
        className="hidden md:block absolute top-1/4 left-4 sm:left-6 md:left-8 lg:left-8 2xl:left-12 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-3 lg:h-3 2xl:w-4 2xl:h-4 rounded-full bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]"
        animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="hidden md:block absolute bottom-1/4 right-4 sm:right-6 md:right-8 lg:right-8 2xl:right-12 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-4 lg:h-4 2xl:w-5 2xl:h-5 rounded-full bg-gradient-to-r from-[hsl(210,100%,60%)] to-[hsl(180,70%,50%)]"
        animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </section>
  );
}