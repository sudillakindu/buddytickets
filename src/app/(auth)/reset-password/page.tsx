// app/(auth)/reset-password/page.tsx
"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";

import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";

import LogoSrc from "@/app/assets/images/logo/upscale_media_logo.png";

import {
  resetPassword as resetPasswordAction,
  validateResetToken,
} from "@/lib/actions/auth";

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
  rightElement?: React.ReactNode;
}

const AuthInput = memo(
  ({
    icon: Icon,
    type = "text",
    placeholder,
    value,
    onChange,
    focused,
    onFocus,
    onBlur,
    autoComplete,
    rightElement,
  }: AuthInputProps) => (
    <div className="relative w-full">
      <Icon
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 z-10 pointer-events-none",
          focused ? "text-[hsl(270,70%,50%)]" : "text-[hsl(215.4,16.3%,46.9%)]",
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
          "font-secondary pl-11 py-3 rounded-xl h-auto text-sm transition-all duration-200",
          "bg-[hsl(210,40%,98%)] border-2 text-[hsl(222.2,47.4%,11.2%)]",
          "placeholder:text-[hsl(215.4,16.3%,46.9%)] focus-visible:ring-0",
          "focus-visible:border-[hsl(270,70%,50%)] w-full",
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

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const handleChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  const validateToken = useCallback(async () => {
    if (!token) {
      setPageError("No reset token found.");
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setPageError("");

    try {
      const result = await validateResetToken(token);
      if (result?.success && result.data) {
        setEmail(result.data.email);
        setPageLoading(false);
        return;
      }
      setPageError(
        result?.message || "Invalid or expired reset link. Please try again.",
      );
      setPageLoading(false);
    } catch (error) {
      logger.error({
        fn: "ResetPasswordPage.validateToken",
        message: "Failed to validate reset token",
        meta: error,
      });
      setPageError("Failed to validate reset link. Please try again.");
      setPageLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) validateToken();
  }, [token, validateToken]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const result = await resetPasswordAction(token, formData);
        if (result.success) {
          Toast("Success", result.message, "success");
          setTimeout(() => router.push("/sign-in"), 1500);
          return;
        }
        Toast("Error", result.message, "error");
      } catch (error) {
        logger.error({
          fn: "ResetPasswordPage.handleSubmit",
          message: "Failed to reset password",
          meta: error,
        });
        Toast("Error", "An unexpected error occurred.", "error");
      } finally {
        setLoading(false);
      }
    },
    [token, formData, router],
  );

  const isFocused = (field: string) => focusedField === field;

  if (pageLoading) {
    return (
      <div className="w-full min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(270,70%,50%)]" />
      </div>
    );
  }

  if (pageError) {
    return (
      <section className="min-h-[100dvh] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-10">
        <div className="relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10 flex flex-col items-center bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.15),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.05)]">
          <div className="flex items-center justify-center mb-6 w-full">
            <Link href="/" aria-label="Go to Home">
              <Image
                src={LogoSrc}
                alt="BuddyTickets Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain drop-shadow-sm hover:opacity-80 transition-opacity duration-200"
                priority
              />
            </Link>
          </div>
          <h1 className="font-primary text-2xl font-semibold mb-2 text-center text-[hsl(222.2,47.4%,11.2%)] w-full">
            Reset Link Invalid
          </h1>
          <p className="font-secondary text-sm mb-6 text-center text-[hsl(215.4,16.3%,46.9%)] w-full">
            {pageError}
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={validateToken}
              className="w-full h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]"
            >
              Try Again
            </Button>
            <Link
              href="/forget-password"
              className="text-center text-sm font-primary font-medium text-[hsl(270,70%,50%)] hover:opacity-80 transition-opacity duration-200"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[100dvh] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-x-hidden overflow-y-auto py-10">
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10 flex flex-col items-center overflow-hidden my-auto bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.15),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.05)]">
        <div className="flex items-center justify-center mb-6 w-full">
          <Link href="/" aria-label="Go to Home">
            <Image
              src={LogoSrc}
              alt="BuddyTickets Logo"
              width={48}
              height={48}
              className="w-12 h-12 object-contain drop-shadow-sm hover:opacity-80 transition-opacity duration-200"
              priority
            />
          </Link>
        </div>

        <h1 className="font-primary text-3xl font-semibold mb-2 text-center text-[hsl(222.2,47.4%,11.2%)] w-full">
          New Password
        </h1>
        <p className="font-secondary text-sm mb-8 text-center text-[hsl(215.4,16.3%,46.9%)] w-full">
          Set your new password for{" "}
          <span className="font-primary font-medium text-[hsl(270,70%,50%)]">
            {email}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <AuthInput
            icon={Lock}
            type={showPassword.new ? "text" : "password"}
            placeholder="New Password (min. 6 characters)"
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
                onClick={() => setShowPassword((p) => ({ ...p, new: !p.new }))}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-[hsl(215.4,16.3%,46.9%)] transition-colors duration-200"
                aria-label={
                  showPassword.new ? "Hide password" : "Show password"
                }
              >
                {showPassword.new ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            }
          />

          <AuthInput
            icon={Lock}
            type={showPassword.confirm ? "text" : "password"}
            placeholder="Confirm New Password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(v) => handleChange("confirmPassword", v)}
            focused={isFocused("confirmPassword")}
            onFocus={() => setFocusedField("confirmPassword")}
            onBlur={() => setFocusedField(null)}
            rightElement={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setShowPassword((p) => ({ ...p, confirm: !p.confirm }))
                }
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-[hsl(215.4,16.3%,46.9%)] transition-colors duration-200"
                aria-label={
                  showPassword.confirm ? "Hide password" : "Show password"
                }
              >
                {showPassword.confirm ? (
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
              "Reset Password"
            )}
          </Button>
        </form>

        <p className="mt-5 text-sm text-center font-secondary text-[hsl(215.4,16.3%,46.9%)] w-full">
          Remember your password?{" "}
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
