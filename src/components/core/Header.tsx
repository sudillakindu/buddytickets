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

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

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
        <header className="fixed top-0 left-0 right-0 z-50 bg-transparent flex justify-center pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4">
            <nav className="relative w-full max-w-7xl mx-auto">
                <div
                    className={`flex items-center justify-between px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 rounded-full border transition-all duration-500 ease-out w-full ${navStyle.container} ${isLoaded ? 'translate-y-0 opacity-100 blur-0' : '-translate-y-full opacity-0 blur-sm'}`}
                >
                    {/* Logo */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 group"
                        onClick={() => setIsMobileMenuOpen(false)}
                        onMouseEnter={() => setIsLogoHovered(true)}
                        onMouseLeave={() => setIsLogoHovered(false)}
                    >
                        <div className={`flex items-center justify-center transition-transform group-hover:scale-105 ${navStyle.text}`}>
                            <Image
                                src={Logo}
                                alt="BuddyTickets Logo"
                                width={40}
                                height={40}
                                className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain drop-shadow-sm"
                            />
                        </div>
                        <span
                            className="font-special text-sm sm:text-base md:text-lg tracking-tight hidden min-[360px]:block"
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

                    <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
                        {/* Desktop nav links */}
                        <div className="hidden md:flex items-center gap-6 lg:gap-8">
                            {NAV_LINKS.map((item) => (
                                <Button
                                    key={item.name}
                                    variant="ghost"
                                    onClick={() => handleNavigation(item.href, item.sectionId)}
                                    className={`font-secondary text-sm lg:text-base transition-colors duration-300 relative group bg-transparent border-none cursor-pointer h-auto p-0 hover:bg-transparent ${navStyle.text} ${navStyle.hover}`}
                                >
                                    {item.name}
                                    <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${navStyle.underline}`} />
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="h-4 w-px bg-[hsl(222.2,47.4%,11.2%)]/10 hidden md:block mr-2 lg:mr-3" />

                            {/* Mobile menu toggle */}
                            <div className="md:hidden flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className={`p-1.5 sm:p-2 ${navStyle.text} border-none hover:bg-transparent`}
                                    aria-label="Toggle menu"
                                >
                                    {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
                                </Button>
                            </div>

                            {/* Desktop auth buttons */}
                            <div className="items-center gap-3 lg:gap-4 text-sm hidden md:flex">
                                <button
                                    onClick={() => Toast('Feature Coming Soon', 'Sign in is launching soon. Stay tuned!', 'warning')}
                                    className="font-primary transition-colors bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] bg-clip-text text-transparent hover:opacity-80 text-sm lg:text-base cursor-pointer"
                                >
                                    Sign In
                                </button>
                                <Button
                                    className="font-primary relative cursor-pointer overflow-hidden px-4 lg:px-6 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 h-auto border-none"
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

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className={`absolute top-full left-2 right-2 sm:left-4 sm:right-4 mt-2 p-3 sm:p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex flex-col gap-1.5 sm:gap-2 z-40 ${navStyle.container}`}>
                        {NAV_LINKS.map((item) => (
                            <Button
                                key={item.name}
                                variant="ghost"
                                onClick={() => handleNavigation(item.href, item.sectionId)}
                                className={`font-secondary py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl border-none hover:bg-black/5 transition-colors text-left justify-start h-auto w-full text-sm sm:text-base ${navStyle.text}`}
                            >
                                {item.name}
                            </Button>
                        ))}

                        <div className="h-px w-full bg-gray-200/50 my-1 sm:my-2" />

                        <div className="flex flex-col gap-2 mt-1 sm:mt-2">
                            <Button
                                variant="outline"
                                className="w-full justify-center h-auto py-2.5 sm:py-3 rounded-xl border-gray-200 hover:bg-black/5"
                                onClick={() => { setIsMobileMenuOpen(false); Toast('Feature Coming Soon', 'Sign in is launching soon. Stay tuned!', 'warning'); }}
                            >
                                <span className="font-primary text-sm sm:text-base bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] bg-clip-text text-transparent">
                                    Sign In
                                </span>
                            </Button>
                            <Button
                                className="font-primary w-full relative overflow-hidden px-4 py-2.5 sm:py-3 border-none rounded-xl text-sm sm:text-base text-white shadow-lg transition-all"
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