'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'email' | 'resetPassword';

// ─── Shared Auth Primitives (co-located) ──────────────────────────────────────

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10 flex flex-col items-center overflow-hidden my-auto bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.15),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.05)]">
      {children}
    </div>
  );
}

function InputIcon({ icon: Icon, isFocused }: { icon: LucideIcon; isFocused: boolean }) {
  return (
    <Icon
      className={[
        'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none',
        isFocused ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]',
      ].join(' ')}
      aria-hidden="true"
    />
  );
}

function inputCls(isFocused: boolean, extra = '') {
  return [
    'font-secondary pl-11 py-3 rounded-xl h-auto text-sm transition-all duration-200',
    'bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)]',
    'placeholder:text-[hsl(215.4,16.3%,46.9%)]',
    'focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)]',
    isFocused ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]',
    extra,
  ].join(' ');
}

function SubmitButton({ label }: { label: string }) {
  return (
    <Button
      type="submit"
      className="w-full mt-2 h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]"
    >
      {label}
    </Button>
  );
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-[hsl(215.4,16.3%,46.9%)] transition-colors duration-200"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </Button>
  );
}

// ─── Step content maps ────────────────────────────────────────────────────────

const STEP_TITLES: Record<Step, string> = {
  email:         'Forgot Password?',
  resetPassword: 'New Password',
};

const STEP_DESCRIPTIONS: Record<Step, string> = {
  email:         "Enter your email and we'll send you a reset code.",
  resetPassword: 'Your identity is verified. Set your new password below.',
};

// ─── Inner Form (needs useSearchParams — wrapped in Suspense) ─────────────────

function ForgotPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep]                     = useState<Step>('email');
  const [email, setEmail]                   = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword]       = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField]     = useState<string | null>(null);

  useEffect(() => {
    const stepParam  = searchParams.get('step');
    const emailParam = searchParams.get('email');
    if (stepParam === 'reset' && emailParam) {
      setEmail(emailParam);
      setStep('resetPassword');
    }
  }, [searchParams]);

  const handleSendOtp = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      router.push(
        `/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}&reason=forgot-password`
      );
    },
    [router, email]
  );

  const handleResetPassword = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      router.push('/sign-in');
    },
    [router]
  );

  const focused = (field: string) => focusedField === field;
  const onFocus = (field: string) => () => setFocusedField(field);
  const onBlur  = () => setFocusedField(null);

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-x-hidden overflow-y-auto py-10 px-4 sm:px-6">
      <AuthCard>
        <div className="flex items-center justify-center mb-6">
          <Image
            src={LogoSrc}
            alt="BuddyTickets Logo"
            width={48}
            height={48}
            className="w-12 h-12 object-contain drop-shadow-sm"
            priority
          />
        </div>

        <h1 className="font-primary text-3xl font-semibold mb-2 text-center text-[hsl(222.2,47.4%,11.2%)]">
          {STEP_TITLES[step]}
        </h1>
        <p className="font-secondary text-sm mb-8 text-center text-[hsl(215.4,16.3%,46.9%)]">
          {STEP_DESCRIPTIONS[step]}
        </p>

        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4">
            <div className="relative">
              <InputIcon icon={Mail} isFocused={focused('email')} />
              <Input
                placeholder="Email Address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={onFocus('email')}
                onBlur={onBlur}
                className={inputCls(focused('email'))}
              />
            </div>
            <SubmitButton label="Send Reset Code" />
          </form>
        )}

        {step === 'resetPassword' && (
          <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-4">
            {/* New Password */}
            <div className="relative">
              <InputIcon icon={Lock} isFocused={focused('newPassword')} />
              <Input
                placeholder="New Password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={onFocus('newPassword')}
                onBlur={onBlur}
                className={inputCls(focused('newPassword'), 'pr-11')}
              />
              <PasswordToggle
                show={showNewPassword}
                onToggle={() => setShowNewPassword((p) => !p)}
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <InputIcon icon={Lock} isFocused={focused('confirmPassword')} />
              <Input
                placeholder="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={onFocus('confirmPassword')}
                onBlur={onBlur}
                className={inputCls(focused('confirmPassword'), 'pr-11')}
              />
              <PasswordToggle
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((p) => !p)}
              />
            </div>

            <SubmitButton label="Reset Password" />
          </form>
        )}

        <p className="mt-5 text-sm text-center font-secondary text-[hsl(215.4,16.3%,46.9%)]">
          Remember your password?{' '}
          <Link
            href="/sign-in"
            className="font-primary font-medium text-[hsl(270,70%,50%)] hover:opacity-80 transition-opacity duration-200"
          >
            Sign In
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}