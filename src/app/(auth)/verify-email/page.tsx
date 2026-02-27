'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';

// ─── Shared Auth Primitives (co-located) ──────────────────────────────────────

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10 flex flex-col items-center overflow-hidden my-auto bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.15),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.05)]">
      {children}
    </div>
  );
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

// ─── OTP Input ────────────────────────────────────────────────────────────────

interface OtpInputProps {
  digits: string[];
  focusedIndex: number | null;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onFocus: (index: number) => void;
  onBlur: () => void;
}

function OtpInput({
  digits, focusedIndex, inputRefs, onChange, onKeyDown, onPaste, onFocus, onBlur,
}: OtpInputProps) {
  return (
    <div className="flex gap-2 sm:gap-3 justify-center w-full" role="group" aria-label="One-time password">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={() => onFocus(i)}
          onBlur={onBlur}
          className={[
            'w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-primary font-semibold rounded-xl border-2',
            'transition-all duration-200 bg-[hsl(210,40%,98%)] text-[hsl(222.2,47.4%,11.2%)]',
            'outline-none select-none caret-transparent',
            focusedIndex === i
              ? 'border-[hsl(270,70%,50%)] shadow-[0_0_0_3px_hsl(270,70%,50%,0.15)]'
              : digit
              ? 'border-[hsl(270,70%,50%)] bg-[hsl(270,70%,98%)]'
              : 'border-[hsl(214.3,31.8%,91.4%)]',
          ].join(' ')}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Inner Form (needs useSearchParams — wrapped in Suspense) ─────────────────

function VerifyEmailForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const email  = searchParams.get('email')  ?? '';
  const reason = searchParams.get('reason') ?? 'signup';

  const [digits, setDigits]           = useState<string[]>(Array(6).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  const handleDigitChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (digits[index]) {
          setDigits((prev) => { const next = [...prev]; next[index] = ''; return next; });
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < 5) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill('');
    pasted.split('').forEach((char, i) => { next[i] = char; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (reason === 'forgot-password') {
        router.push(`/forget-password?step=reset&email=${encodeURIComponent(email)}`);
      } else {
        router.push('/sign-in');
      }
    },
    [router, email, reason]
  );

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
          Verify Your Email
        </h1>
        <p className="font-secondary text-sm mb-6 text-center text-[hsl(215.4,16.3%,46.9%)]">
          Enter the 6-digit code sent to
          <br />
          <span className="font-primary font-medium text-[hsl(270,70%,50%)] truncate inline-block max-w-[250px] align-bottom">
            {email}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <OtpInput
            digits={digits}
            focusedIndex={focusedIndex}
            inputRefs={inputRefs}
            onChange={handleDigitChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={setFocusedIndex}
            onBlur={() => setFocusedIndex(null)}
          />

          <SubmitButton label="Verify Email" />

          <button
            type="button"
            className="text-xs font-secondary mx-auto mt-0 text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] transition-colors duration-200"
          >
            Didn&apos;t receive the code? Resend
          </button>
        </form>

        <p className="mt-4 text-sm text-center font-secondary text-[hsl(215.4,16.3%,46.9%)]">
          Already verified?{' '}
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

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}