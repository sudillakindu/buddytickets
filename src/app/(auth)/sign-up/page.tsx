'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import LogoSrc from '@/app/assets/images/logo/upscale_media_logo.png';
import { signUp } from '@/lib/actions/auth';

type FormData = {
  name: string;
  username: string;
  email: string;
  mobile: string;
  password: string;
};

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    name: '', username: '', email: '', mobile: '', password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await signUp(formData);
      if (result.success && result.token) {
        Toast('Success', result.message || 'Account created successfully.', 'success');
        router.push(`/verify-email?token=${result.token}`);
      } else {
        Toast('Error', result.message || 'Sign up failed.', 'error');
      }
    } catch {
      Toast('Error', 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  }, [formData, router]);

  const focused = (field: string) => focusedField === field;

  return (
    <section className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-x-hidden overflow-y-auto py-12 px-4 sm:px-6">
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
          Create Account
        </h1>
        <p className="font-secondary text-sm mb-8 text-center text-[hsl(215.4,16.3%,46.9%)]">
          Join BuddyTickets and start exploring events.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          
          {/* Full Name Input */}
          <div className="relative">
            <User
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${focused('name') ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'}`}
              aria-hidden="true"
            />
            <Input
              placeholder="Full Name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              className={`font-secondary pl-11 py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] ${focused('name') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
            />
          </div>

          {/* Username Input */}
          <div className="relative">
            <span
              className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium select-none transition-colors duration-200 z-10 pointer-events-none ${focused('username') ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'}`}
              aria-hidden="true"
            >
              @
            </span>
            <Input
              placeholder="username"
              type="text"
              autoComplete="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              className={`font-secondary pl-9 py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] ${focused('username') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
            />
          </div>

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

          {/* Mobile Input */}
          <div className="relative">
            <Phone
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${focused('mobile') ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'}`}
              aria-hidden="true"
            />
            <Input
              placeholder="Mobile Number (07XXXXXXXX)"
              type="tel"
              autoComplete="tel"
              maxLength={10}
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value.replace(/\D/g, ''))}
              onFocus={() => setFocusedField('mobile')}
              onBlur={() => setFocusedField(null)}
              className={`font-secondary pl-11 py-3 rounded-xl h-auto text-sm transition-all duration-200 bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)] placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0 focus-visible:border-[hsl(270,70%,50%)] ${focused('mobile') ? 'border-[hsl(270,70%,50%)]' : 'border-[hsl(214.3,31.8%,91.4%)]'}`}
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none ${focused('password') ? 'text-[hsl(270,70%,50%)]' : 'text-[hsl(215.4,16.3%,46.9%)]'}`}
              aria-hidden="true"
            />
            <Input
              placeholder="Password (min. 6 characters)"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-center font-secondary text-[hsl(215.4,16.3%,46.9%)]">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-primary font-medium text-[hsl(270,70%,50%)] hover:opacity-80 transition-opacity duration-200"
          >
            Sign In
          </Link>
        </p>
      </div>
    </section>
  );
}