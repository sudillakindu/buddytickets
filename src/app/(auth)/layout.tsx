"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

import Logo from '@/app/assets/images/logo/upscale_media_logo.png';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] bg-gradient-to-br from-[hsl(210,40%,96.1%)] via-white to-[hsl(270,70%,97%)] flex flex-col">
            {/* Background blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
                    style={{ background: 'linear-gradient(to right, hsl(270 70% 50%), hsl(330 80% 60%))' }} />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
                    style={{ background: 'linear-gradient(to right, hsl(210 100% 60%), hsl(270 70% 50%))' }} />
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(to right, #80808008 1px, transparent 1px), linear-gradient(to bottom, #80808008 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }} />
            </div>

            {/* Top nav */}
            <header className="w-full px-6 py-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label="BuddyTickets home">
                        <Image src={Logo} alt="BuddyTickets" width={32} height={32} className="rounded-lg" />
                        <span className="font-special text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)] group-hover:opacity-80 transition-opacity">
                            BuddyTicket.lk
                        </span>
                    </Link>
                </motion.div>
            </header>

            {/* Page content */}
            <main className="flex-1 flex items-center justify-center px-4 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="text-center py-5 px-4">
                <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                    © {new Date().getFullYear()} BuddyTicket.lk — All rights reserved.
                </p>
            </footer>
        </div>
    );
}
