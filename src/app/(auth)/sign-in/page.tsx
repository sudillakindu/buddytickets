"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
});

const SHARED_CLASSES = {
    input: "font-secondary pl-10 h-11 rounded-xl border-[hsl(222.2,47.4%,11.2%)]/15 focus-visible:border-[hsl(270,70%,50%)] focus-visible:ring-[hsl(270,70%,50%)]/20 bg-[hsl(210,40%,98%)] text-sm w-full",
    label: "font-primary text-xs font-semibold uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]",
    icon: "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215.4,16.3%,46.9%)]",
    buttonGradient: "linear-gradient(to right, hsl(222.2 47.4% 11.2%), hsl(270 70% 50%), hsl(222.2 47.4% 11.2%))"
};

export default function SignInPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        Toast('Coming Soon', 'Authentication is launching soon. Stay tuned!', 'warning');
    };

    return (
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-[hsl(222.2,47.4%,11.2%)]/5 rounded-3xl px-6 py-8 sm:px-8 sm:py-10">
                <motion.div className="mb-8 text-center" {...fadeUp(0.05)}>
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-lg bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                        <LogIn className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="font-special text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-1.5">Welcome back</h1>
                    <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">Sign in to your BuddyTicket account</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <motion.div className="space-y-1.5" {...fadeUp(0.1)}>
                        <Label htmlFor="email" className={SHARED_CLASSES.label}>Email Address</Label>
                        <div className="relative">
                            <Mail className={SHARED_CLASSES.icon} />
                            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" value={form.email} onChange={handleChange} className={SHARED_CLASSES.input} />
                        </div>
                    </motion.div>

                    <motion.div className="space-y-1.5" {...fadeUp(0.15)}>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className={SHARED_CLASSES.label}>Password</Label>
                            <Link href="/forget-password" className="font-secondary text-xs text-[hsl(270,70%,50%)] hover:text-[hsl(270,70%,40%)] transition-colors">Forgot password?</Link>
                        </div>
                        <div className="relative">
                            <Lock className={SHARED_CLASSES.icon} />
                            <Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="••••••••" value={form.password} onChange={handleChange} className={`${SHARED_CLASSES.input} pr-11`} />
                            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,47.4%,11.2%)] transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </motion.div>

                    <motion.div {...fadeUp(0.2)} className="pt-1">
                        <Button type="submit" className="font-primary w-full h-11 rounded-xl text-sm text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-none" style={{ background: SHARED_CLASSES.buttonGradient, backgroundSize: '200% auto' }}>
                            <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Sign In</span>
                        </Button>
                    </motion.div>
                </form>

                <motion.div className="flex items-center gap-3 my-6" {...fadeUp(0.25)}>
                    <div className="flex-1 h-px bg-[hsl(222.2,47.4%,11.2%)]/10" />
                    <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">or</span>
                    <div className="flex-1 h-px bg-[hsl(222.2,47.4%,11.2%)]/10" />
                </motion.div>

                <motion.div {...fadeUp(0.3)}>
                    <Button type="button" variant="outline" onClick={() => Toast('Coming Soon', 'Google sign-in is launching soon!', 'default')} className="font-primary w-full h-11 rounded-xl text-sm border-[hsl(222.2,47.4%,11.2%)]/15 text-[hsl(222.2,47.4%,11.2%)] bg-white hover:bg-[hsl(210,40%,98%)] transition-colors flex items-center justify-center gap-2.5">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </Button>
                </motion.div>

                <motion.p className="font-secondary text-center text-sm text-[hsl(215.4,16.3%,46.9%)] mt-6" {...fadeUp(0.35)}>
                    Don&apos;t have an account? <Link href="/sign-up" className="font-semibold text-[hsl(270,70%,50%)] hover:text-[hsl(270,70%,40%)] transition-colors">Sign up free</Link>
                </motion.p>
            </div>
        </motion.div>
    );
}