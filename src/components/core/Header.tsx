'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, User, Ticket, LogOut } from 'lucide-react';

import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/actions/auth';

interface UserInfo {
  sub: string;
  name: string;
  email: string;
  role: string;
  imageUrl: string | null;
}

interface NavLink {
  name: string;
  sectionId: string;
}

const NAV_LINKS: NavLink[] = [
  { name: 'Home', sectionId: 'home' },
  { name: 'Events', sectionId: 'events' },
];

const cn = {
  textPrimary: 'text-[hsl(222.2,47.4%,11.2%)]',
  textAccent: 'text-[hsl(270,70%,50%)]',
  hoverAccent: 'hover:text-[hsl(270,70%,50%)]',
  btnGradient: 'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)]',
  gradientText: 'bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] bg-clip-text text-transparent',
} as const;

// Simple hook to prevent hydration mismatch for UI components dependent on browser APIs
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

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
        className="font-special text-base tracking-tight text-transparent bg-clip-text bg-[linear-gradient(to_right,hsl(222.2,47.4%,11.2%),hsl(270,70%,50%),hsl(222.2,47.4%,11.2%))] bg-[length:200%_auto] bg-[position:0_0] group-hover:bg-[position:100%_0] transition-all duration-500"
      >
        BuddyTickets
      </span>
    </Link>
  );
};

function UserAvatar({ user, size = 'md' }: { user: UserInfo; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  if (user.imageUrl) {
    return (
      <Image
        src={user.imageUrl}
        alt=""
        width={36}
        height={36}
        className={`${dim} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function Header({ user }: { user: UserInfo | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMounted = useMounted();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    window.location.href = '/';
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent flex justify-center pt-4 px-4 sm:px-6">
      <nav className="relative w-full max-w-7xl mx-auto" aria-label="Main navigation">
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3 rounded-full border bg-white/70 border-[hsl(222.2,47.4%,11.2%)]/5 backdrop-blur-xl shadow-sm transition-all duration-500 ease-out w-full ${isMounted ? 'translate-y-0 opacity-100 blur-0' : '-translate-y-full opacity-0 blur-sm'}`}
        >
          <BrandLogo />

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

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((p) => !p)}
                    className="flex items-center gap-2 group cursor-pointer"
                  >
                    <UserAvatar user={user} size="sm" />
                    <span className={`font-secondary text-sm ${cn.textPrimary}`}>
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[hsl(215.4,16.3%,46.9%)] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-5 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-[hsl(222.2,47.4%,11.2%)]/5 shadow-lg py-2 z-50">
                      <div className="px-4 py-3 min-w-0">
                        <p className={`font-primary text-sm font-semibold ${cn.textPrimary} truncate`}>
                          {user.name}
                        </p>
                        <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="h-px bg-[hsl(222.2,47.4%,11.2%)]/10 mb-1 mx-3" />
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-secondary ${cn.textPrimary} hover:text-[hsl(270,70%,50%)] hover:bg-[hsl(270,70%,97%)] transition-colors`}
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link
                        href="/tickets"
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm font-secondary ${cn.textPrimary} hover:text-[hsl(270,70%,50%)] hover:bg-[hsl(270,70%,97%)] transition-colors`}
                      >
                        <Ticket className="w-4 h-4" />
                        My Tickets
                      </Link>
                      <div className="h-px bg-[hsl(222.2,47.4%,11.2%)]/10 my-1 mx-3" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-secondary text-red-500 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className={`font-primary text-base transition-all duration-500 text-transparent bg-clip-text bg-[linear-gradient(to_right,hsl(222.2,47.4%,11.2%),hsl(270,70%,50%),hsl(222.2,47.4%,11.2%))] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]`}
                  >
                    Sign In
                  </Link>
                  <Button
                    asChild
                    className={`font-primary relative cursor-pointer overflow-hidden px-5 py-2 rounded-full text-sm text-white shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.2)] hover:shadow-xl transition-all duration-500 hover:scale-105 h-auto border-none ${cn.btnGradient} bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]`}
                  >
                    <Link href="/sign-up">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          <button
            className={`md:hidden p-2 rounded-full transition-colors ${cn.textPrimary} hover:bg-[hsl(222.2,47.4%,11.2%)]/5`}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 rounded-2xl border border-[hsl(222.2,47.4%,11.2%)]/5 bg-white/95 backdrop-blur-xl shadow-lg py-4 px-5 flex flex-col gap-3">
            {user && (
              <>
                <div className="flex items-center gap-3 py-2">
                  <UserAvatar user={user} />
                  <div className="min-w-0">
                    <p className={`font-primary text-sm font-medium ${cn.textPrimary} truncate`}>
                      {user.name}
                    </p>
                    <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] truncate max-w-[180px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="h-px bg-[hsl(222.2,47.4%,11.2%)]/10 my-1" />
              </>
            )}

            {NAV_LINKS.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  handleNavigation(item.sectionId);
                  setMobileMenuOpen(false);
                }}
                className={`font-secondary text-base text-left transition-colors duration-300 py-1.5 ${cn.textPrimary} ${cn.hoverAccent}`}
              >
                {item.name}
              </button>
            ))}

            <div className="h-px bg-[hsl(222.2,47.4%,11.2%)]/10 my-1" />

            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 font-secondary text-sm py-1.5 ${cn.textPrimary} ${cn.hoverAccent} transition-colors`}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
                <Link
                  href="/tickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 font-secondary text-sm py-1.5 ${cn.textPrimary} ${cn.hoverAccent} transition-colors`}
                >
                  <Ticket className="w-4 h-4" />
                  My Tickets
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 font-secondary text-sm py-1.5 text-red-500 hover:text-red-600 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-primary text-base py-1.5 transition-all duration-500 text-transparent bg-clip-text bg-[linear-gradient(to_right,hsl(222.2,47.4%,11.2%),hsl(270,70%,50%),hsl(222.2,47.4%,11.2%))] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]`}
                >
                  Sign In
                </Link>
                <Button
                  asChild
                  className={`font-primary relative cursor-pointer overflow-hidden px-5 py-2 rounded-full text-sm text-white shadow-md hover:shadow-xl transition-all duration-500 h-auto border-none w-full ${cn.btnGradient} bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]`}
                >
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}