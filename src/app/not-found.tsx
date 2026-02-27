'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Settings } from 'lucide-react';
import { motion, MotionValue, useMotionValue, useSpring, useTransform } from 'framer-motion';

import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  id: number;
  hue: number;
  left: string;
  top: string;
  duration: number;
  delay: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PARTICLES: Particle[] = Array.from({ length: 20 }, (_, i) => ({
  id:       i,
  hue:      i * 18,
  left:     `${(i * 37 + 13) % 100}%`,
  top:      `${(i * 53 + 7)  % 100}%`,
  duration: 3 + (i % 5) * 0.4,
  delay:    (i % 8) * 0.25,
}));

const SPRING_CONFIG = { stiffness: 100, damping: 30 } as const;

// ─── Animated Background ──────────────────────────────────────────────────────

function AnimatedBackground({ springX, springY }: { springX: MotionValue<number>; springY: MotionValue<number> }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Top-right blob */}
      <motion.div
        className="absolute top-[-5%] right-[-30%] w-[80vw] h-[80vw] min-w-[200px] min-h-[200px] rounded-full blur-[60px] opacity-30"
        style={{
          background:
            'linear-gradient(to right, hsl(222.2 47.4% 11.2% / 0.2), hsl(270 70% 50% / 0.2), hsl(330 80% 60% / 0.2))',
          x: springX,
          y: springY,
        }}
        animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bottom-left blob */}
      <motion.div
        className="absolute bottom-[-10%] left-[-30%] w-[70vw] h-[70vw] min-w-[200px] min-h-[200px] rounded-full blur-[60px] opacity-30"
        style={{
          background:
            'linear-gradient(to right, hsl(210 100% 60% / 0.2), hsl(180 70% 50% / 0.2), hsl(160 70% 45% / 0.2))',
          x: springX,
          y: springY,
        }}
        animate={{ scale: [1.2, 1, 1.2], rotate: [45, 0, 45] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(222.2_47.4%_11.2%/_0.05),transparent,transparent)]" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Particles */}
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: `hsl(${p.hue}, 70%, 50%)`,
            left: p.left,
            top:  p.top,
          }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3], y: [0, -20, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotFound() {
  const router = useRouter();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(useTransform(mouseX, (v: number) => v * 0.05), SPRING_CONFIG);
  const springY = useSpring(useTransform(mouseY, (v: number) => v * 0.05), SPRING_CONFIG);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width  / 2);
    mouseY.set(e.clientY - rect.top  - rect.height / 2);
  }, [mouseX, mouseY]);

  const goBack = useCallback(() => router.back(), [router]);

  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden
        bg-gradient-to-b from-[hsl(210,40%,96.1%)] to-white p-4
        supports-[min-height:100dvh]:min-h-[100dvh]"
      onMouseMove={handleMouseMove}
      aria-label="404 Not Found"
    >
      <AnimatedBackground springX={springX} springY={springY} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-2xl w-full text-center relative z-10 px-4"
      >
        {/* Icon */}
        <motion.div
          className="mb-6 inline-flex p-3 rounded-full bg-white/50 backdrop-blur-sm border border-gray-200/50 shadow-xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        >
          <Settings
            className="w-10 h-10 text-indigo-500 animate-[spin_8s_linear_infinite]"
            aria-hidden="true"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h1 className="font-primary text-3xl sm:text-4xl font-bold text-gray-900 mt-4 tracking-tight">
            Oops! Page Not Found
          </h1>
          <p className="font-secondary text-gray-500 mt-3 mb-8 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            The page you are looking for might have been removed, had its name changed, or is
            temporarily unavailable. Let&apos;s get you back on track.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button
              variant="outline"
              onClick={goBack}
              className="font-primary relative group overflow-hidden inline-flex items-center justify-center gap-2
                h-12 w-full sm:w-auto px-8 text-sm rounded-xl border-2
                transition-all duration-300 shadow-sm hover:shadow-md hover:bg-gray-50
                text-[hsl(222.2,47.4%,11.2%)] border-[hsl(222.2,47.4%,11.2%)]/20"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" aria-hidden="true" />
              <span>Go Back</span>
            </Button>

            <Button
              asChild
              className="font-primary relative cursor-pointer group overflow-hidden inline-flex items-center justify-center gap-2
                h-12 w-full sm:w-auto px-8 text-sm text-white rounded-xl shadow-lg
                transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]
                bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)]
                bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]"
            >
              <Link href="/">
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>Home Page</span>
              </Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}