"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
});

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        Toast('Email Sent', 'Check your inbox for the reset link.', 'success');
    };

    return (
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-[hsl(222.2,47.4%,11.2%)]/5 rounded-3xl px-6 py-8 sm:px-8 sm:py-10">
                <AnimatePresence mode="wait">
                    {!sent ? (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <motion.div className="mb-8 text-center" {...fadeUp(0.05)}>
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-lg bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                                    <KeyRound className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="font-special text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-1.5">Forgot password?</h1>
                                <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">Enter your email and we&apos;ll send you a reset link.</p>
                            </motion.div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <motion.div className="space-y-1.5" {...fadeUp(0.1)}>
                                    <Label htmlFor="email" className="font-primary text-xs font-semibold uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215.4,16.3%,46.9%)]" />
                                        <Input id="email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="font-secondary pl-10 h-11 rounded-xl border-[hsl(222.2,47.4%,11.2%)]/15 focus-visible:border-[hsl(270,70%,50%)] focus-visible:ring-[hsl(270,70%,50%)]/20 bg-[hsl(210,40%,98%)] text-sm" />
                                    </div>
                                </motion.div>

                                <motion.div {...fadeUp(0.15)} className="pt-1">
                                    <Button type="submit" className="font-primary w-full h-11 rounded-xl text-sm text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-none" style={{ background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))', backgroundSize: '200% auto' }}>
                                        Send Reset Link
                                    </Button>
                                </motion.div>
                            </form>

                            <motion.div className="mt-6 text-center" {...fadeUp(0.2)}>
                                <Link href="/sign-in" className="font-secondary inline-flex items-center gap-1.5 text-sm text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] transition-colors">
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                                </Link>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div key="success" className="text-center py-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-6">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="font-special text-2xl font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-2">Check your inbox</h2>
                            <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] mb-2">We&apos;ve sent a password reset link to</p>
                            <p className="font-primary text-sm font-semibold text-[hsl(270,70%,50%)] mb-8 break-all">{email}</p>
                            <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] mb-6">
                                Didn&apos;t receive it? Check your spam folder or <button onClick={() => setSent(false)} className="text-[hsl(270,70%,50%)] hover:underline">try again</button>.
                            </p>
                            <Link href="/sign-in" className="block w-full">
                                <Button className="font-primary w-full sm:w-auto h-11 px-8 rounded-xl text-sm text-white shadow-lg transition-all duration-300 hover:scale-[1.02] border-none" style={{ background: 'linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%))' }}>
                                    Back to Sign In
                                </Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}