"use client";

import React, { memo, type ReactNode } from "react";
import { Header } from "@/components/core/Header";
import { Footer } from "@/components/core/Footer";

export interface MainShellProps {
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

const MainShell: React.FC<MainShellProps> = memo(
  ({ user, whatsappNumber, supportEmail, children }) => {
    return (
      <>
        <Header user={user} />
        <main className="flex-1 w-full flex flex-col relative bg-transparent">
          {children}
        </main>
        <Footer whatsappNumber={whatsappNumber} supportEmail={supportEmail} />
      </>
    );
  },
);

MainShell.displayName = "MainShell";

export default MainShell;
