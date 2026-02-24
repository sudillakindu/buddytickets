"use client";

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import Logo from '@/app/assets/images/logo/upscale_media_logo.png';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';

type NavStyle = {
    container: string;
    text: string;
    hover: string;
    underline: string;
};

const NAV_LINKS = [
    { name: 'Home', sectionId: 'home', href: '/' },
    { name: 'Events', sectionId: 'events', href: '/events' },
];

export function Header() {
    const pathname = usePathname();

    const [isLoaded, setIsLoaded] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isGetStartedHovered, setIsGetStartedHovered] = useState(false);
    const [isLogoHovered, setIsLogoHovered] = useState(false);
    const [isSignInHovered, setIsSignInHovered] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Handle scroll or external routing navigation logic
    const handleNavigation = useCallback((href: string, sectionId: string) => {
        setIsMobileMenuOpen(false);
        if (pathname !== '/') {
            window.location.href = href;
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }, [pathname]);

    const navStyle: NavStyle = {
        container: 'bg-white/70 border-[hsl(222.2,47.4%,11.2%)]/5 backdrop-blur-xl shadow-sm',
        text: 'text-[hsl(222.2,47.4%,11.2%)]',
        hover: 'hover:text-[hsl(270,70%,50%)]',
        underline: 'bg-[hsl(270,70%,50%)]',
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-transparent flex justify-center pt-2 sm:pt-3 lg:pt-4 px-3 sm:px-4 lg:px-6">
            <nav className="relative w-full max-w-7xl mx-auto">
                <div
                    className={`flex items-center justify-between px-4 sm:px-6 lg:px-8 py-1.5 sm:py-2 lg:py-2.5 rounded-full border transition-all duration-500 ease-out w-full ${navStyle.container} ${isLoaded ? 'translate-y-0 opacity-100 blur-0' : '-translate-y-full opacity-0 blur-sm'}`}
                >
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-1.5 lg:gap-2 group"
                        onClick={() => setIsMobileMenuOpen(false)}
                        onMouseEnter={() => setIsLogoHovered(true)}
                        onMouseLeave={() => setIsLogoHovered(false)}
                    >
                        <div className={`flex items-center justify-center transition-transform group-hover:scale-105 ${navStyle.text}`}>
                            <Image
                                src={Logo}
                                alt="BuddyTickets Logo"
                                width={48}
                                height={48}
                                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 object-contain drop-shadow-sm"
                            />
                        </div>
                        <span
                            className="font-special text-[11px] sm:text-xs lg:text-sm tracking-tight hidden min-[360px]:block"
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

                    <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
                        <div className="hidden sm:flex items-center gap-4 lg:gap-8">
                            {NAV_LINKS.map((item) => (
                                <Button
                                    key={item.name}
                                    variant="ghost"
                                    onClick={() => handleNavigation(item.href, item.sectionId)}
                                    className={`font-secondary text-[11px] sm:text-xs lg:text-sm transition-colors duration-300 relative group bg-transparent border-none cursor-pointer h-auto p-0 hover:bg-transparent ${navStyle.text} ${navStyle.hover}`}
                                >
                                    {item.name}
                                    <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${navStyle.underline}`} />
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-4">
                            <div className="h-3 sm:h-4 lg:h-5 w-px bg-[hsl(222.2,47.4%,11.2%)]/10 hidden sm:block mr-1 lg:mr-3" />

                            <div className="sm:hidden flex items-center justify-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className={`p-1 sm:p-1.5 lg:p-2 ${navStyle.text} border-none hover:bg-transparent flex items-center justify-center`}
                                    aria-label="Toggle menu"
                                >
                                    {isMobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />}
                                </Button>
                            </div>

                            <div className="items-center justify-center gap-2 lg:gap-4 hidden sm:flex">
                                <button
                                    onClick={() => Toast('Feature Coming Soon', 'Sign in is launching soon. Stay tuned!', 'warning')}
                                    onMouseEnter={() => setIsSignInHovered(true)}
                                    onMouseLeave={() => setIsSignInHovered(false)}
                                    className="font-primary text-[11px] sm:text-xs lg:text-sm cursor-pointer bg-clip-text text-transparent"
                                    style={{
                                        backgroundImage: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))',
                                        backgroundSize: '200% auto',
                                        backgroundPosition: isSignInHovered ? '100% 0' : '0 0',
                                        transition: 'background-position 0.5s ease',
                                    }}
                                >
                                    Sign In
                                </button>
                                <Button
                                    className="font-primary relative cursor-pointer overflow-hidden px-2.5 sm:px-4 lg:px-5 py-1 sm:py-1.5 lg:py-2 rounded-full text-[10px] sm:text-[11px] lg:text-xs text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 h-auto border-none flex items-center justify-center"
                                    onMouseEnter={() => setIsGetStartedHovered(true)}
                                    onMouseLeave={() => setIsGetStartedHovered(false)}
                                    onClick={() => Toast('Feature Coming Soon', 'Account creation is launching soon. Stay tuned!', 'warning')}
                                    style={{
                                        background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))',
                                        backgroundSize: '200% auto',
                                        backgroundPosition: isGetStartedHovered ? '100% 0' : '0 0',
                                        transition: 'background-position 0.5s ease',
                                        boxShadow: '0 10px 15px -3px hsl(222.2 47.4% 11.2% / 0.2)',
                                    }}
                                >
                                    Get Started
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className={`absolute top-full left-2 right-2 sm:left-4 sm:right-4 lg:left-6 lg:right-6 mt-2 p-3 sm:p-4 lg:p-6 rounded-2xl border backdrop-blur-xl shadow-2xl flex flex-col justify-center gap-1.5 sm:gap-2 lg:gap-3 z-40 ${navStyle.container}`}>
                        {NAV_LINKS.map((item) => (
                            <Button
                                key={item.name}
                                variant="ghost"
                                onClick={() => handleNavigation(item.href, item.sectionId)}
                                className={`font-secondary py-2.5 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-5 rounded-xl border-none hover:bg-black/5 transition-colors text-left justify-start h-auto w-full text-xs sm:text-sm lg:text-base flex items-center ${navStyle.text}`}
                            >
                                {item.name}
                            </Button>
                        ))}

                        <div className="h-px w-full bg-gray-200/50 my-1 sm:my-2 lg:my-3" />

                        <div className="flex flex-col justify-center gap-2 sm:gap-3 lg:gap-4 mt-1 sm:mt-2 lg:mt-3">
                            <Button
                                variant="outline"
                                className="w-full justify-center h-auto py-2.5 sm:py-3 lg:py-4 rounded-xl border-gray-200 hover:bg-black/5 flex items-center"
                                onClick={() => { setIsMobileMenuOpen(false); Toast('Feature Coming Soon', 'Sign in is launching soon. Stay tuned!', 'warning'); }}
                            >
                                <span className="font-primary text-xs sm:text-sm lg:text-base bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] bg-clip-text text-transparent">
                                    Sign In
                                </span>
                            </Button>
                            <Button
                                className="font-primary w-full relative overflow-hidden px-4 py-2.5 sm:py-3 lg:py-4 border-none rounded-xl text-xs sm:text-sm lg:text-base text-white shadow-lg transition-all flex items-center justify-center"
                                onClick={() => { setIsMobileMenuOpen(false); Toast('Feature Coming Soon', 'Account creation is launching soon. Stay tuned!', 'warning'); }}
                                style={{ background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%))' }}
                            >
                                Get Started
                            </Button>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}