'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <motion.div
        className="absolute top-[-10%] right-[-5%] w-[30vw] h-[30vw] min-w-[300px] min-h-[300px] rounded-full blur-[100px] opacity-30 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] min-w-[250px] min-h-[250px] rounded-full blur-[100px] opacity-30 bg-gradient-to-r from-[hsl(210,100%,60%)] to-[hsl(180,70%,50%)]"
        animate={{ scale: [1.2, 1, 1.2], rotate: [45, 0, 45] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(to right, #80808012 1px, transparent 1px), linear-gradient(to bottom, #80808012 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] w-full bg-gradient-to-b from-[hsl(210,40%,96.1%)] to-white">
      <AuthBackground />
      {/* Container sizing logic pushed strictly into individual auth pages */}
      {children}
    </div>
  );
}