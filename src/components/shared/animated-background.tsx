'use client';

import { motion, MotionValue } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
  id: number;
  hue: number;
  left: string;
  top: string;
  duration: number;
  delay: number;
}

interface AnimatedBackgroundProps {
  springX: MotionValue<number>;
  springY: MotionValue<number>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const PARTICLES: Particle[] = Array.from({ length: 20 }, (_, i) => ({
  id:       i,
  hue:      i * 18,
  left:     `${(i * 37 + 13) % 100}%`,
  top:      `${(i * 53 + 7)  % 100}%`,
  duration: 3 + (i % 5) * 0.4,
  delay:    (i % 8) * 0.25,
}));

export const SPRING_CONFIG = { stiffness: 100, damping: 30 } as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function AnimatedBackground({ springX, springY }: AnimatedBackgroundProps) {
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