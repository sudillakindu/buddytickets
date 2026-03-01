// app/(auth)/sign-up/page.tsx
"use client";

import { useState, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Phone, Eye, EyeOff, Loader2 } from "lucide-react";

import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

import LogoSrc from "@/app/assets/images/logo/upscale_media_logo.png";
import { signUp } from "@/lib/actions/auth";

interface AuthInputProps {
  icon?: React.ElementType;
  prefix?: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  autoComplete?: string;
  maxLength?: number;
  rightElement?: React.ReactNode;
}

const AuthInput = memo(
  ({
    icon: Icon,
    prefix,
    type = "text",
    placeholder,
    value,
    onChange,
    focused,
    onFocus,
    onBlur,
    autoComplete,
    maxLength,
    rightElement,
  }: AuthInputProps) => (
    <div className="relative w-full">
      {prefix ? (
        <span
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium select-none transition-colors duration-200 z-10 pointer-events-none",
            focused
              ? "text-[hsl(270,70%,50%)]"
              : "text-[hsl(215.4,16.3%,46.9%)]",
          )}
          aria-hidden="true"
        >
          {prefix}
        </span>
      ) : Icon ? (
        <Icon
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none",
            focused
              ? "text-[hsl(270,70%,50%)]"
              : "text-[hsl(215.4,16.3%,46.9%)]",
          )}
          aria-hidden="true"
        />
      ) : null}
      <Input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className={cn(
          "font-secondary py-3 rounded-xl h-auto text-sm transition-all duration-200",
          "bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)]",
          "placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0",
          "focus-visible:border-[hsl(270,70%,50%)] w-full",
          prefix ? "pl-9" : "pl-11",
          focused
            ? "border-[hsl(270,70%,50%)]"
            : "border-[hsl(214.3,31.8%,91.4%)]",
          rightElement && "pr-11",
        )}
      />
      {rightElement}
    </div>
  ),
);

AuthInput.displayName = "AuthInput";

export default function SignUpPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const result = await signUp(formData);

        if (result.success && result.token) {
          Toast("Success", result.message, "success");
          router.push(`/verify-email?token=${result.token}`);
          return;
        }
        Toast("Error", result.message, "error");
      } catch {
        Toast("Error", "An unexpected error occurred.", "error");
      } finally {
        setLoading(false);
      }
    },
    [formData, router],
  );

  const isFocused = (field: string) => focusedField === field;

  return (
    <section className="min-h-[100dvh] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-x-hidden overflow-y-auto py-12">
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
          Create Account
        </h1>
        <p className="font-secondary text-sm mb-8 text-center text-[hsl(215.4,16.3%,46.9%)] w-full">
          Join BuddyTickets and start exploring events.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <AuthInput
            icon={User}
            placeholder="Full Name"
            autoComplete="name"
            value={formData.name}
            onChange={(v) => handleChange("name", v)}
            focused={isFocused("name")}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
          />

          <AuthInput
            prefix="@"
            placeholder="username"
            autoComplete="username"
            value={formData.username}
            onChange={(v) =>
              handleChange(
                "username",
                v.toLowerCase().replace(/[^a-z0-9_]/g, ""),
              )
            }
            focused={isFocused("username")}
            onFocus={() => setFocusedField("username")}
            onBlur={() => setFocusedField(null)}
          />

          <AuthInput
            icon={Mail}
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            value={formData.email}
            onChange={(v) => handleChange("email", v)}
            focused={isFocused("email")}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />

          <AuthInput
            icon={Phone}
            type="tel"
            placeholder="Mobile Number (07XXXXXXXX)"
            autoComplete="tel"
            maxLength={10}
            value={formData.mobile}
            onChange={(v) => handleChange("mobile", v.replace(/\D/g, ""))}
            focused={isFocused("mobile")}
            onFocus={() => setFocusedField("mobile")}
            onBlur={() => setFocusedField(null)}
          />

          <AuthInput
            icon={Lock}
            type={showPassword ? "text" : "password"}
            placeholder="Password (min. 6 characters)"
            autoComplete="new-password"
            value={formData.password}
            onChange={(v) => handleChange("password", v)}
            focused={isFocused("password")}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            rightElement={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-[hsl(215.4,16.3%,46.9%)] transition-colors duration-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            }
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="mt-5 text-sm text-center font-secondary text-[hsl(215.4,16.3%,46.9%)] w-full">
          Already have an account?{" "}
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
