'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLink {
  name: string;
  sectionId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS: NavLink[] = [
  { name: 'Home', sectionId: 'home' },
  { name: 'Events', sectionId: 'events' },
];

const cn = {
  textPrimary: 'text-[hsl(222.2,47.4%,11.2%)]',
  textAccent: 'text-[hsl(270,70%,50%)]',
  hoverAccent: 'hover:text-[hsl(270,70%,50%)]',
  btnGradient:
    'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)]',
  gradientText:
    'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] bg-clip-text text-transparent',
} as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface NavButtonProps {
  name: string;
  onClick: () => void;
  className?: string;
}

const NavButton = ({ name, onClick, className = '' }: NavButtonProps) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className={`font-secondary text-base transition-colors duration-300 relative group bg-transparent border-none cursor-pointer h-auto p-0 hover:bg-transparent ${cn.textPrimary} ${cn.hoverAccent} ${className}`}
  >
    {name}
    <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-[hsl(270,70%,50%)]" />
  </Button>
);

interface BrandLogoProps {
  size?: 'sm' | 'md';
}

const BrandLogo = ({ size = 'md' }: BrandLogoProps) => {
  const imgSize = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  return (
    <Link href="/" className="flex items-center gap-2 group" aria-label="BuddyTickets Home">
      <div className={`flex items-center justify-center transition-transform group-hover:scale-105 ${cn.textPrimary}`}>
        <Image
          src={LogoSrc}
          alt="BuddyTickets Logo"
          width={40}
          height={40}
          className={`${imgSize} object-contain drop-shadow-sm`}
          priority
        />
      </div>
      <span
        className="font-special text-base tracking-tight text-transparent bg-clip-text
          bg-[linear-gradient(to_right,hsl(222.2,47.4%,11.2%),hsl(270,70%,50%),hsl(222.2,47.4%,11.2%))]
          bg-[length:200%_auto] bg-[position:0_0]
          group-hover:bg-[position:100%_0] transition-all duration-500"
      >
        BuddyTickets
      </span>
    </Link>
  );
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
}

const MobileMenu = ({ isOpen, onClose, onNavigate }: MobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 rounded-2xl border border-[hsl(222.2,47.4%,11.2%)]/5 bg-white/95 backdrop-blur-xl shadow-lg py-4 px-5 flex flex-col gap-3">
      {NAV_LINKS.map((item) => (
        <button
          key={item.name}
          onClick={() => {
            onNavigate(item.sectionId);
            onClose();
          }}
          className={`font-secondary text-base text-left transition-colors duration-300 py-1.5 ${cn.textPrimary} ${cn.hoverAccent}`}
        >
          {item.name}
        </button>
      ))}
      <div className="h-px bg-[hsl(222.2,47.4%,11.2%)]/10 my-1" />
      <Link
        href="/sign-in"
        onClick={onClose}
        className={`font-primary text-base py-1.5 transition-all duration-500
          text-transparent bg-clip-text
          bg-[linear-gradient(to_right,hsl(222.2,47.4%,11.2%),hsl(270,70%,50%),hsl(222.2,47.4%,11.2%))]
          bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]`}
      >
        Sign In
      </Link>
      <Button
        asChild
        className={`font-primary relative cursor-pointer overflow-hidden px-5 py-2 rounded-full text-sm text-white shadow-md hover:shadow-xl transition-all duration-500 h-auto border-none w-full ${cn.btnGradient} bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]`}
      >
        <Link href="/sign-up" onClick={onClose}>Get Started</Link>
      </Button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isMounted = useMounted();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = useCallback(
    (sectionId: string) => {
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
    },
    [pathname, router]
  );

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent flex justify-center pt-4 px-4 sm:px-6">
      <nav className="relative w-full max-w-7xl mx-auto" aria-label="Main navigation">
        {/* Pill Nav */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3 rounded-full border
            bg-white/70 border-[hsl(222.2,47.4%,11.2%)]/5 backdrop-blur-xl shadow-sm
            transition-all duration-500 ease-out w-full
            ${isMounted ? 'translate-y-0 opacity-100 blur-0' : '-translate-y-full opacity-0 blur-sm'}`}
        >
          {/* Brand */}
          <BrandLogo />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-5">
            <div className="flex items-center gap-8">
              {NAV_LINKS.map((item) => (
                <NavButton
                  key={item.name}
                  name={item.name}
                  onClick={() => handleNavigation(item.sectionId)}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="h-4 w-px bg-[hsl(222.2,47.4%,11.2%)]/10 mx-2" />
              <Link
                href="/sign-in"
                className={`font-primary text-base transition-all duration-500
                  text-transparent bg-clip-text
                  bg-[linear-gradient(to_right,hsl(222.2,47.4%,11.2%),hsl(270,70%,50%),hsl(222.2,47.4%,11.2%))]
                  bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]`}
              >
                Sign In
              </Link>
              <Button
                asChild
                className={`font-primary relative cursor-pointer overflow-hidden px-5 py-2 rounded-full text-sm text-white
                  shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.2)] hover:shadow-xl
                  transition-all duration-500 hover:scale-105 h-auto border-none
                  ${cn.btnGradient} bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]`}
              >
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`md:hidden p-2 rounded-full transition-colors ${cn.textPrimary} hover:bg-[hsl(222.2,47.4%,11.2%)]/5`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          onNavigate={handleNavigation}
        />
      </nav>
    </header>
  );
}