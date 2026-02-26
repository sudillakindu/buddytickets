'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleNavigation = useCallback((sectionId: string) => {
    setIsMobileMenuOpen(false);
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

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent flex justify-center pt-2 sm:pt-3 md:pt-4 px-2 sm:px-3 md:px-4 lg:px-6">
      <nav className="relative w-full max-w-7xl mx-auto">
        <div
          className={`flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-2.5 lg:px-6 lg:py-3 xl:px-6 xl:py-3 2xl:px-8 2xl:py-3.5 rounded-full border bg-white/70 border-[hsl(222.2,47.4%,11.2%)]/5 backdrop-blur-xl shadow-sm transition-all duration-500 ease-out w-full ${
            isLoaded ? 'translate-y-0 opacity-100 blur-0' : '-translate-y-full opacity-0 blur-sm'
          }`}
        >
          {/* Brand */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
              <div className={`flex items-center justify-center transition-transform group-hover:scale-105 ${STYLES.textPrimary}`}>
                <Image
                  src={LogoSrc}
                  alt="BuddyTickets Logo"
                  width={40}
                  height={40}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-8 lg:h-8 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9 object-contain drop-shadow-sm"
                />
              </div>
              <span className="font-special text-sm sm:text-base md:text-base lg:text-base xl:text-base 2xl:text-lg tracking-tight text-transparent bg-clip-text bg-[linear-gradient(to_right,hsl(222.2,47.4%,11.2%),hsl(270,70%,50%),hsl(222.2,47.4%,11.2%))] bg-[length:200%_auto] bg-[position:0_0] group-hover:bg-[position:100%_0] transition-all duration-500">
                BuddyTickets
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-5 2xl:gap-6">
            <div className="flex items-center gap-4 sm:gap-6 md:gap-6 lg:gap-8 xl:gap-8 2xl:gap-10">
              {NAV_LINKS.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => handleNavigation(item.sectionId)}
                  className={`font-secondary text-sm sm:text-sm md:text-sm lg:text-base xl:text-base transition-colors duration-300 relative group bg-transparent border-none cursor-pointer h-auto p-0 hover:bg-transparent ${STYLES.textPrimary} ${STYLES.hoverAccent}`}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-[hsl(270,70%,50%)]`} />
                </Button>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2 lg:gap-2">
              <div className="h-4 w-px bg-[hsl(222.2,47.4%,11.2%)]/10 mx-1.5 sm:mx-2 md:mx-2 lg:mx-2" />
              <div className="items-center gap-2 sm:gap-3 md:gap-3 lg:gap-3 text-xs sm:text-sm md:text-sm flex">
                <Link
                  href="/sign-in"
                  className="font-primary transition-colors bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] bg-clip-text text-transparent hover:opacity-80 text-sm sm:text-sm md:text-sm lg:text-base xl:text-base"
                >
                  Sign In
                </Link>
                <Button
                  asChild
                  className={`font-primary relative cursor-pointer overflow-hidden px-3 py-1.5 sm:px-4 sm:py-1.5 md:px-5 md:py-2 lg:px-5 lg:py-2 xl:px-5 xl:py-2 2xl:px-6 2xl:py-2.5 rounded-full text-xs sm:text-xs md:text-sm lg:text-sm xl:text-sm 2xl:text-sm text-white shadow-[0_10px_15px_-3px_hsl(222.2,47.4%,11.2%,0.2)] hover:shadow-xl transition-all duration-500 hover:scale-105 h-auto border-none ${STYLES.btnGradient} bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] group`}
                >
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className={`${STYLES.textPrimary} ${STYLES.hoverAccent} transition-colors p-1`}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={20} className="sm:w-6 sm:h-6" /> : <Menu size={20} className="sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white/95 backdrop-blur-xl border border-[hsl(222.2,47.4%,11.2%)]/10 rounded-2xl shadow-xl md:hidden flex flex-col gap-4">
            {NAV_LINKS.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.sectionId)}
                className={`font-secondary text-left text-sm sm:text-base ${STYLES.textPrimary} ${STYLES.hoverAccent} transition-colors w-full`}
              >
                {item.name}
              </button>
            ))}
            <div className="h-px w-full bg-[hsl(222.2,47.4%,11.2%)]/10" />
            <Link
              href="/sign-in"
              className={`font-primary text-sm sm:text-base ${STYLES.textPrimary} ${STYLES.hoverAccent} transition-colors`}
              onClick={closeMobileMenu}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              onClick={closeMobileMenu}
              className="font-primary text-center w-full bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] text-white py-2.5 rounded-full text-sm sm:text-base shadow-md"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}