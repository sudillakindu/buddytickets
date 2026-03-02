// app/(main)/layout.tsx
import type { ReactNode } from "react";

import { getSession } from "@/lib/utils/session";
import MainShell from "./main-shell";

export interface MainLayoutProps {
  children: ReactNode;
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const user = await getSession();
  const whatsappNumber = process.env.WHATSAPP_NUMBER ?? "+94763356907";
  const supportEmail = process.env.SUPPORT_EMAIL ?? "info@buddytickets.lk";

  return (
    <MainShell
      user={user}
      whatsappNumber={whatsappNumber}
      supportEmail={supportEmail}
    >
      {children}
    </MainShell>
  );
}
