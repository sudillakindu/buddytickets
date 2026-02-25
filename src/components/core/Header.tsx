'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';
import { Button } from '@/components/ui/button';

type NavStyle = {
  container: string;
  text: string;
  hover: string;
  underline: string;
};

const NAV_LINKS = [
  { name: 'Home', sectionId: 'home' },
  { name: 'Events', sectionId: 'events' },
];

const NAV_STYLE: NavStyle = {
  container: 'bg-white/70 border-[hsl(222.2,47.4%,11.2%)]/5 backdrop-blur-xl shadow-sm',
  text: 'text-[hsl(222.2,47.4%,11.2%)]',
  hover: 'hover:text-[hsl(270,70%,50%)]',
  underline: 'bg-[hsl(270,70%,50%)]',
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isGetStartedHovered, setIsGetStartedHovered] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleNavigation = (sectionId: string) => {
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
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent flex justify-center pt-3 px-3">
      <nav className="relative w-full max-w-7xl mx-auto">
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-full border transition-all duration-500 ease-out w-full ${NAV_STYLE.container} ${isLoaded ? 'translate-y-0 opacity-100 blur-0' : '-translate-y-full opacity-0 blur-sm'}`}
        >
            <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 group"
              onMouseEnter={() => setIsLogoHovered(true)}
              onMouseLeave={() => setIsLogoHovered(false)}
            >
              <div className={`flex items-center justify-center transition-transform group-hover:scale-105 ${NAV_STYLE.text}`}>
                <Image
                  src={LogoSrc}
                  alt="BuddyTickets Logo"
                  width={40}
                  height={40}
                  className="w-7 h-7 object-contain drop-shadow-sm"
                />
              </div>
              <span
                className="font-special text-sm tracking-tight"
                style={{
                  backgroundImage: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))',
                  backgroundSize: '200% auto',
                  backgroundPosition: isLogoHovered ? '100% 0' : '0 0',
                  transition: 'background-position 0.5s ease',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                BuddyTickets
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-6">
              {NAV_LINKS.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  onClick={() => handleNavigation(item.sectionId)}
                  className={`font-secondary text-sm transition-colors duration-300 relative group bg-transparent border-none cursor-pointer h-auto p-0 hover:bg-transparent ${NAV_STYLE.text} ${NAV_STYLE.hover}`}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${NAV_STYLE.underline}`} />
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="h-4 w-px bg-[hsl(222.2,47.4%,11.2%)]/10 mr-2" />

              <div className="items-center gap-3 text-sm flex">
                  <Link
                    href="/sign-in"
                    className="font-primary transition-colors bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] bg-clip-text text-transparent hover:opacity-80 text-sm"
                  >
                    Sign In
                  </Link>
                  <Button
                    asChild
                    className="font-primary relative cursor-target overflow-hidden px-4 py-1.5 rounded-full text-xs text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 h-auto border-none"
                    onMouseEnter={() => setIsGetStartedHovered(true)}
                    onMouseLeave={() => setIsGetStartedHovered(false)}
                    style={{
                      background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))',
                      backgroundSize: '200% auto',
                      backgroundPosition: isGetStartedHovered ? '100% 0' : '0 0',
                      transition: 'background-position 0.5s ease',
                      boxShadow: '0 10px 15px -3px hsl(222.2 47.4% 11.2% / 0.2)',
                    }}
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