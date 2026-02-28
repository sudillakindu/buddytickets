'use client';

import type { ReactNode } from 'react';

import { Header } from '@/components/core/Header';
import { Footer } from '@/components/core/Footer';

interface Props {
  user: {
    sub: string;
    name: string;
    email: string;
    role: string;
    imageUrl: string | null;
  } | null;
  children: ReactNode;
}

export default function MainShell({ user, children }: Props) {
  return (
    <>
      <Header user={user} />
      <main className="flex-1 w-full relative flex flex-col">
        {children}
      </main>
      <Footer />
    </>
  );
}
