import type { ReactNode } from 'react';

import { getSession } from '@/lib/auth/session';

import MainShell from './main-shell';

interface MainLayoutProps {
  children: ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const user = await getSession();
  
  return (
    <MainShell user={user}>
      {children}
    </MainShell>
  );
}