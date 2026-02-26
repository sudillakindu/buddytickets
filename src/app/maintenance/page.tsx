'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Settings, Clock, RefreshCw, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AnimatedBackground, SPRING_CONFIG } from '@/components/shared/animated-background';

// ─── Component ────────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(useTransform(mouseX, (v: number) => v * 0.05), SPRING_CONFIG);
  const springY = useSpring(useTransform(mouseY, (v: number) => v * 0.05), SPRING_CONFIG);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width  / 2);
    mouseY.set(e.clientY - rect.top  - rect.height / 2);
  }, [mouseX, mouseY]);

  const handleRefresh = useCallback(() => window.location.reload(), []);

  return (
    <section
      id="maintenance"
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden
        bg-gradient-to-b from-[hsl(210,40%,96.1%)] to-white p-4
        supports-[min-height:100dvh]:min-h-[100dvh]"
      onMouseMove={handleMouseMove}
      aria-label="Site maintenance"
    >
      <AnimatedBackground springX={springX} springY={springY} />

      {/* Floating orbs */}
      <motion.div
        className="hidden sm:block absolute top-1/4 left-4 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]"
        animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <motion.div
        className="hidden sm:block absolute bottom-1/4 right-4 w-3 h-3 rounded-full bg-gradient-to-r from-[hsl(210,100%,60%)] to-[hsl(180,70%,50%)]"
        animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />

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
          {/* Badge */}
          <motion.span
            className="font-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-4
              bg-white/50 backdrop-blur-sm border border-[hsl(222.2,47.4%,11.2%)]/20
              text-[hsl(222.2,47.4%,11.2%)] shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.1)]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          >
            <Clock className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
            System Update in Progress
          </motion.span>

          <h1 className="font-primary text-3xl sm:text-4xl font-bold text-gray-900 mt-4 tracking-tight">
            We&apos;ll be right back soon!
          </h1>

          <p className="font-secondary text-gray-500 mt-3 mb-8 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            BuddyTickets is currently undergoing scheduled maintenance to improve your experience.
            Please grab a cup of coffee and check back in a few minutes.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="font-primary relative group overflow-hidden inline-flex items-center justify-center gap-2
                h-12 w-full sm:w-auto px-8 text-sm rounded-xl border-2
                transition-all duration-300 shadow-sm hover:shadow-md hover:bg-gray-50
                text-[hsl(222.2,47.4%,11.2%)] border-[hsl(222.2,47.4%,11.2%)]/20"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
              <span>Refresh Page</span>
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