// app/(auth)/forget-password/page.tsx
'use client';

import { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Loader2 } from 'lucide-react';

import { cn } from '@/lib/ui/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';

import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';
import { forgotPassword as forgotPasswordAction } from '@/lib/actions/auth';

interface AuthInputProps {
  icon: React.ElementType;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  autoComplete?: string;
}

const AuthInput = memo(({
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  focused,
  onFocus,
  onBlur,
  autoComplete,
}: AuthInputProps) => (
  <div className="relative w-full">
    <Icon
      className={cn(
        'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none',
        focused ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'
      )}
      aria-hidden="true"
    />
    <Input
      type={type}
      placeholder={placeholder}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(
        'font-secondary pl-11 py-3 rounded-xl h-auto text-sm transition-all duration-200',
        'bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)]',
        'placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0',
        'focus-visible:border-[hsl(270,70%,50%)] w-full',
        focused ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'
      )}
    />
  </div>
));

AuthInput.displayName = 'AuthInput';

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await forgotPasswordAction({ email: email.trim().toLowerCase() });
      if (result.success && result.token) {
        Toast('Success', result.message, 'success');
        router.push(`/verify-email?token=${result.token}`);
        return;
      }
      Toast('Error', result.message, 'error');
    } catch {
      Toast('Error', 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  }, [email, router]);

  return (
    <div className="min-h-[100dvh] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-x-hidden overflow-y-auto py-10">
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10 flex flex-col items-center overflow-hidden my-auto bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.15),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.05)]">

        <div className="flex items-center justify-center mb-6 w-full">
          <Image
            src={LogoSrc}
            alt="BuddyTickets Logo"
            width={48}
            height={48}
            className="w-12 h-12 object-contain drop-shadow-sm"
            priority
          />
        </div>

        <h1 className="font-primary text-3xl font-semibold mb-2 text-center text-[hsl(222.2,47.4%,11.2%)] w-full">
          Forgot Password?
        </h1>
        <p className="font-secondary text-sm mb-8 text-center text-[hsl(215.4,16.3%,46.9%)] w-full">
          Enter your email and we&apos;ll send you a reset code.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <AuthInput
            icon={Mail}
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            focused={focusedField === 'email'}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Code'}
          </Button>
        </form>

        <p className="mt-5 text-sm text-center font-secondary text-[hsl(215.4,16.3%,46.9%)] w-full">
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