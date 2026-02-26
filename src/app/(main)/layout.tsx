import type { ReactNode } from 'react';

import { Header } from '@/components/core/Header';
import { Footer } from '@/components/core/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MainLayoutProps {
  children: ReactNode;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      <main className="flex-1 w-full relative flex flex-col">
        {children}
      </main>
      <Footer />
    </>
  );
}