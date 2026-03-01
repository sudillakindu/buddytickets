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
  whatsappNumber: string;
  supportEmail: string;
  children: ReactNode;
}

export default function MainShell({ user, whatsappNumber, supportEmail, children }: Props) {
  return (
    <>
      <Header user={user} />
      {/* Global centered wrapper explicitly applied at the layout root */}
      <main className="flex-1 w-full flex flex-col relative bg-transparent">
        {children}
      </main>
      <Footer whatsappNumber={whatsappNumber} supportEmail={supportEmail} />
    </>
  );
}