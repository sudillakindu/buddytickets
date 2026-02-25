"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MailCheck, ArrowLeft, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';

const OTP_LENGTH = 6;

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
});

export default function VerifyEmailPage() {
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [resendTimer, setResendTimer] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (resendTimer <= 0) return;
        const t = setInterval(() => setResendTimer(v => v - 1), 1000);
        return () => clearInterval(t);
    }, [resendTimer]);

    const handleChange = (i: number, val: string) => {
        const char = val.replace(/\D/g, '').slice(-1);
        const next = [...otp];
        next[i] = char;
        setOtp(next);
        if (char && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) {
            inputRefs.current[i - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
        const next = [...otp];
        pasted.split('').forEach((c, idx) => { next[idx] = c; });
        setOtp(next);
        const last = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[last]?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < OTP_LENGTH) {
            Toast('Incomplete Code', 'Please enter all 6 digits.', 'error');
            return;
        }
        Toast('Coming Soon', 'Email verification is launching soon.', 'warning');
    };

    const handleResend = () => {
        if (resendTimer > 0) return;
        setResendTimer(60);
        Toast('Code Resent', 'A new verification code has been sent.', 'success');
    };

    const filled = otp.every(v => v !== '');

    return (
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-[hsl(222.2,47.4%,11.2%)]/5 rounded-3xl px-6 py-8 sm:px-8 sm:py-10">
                <motion.div className="mb-8 text-center" {...fadeUp(0.05)}>
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-lg bg-gradient-to-br from-[hsl(270,70%,50%)] to-[hsl(330,80%,60%)]">
                        <MailCheck className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="font-special text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-1.5">Verify your email</h1>
                    <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
                        We sent a 6-digit code to your email address. Enter it below to verify your account.
                    </p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <motion.div {...fadeUp(0.1)}>
                        <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                            {otp.map((digit, i) => (
                                <Input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    className="font-primary w-10 sm:w-11 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border-[hsl(222.2,47.4%,11.2%)]/20 focus-visible:border-[hsl(270,70%,50%)] focus-visible:ring-[hsl(270,70%,50%)]/20 bg-[hsl(210,40%,98%)] text-[hsl(222.2,47.4%,11.2%)] transition-all duration-200 caret-transparent px-0"
                                    style={{
                                        borderWidth: digit ? '2px' : '1.5px',
                                        borderColor: digit ? 'hsl(270 70% 50% / 0.5)' : undefined,
                                    }}
                                    aria-label={`OTP digit ${i + 1}`}
                                />
                            ))}
                        </div>
                    </motion.div>

                    <motion.div {...fadeUp(0.15)}>
                        <Button type="submit" disabled={!filled} className="font-primary w-full h-11 rounded-xl text-sm text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-60 disabled:scale-100 border-none" style={{ background: 'linear-gradient(to right, hsl(270 70% 50%), hsl(330 80% 60%), hsl(270 70% 50%))', backgroundSize: '200% auto' }}>
                            <span className="flex items-center gap-2"><MailCheck className="w-4 h-4" /> Verify Email</span>
                        </Button>
                    </motion.div>
                </form>

                <motion.div className="mt-5 text-center" {...fadeUp(0.2)}>
                    <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)] flex items-center justify-center gap-1 flex-wrap">
                        Didn&apos;t receive the code?
                        <button type="button" onClick={handleResend} disabled={resendTimer > 0} className="font-semibold text-[hsl(270,70%,50%)] disabled:opacity-40 hover:text-[hsl(270,70%,40%)] transition-colors inline-flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                        </button>
                    </p>
                </motion.div>

                <motion.div className="mt-4 text-center" {...fadeUp(0.25)}>
                    <Link href="/sign-in" className="font-secondary inline-flex items-center gap-1.5 text-sm text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
}