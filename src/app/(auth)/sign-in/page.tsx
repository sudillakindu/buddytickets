'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';
import { signIn } from '@/lib/actions/auth';

type FormData = {
  email: string;
  password: string;
};

export default function SignInPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await signIn(formData);
      if (result.success) {
        window.location.href = result.redirectTo || '/';
      } else if (result.needsVerification && result.token) {
        router.push(`/verify-email?token=${result.token}`);
      } else {
        setError(result.error || 'Sign in failed.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [formData, router]);

  const focused = (field: string) => focusedField === field;

  return (
    <section className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-x-hidden overflow-y-auto py-10 px-4 sm:px-6">
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
          Welcome Back
        </h1>
        <p className="font-secondary text-sm mb-8 text-center text-[hsl(215.4,16.3%,46.9%)]">
          Sign in to access your dashboard and events.
        </p>

        {error && (
          <p className="w-full text-sm text-red-500 text-center font-secondary mb-4 bg-red-50 rounded-xl py-2.5 px-4">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          
          {/* Email Input */}
          <div className="relative">
            <Mail
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${focused('email') ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'}`}
              aria-hidden="true"
            />
            <Input
              placeholder="Email Address"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className={`font-secondary pl-11 py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] ${focused('email') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${focused('password') ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'}`}
              aria-hidden="true"
            />
            <Input
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className={`font-secondary pl-11 pr-11 py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] ${focused('password') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-[hsl(215.4,16.3%,46.9%)] transition-colors duration-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex justify-end -mt-1.5 mb-2">
            <Link
              href="/forget-password"
              className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] transition-colors duration-200"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-center font-secondary text-[hsl(215.4,16.3%,46.9%)]">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="font-primary font-medium text-[hsl(270,70%,50%)] hover:opacity-80 transition-opacity duration-200"
          >
            Create account
          </Link>
        </p>
      </div>
    </section>
  );
}