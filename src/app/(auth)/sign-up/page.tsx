"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Mail, Lock, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';

const INPUT_CLASS = "font-secondary pl-[40px] h-[44px] rounded-xl border-[hsl(222.2,47.4%,11.2%)]/15 focus-visible:border-[hsl(270,70%,50%)] focus-visible:ring-[hsl(270,70%,50%)]/20 bg-[hsl(210,40%,98%)]";
const LABEL_CLASS = "font-primary text-[12px] font-semibold uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]";

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
});

export default function SignUpPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirm) {
            Toast('Password Mismatch', 'Your passwords do not match.', 'error');
            return;
        }
        Toast('Coming Soon', 'Sign-up is launching soon. Stay tuned!', 'warning');
    };

    return (
        <motion.div
            className="w-full max-w-[448px]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-[hsl(222.2,47.4%,11.2%)]/5 rounded-3xl px-[32px] py-[40px]">

                <motion.div className="mb-[32px] text-center" {...fadeUp(0.05)}>
                    <div className="inline-flex items-center justify-center w-[56px] h-[56px] rounded-2xl mb-[20px] shadow-lg"
                        style={{ background: 'linear-gradient(135deg, hsl(270 70% 50%), hsl(330 80% 60%))' }}>
                        <UserPlus className="w-[24px] h-[24px] text-white" />
                    </div>
                    <h1 className="font-special text-[30px] font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-[6px]">Create account</h1>
                    <p className="font-secondary text-[14px] text-[hsl(215.4,16.3%,46.9%)]">Join BuddyTicket and discover amazing events</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-[16px]">

                    <motion.div className="space-y-[6px]" {...fadeUp(0.1)}>
                        <Label htmlFor="name" className={LABEL_CLASS}>Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[hsl(215.4,16.3%,46.9%)]" />
                            <Input id="name" name="name" type="text" autoComplete="name" required
                                placeholder="Your full name" value={form.name} onChange={handleChange}
                                className={INPUT_CLASS} />
                        </div>
                    </motion.div>

                    <motion.div className="space-y-[6px]" {...fadeUp(0.13)}>
                        <Label htmlFor="email" className={LABEL_CLASS}>Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[hsl(215.4,16.3%,46.9%)]" />
                            <Input id="email" name="email" type="email" autoComplete="email" required
                                placeholder="you@example.com" value={form.email} onChange={handleChange}
                                className={INPUT_CLASS} />
                        </div>
                    </motion.div>

                    <motion.div className="space-y-[6px]" {...fadeUp(0.16)}>
                        <Label htmlFor="password" className={LABEL_CLASS}>Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[hsl(215.4,16.3%,46.9%)]" />
                            <Input id="password" name="password" type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password" required placeholder="Min. 8 characters"
                                value={form.password} onChange={handleChange}
                                className={`${INPUT_CLASS} pr-[44px]`} />
                            <button type="button" onClick={() => setShowPassword(v => !v)}
                                className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,47.4%,11.2%)] transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                {showPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                            </button>
                        </div>
                    </motion.div>

                    <motion.div className="space-y-[6px]" {...fadeUp(0.19)}>
                        <Label htmlFor="confirm" className={LABEL_CLASS}>Confirm Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-[14px] top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-[hsl(215.4,16.3%,46.9%)]" />
                            <Input id="confirm" name="confirm" type={showConfirm ? 'text' : 'password'}
                                autoComplete="new-password" required placeholder="Repeat password"
                                value={form.confirm} onChange={handleChange}
                                className={`${INPUT_CLASS} pr-[44px] ${form.confirm && form.password !== form.confirm ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20' : ''}`} />
                            <button type="button" onClick={() => setShowConfirm(v => !v)}
                                className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,47.4%,11.2%)] transition-colors"
                                aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                                {showConfirm ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                            </button>
                        </div>
                        {form.confirm && form.password !== form.confirm && (
                            <p className="font-secondary text-[12px] text-red-500 mt-[4px]">Passwords do not match</p>
                        )}
                    </motion.div>

                    <motion.p className="font-secondary text-[12px] text-[hsl(215.4,16.3%,46.9%)] leading-relaxed" {...fadeUp(0.22)}>
                        By creating an account you agree to our{' '}
                        <Link href="#" className="text-[hsl(270,70%,50%)] hover:underline">Terms of Service</Link>{' '}
                        and{' '}
                        <Link href="#" className="text-[hsl(270,70%,50%)] hover:underline">Privacy Policy</Link>.
                    </motion.p>

                    <motion.div {...fadeUp(0.25)} className="pt-[4px]">
                        <Button
                            type="submit"
                            className="font-primary w-full h-[44px] rounded-xl text-[14px] text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                            style={{
                                background: 'linear-gradient(to right, hsl(270 70% 50%), hsl(330 80% 60%), hsl(270 70% 50%))',
                                backgroundSize: '200% auto',
                            }}
                        >
                                <span className="flex items-center gap-[8px]">
                                    <UserPlus className="w-[16px] h-[16px]" />
                                    Create Account
                                </span>
                        </Button>
                    </motion.div>
                </form>

                <motion.p className="font-secondary text-center text-[14px] text-[hsl(215.4,16.3%,46.9%)] mt-[24px]" {...fadeUp(0.3)}>
                    Already have an account?{' '}
                    <Link href="/sign-in" className="font-semibold text-[hsl(270,70%,50%)] hover:text-[hsl(270,70%,40%)] transition-colors">
                        Sign in
                    </Link>
                </motion.p>
            </div>
        </motion.div>
    );
}
