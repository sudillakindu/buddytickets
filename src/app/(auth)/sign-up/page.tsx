'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Mail, Lock, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';

const ANIMATION_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      Toast('Password Mismatch', 'Your passwords do not match.', 'error');
      return;
    }
    Toast('Coming Soon', 'Sign-up is launching soon. Stay tuned!', 'warning');
  };

  const isPasswordMismatch = form.confirm && form.password !== form.confirm;

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-[hsl(222.2,47.4%,11.2%)]/5 rounded-3xl p-10">
        <motion.div
          className="mb-8 text-center"
          variants={ANIMATION_VARIANTS}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-lg bg-gradient-to-br from-[hsl(270,70%,50%)] to-[hsl(330,80%,60%)]">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-special text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-1.5">
            Create account
          </h1>
          <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
            Join BuddyTicket and discover amazing events
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            className="space-y-1.5"
            variants={ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Label
              htmlFor="name"
              className="font-primary text-xs font-semibold uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]"
            >
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215.4,16.3%,46.9%)]" />
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                className="font-secondary pl-10 h-11 rounded-xl border-[hsl(222.2,47.4%,11.2%)]/15 focus-visible:border-[hsl(270,70%,50%)] focus-visible:ring-[hsl(270,70%,50%)]/20 bg-[hsl(210,40%,98%)]"
              />
            </div>
          </motion.div>

          <motion.div
            className="space-y-1.5"
            variants={ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.13 }}
          >
            <Label
              htmlFor="email"
              className="font-primary text-xs font-semibold uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]"
            >
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215.4,16.3%,46.9%)]" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="font-secondary pl-10 h-11 rounded-xl border-[hsl(222.2,47.4%,11.2%)]/15 focus-visible:border-[hsl(270,70%,50%)] focus-visible:ring-[hsl(270,70%,50%)]/20 bg-[hsl(210,40%,98%)]"
              />
            </div>
          </motion.div>

          <motion.div
            className="space-y-1.5"
            variants={ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.16 }}
          >
            <Label
              htmlFor="password"
              className="font-primary text-xs font-semibold uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215.4,16.3%,46.9%)]" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                className="font-secondary pl-10 pr-11 h-11 rounded-xl border-[hsl(222.2,47.4%,11.2%)]/15 focus-visible:border-[hsl(270,70%,50%)] focus-visible:ring-[hsl(270,70%,50%)]/20 bg-[hsl(210,40%,98%)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,47.4%,11.2%)] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          <motion.div
            className="space-y-1.5"
            variants={ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.19 }}
          >
            <Label
              htmlFor="confirm"
              className="font-primary text-xs font-semibold uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215.4,16.3%,46.9%)]" />
              <Input
                id="confirm"
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Repeat password"
                value={form.confirm}
                onChange={handleChange}
                className={`font-secondary pl-10 pr-11 h-11 rounded-xl border-[hsl(222.2,47.4%,11.2%)]/15 focus-visible:border-[hsl(270,70%,50%)] focus-visible:ring-[hsl(270,70%,50%)]/20 bg-[hsl(210,40%,98%)] ${
                  isPasswordMismatch ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/20' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(222.2,47.4%,11.2%)] transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isPasswordMismatch && (
              <p className="font-secondary text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </motion.div>

          <motion.p
            className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] leading-relaxed"
            variants={ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.22 }}
          >
            By creating an account you agree to our{' '}
            <Link href="#" className="text-[hsl(270,70%,50%)] hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-[hsl(270,70%,50%)] hover:underline">
              Privacy Policy
            </Link>
            .
          </motion.p>

          <motion.div
            className="pt-1"
            variants={ANIMATION_VARIANTS}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Button
              type="submit"
              className="font-primary w-full h-11 rounded-xl text-sm text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-gradient-to-r from-[hsl(270,70%,50%)] via-[hsl(330,80%,60%)] to-[hsl(270,70%,50%)] bg-[length:200%_auto]"
            >
              <span className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Create Account
              </span>
            </Button>
          </motion.div>
        </form>

        <motion.p
          className="font-secondary text-center text-sm text-[hsl(215.4,16.3%,46.9%)] mt-6"
          variants={ANIMATION_VARIANTS}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-semibold text-[hsl(270,70%,50%)] hover:text-[hsl(270,70%,40%)] transition-colors"
          >
            Sign in
          </Link>
        </motion.p>
      </div>
    </motion.div>
  );
}