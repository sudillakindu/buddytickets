'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';
import { Button } from '@/components/ui/button';

// --- Constants & Styles ---
interface NavLink {
  name: string;
  sectionId: string;
}

const NAV_LINKS: NavLink[] = [
  { name: 'Home', sectionId: 'home' },
  { name: 'Events', sectionId: 'events' },
];

const STYLES = {
  textPrimary: 'text-[hsl(222.2,47.4%,11.2%)]',
  textAccent: 'text-[hsl(270,70%,50%)]',
  btnGradient: 'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)]',
  hoverAccent: 'hover:text-[hsl(270,70%,50%)]',
};

// --- Main Component ---
export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleNavigation = useCallback((sectionId: string) => {
    if (pathname !== '/') {
      router.push('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [pathname, router]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent flex justify-center pt-4 px-6">
      <nav className="relative w-full max-w-7xl mx-auto">
        <div
          className={`flex items-center justify-between px-6 py-3 rounded-full border bg-white/70 border-[hsl(222.2,47.4%,11.2%)]/5 backdrop-blur-xl shadow-sm transition-all duration-500 ease-out w-full ${isLoaded ? 'translate-y-0 opacity-100 blur-0' : '-translate-y-full opacity-0 blur-sm'
            }`}
        >
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className={`flex items-center justify-center transition-transform group-hover:scale-105 ${STYLES.textPrimary}`}>
                <Image
                  src={LogoSrc}
                  alt="BuddyTickets Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 object-contain drop-shadow-sm"
                />
              </div>
              <span className="font-special text-base tracking-tight text-transparent bg-clip-text bg-[linear-gradient(to_right,hsl(222.2,47.4%,11.2%),hsl(270,70%,50%),hsl(222.2,47.4%,11.2%))] bg-[length:200%_auto] bg-[position:0_0] group-hover:bg-[position:100%_0] transition-all duration-500">
                BuddyTickets
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-8">
              {NAV_LINKS.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => handleNavigation(item.sectionId)}
                  className={`font-secondary text-base transition-colors duration-300 relative group bg-transparent border-none cursor-pointer h-auto p-0 hover:bg-transparent ${STYLES.textPrimary} ${STYLES.hoverAccent}`}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-[hsl(270,70%,50%)]`} />
                </Button>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-px bg-[hsl(222.2,47.4%,11.2%)]/10 mx-2" />
              <div className="items-center gap-3 text-base flex">
                <Link
                  href="/sign-in"
                  className="font-primary transition-colors bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] bg-clip-text text-transparent hover:opacity-80 text-base"
                >
                  Sign In
                </Link>
                <Button
                  asChild
                  className={`font-primary relative cursor-pointer overflow-hidden px-5 py-2 rounded-full text-sm text-white shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.2)] hover:shadow-xl transition-all duration-500 hover:scale-105 h-auto border-none ${STYLES.btnGradient} bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] group`}
                >
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}