'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';
import {
  forgotPassword as forgotPasswordAction,
  resetPassword as resetPasswordAction,
  validateResetToken,
} from '@/lib/actions/auth';

type Step = 'email' | 'resetPassword';

const STEP_TITLES: Record<Step, string> = {
  email:         'Forgot Password?',
  resetPassword: 'New Password',
};

const STEP_DESCRIPTIONS: Record<Step, string> = {
  email:         "Enter your email and we'll send you a reset code.",
  resetPassword: 'Your identity is verified. Set your new password below.',
};

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    const tokenParam = searchParams.get('token');
    
    if (stepParam === 'reset' && tokenParam) {
      setPageLoading(true);
      setResetToken(tokenParam);
      
      validateResetToken(tokenParam).then((data) => {
        if (data) {
          setEmail(data.email);
          setStep('resetPassword');
        } else {
          router.replace('/sign-in');
        }
        setPageLoading(false);
      });
    }
  }, [searchParams, router]);

  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await forgotPasswordAction({ email: email.trim().toLowerCase() });
      if (result.success && result.token) {
        router.push(`/verify-email?token=${result.token}`);
      } else {
        setError(result.error || 'Failed to send reset code.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [email, router]);

  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await resetPasswordAction(resetToken, {
        password: newPassword,
        confirmPassword,
      });
      if (result.success) {
        router.push('/sign-in');
      } else {
        setError(result.error || 'Failed to reset password.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [resetToken, newPassword, confirmPassword, router]);

  const focused = (field: string) => focusedField === field;

  if (pageLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(270,70%,50%)]" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-x-hidden overflow-y-auto py-10 px-4 sm:px-6">
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10 flex flex-col items-center overflow-hidden my-auto bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.15),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.05)]">
        
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

        {error && (
          <p className="w-full text-sm text-red-500 text-center font-secondary mb-4 bg-red-50 rounded-xl py-2.5 px-4">
            {error}
          </p>
        )}

        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4">
            <div className="relative">
              <Mail
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${focused('email') ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'}`}
                aria-hidden="true"
              />
              <Input
                placeholder="Email Address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className={`font-secondary pl-11 py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] ${focused('email') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Code"}
            </Button>
          </form>
        )}

        {step === 'resetPassword' && (
          <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-4">
            <div className="relative">
              <Lock
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${focused('newPassword') ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'}`}
                aria-hidden="true"
              />
              <Input
                placeholder="New Password"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setFocusedField('newPassword')}
                onBlur={() => setFocusedField(null)}
                className={`font-secondary pl-11 pr-11 py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] ${focused('newPassword') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowNewPassword((p) => !p)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-[hsl(215.4,16.3%,46.9%)] transition-colors duration-200"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            <div className="relative">
              <Lock
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${focused('confirmPassword') ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'}`}
                aria-hidden="true"
              />
              <Input
                placeholder="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
                className={`font-secondary pl-11 pr-11 py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] ${focused('confirmPassword') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-[hsl(215.4,16.3%,46.9%)] transition-colors duration-200"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
            </Button>
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
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}