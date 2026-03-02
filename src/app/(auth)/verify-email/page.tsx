// app/(auth)/verify-email/page.tsx
"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";

import { Toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";

import LogoSrc from "@/app/assets/images/logo/upscale_media_logo.png";

import {
  verifyOtp as verifyOtpAction,
  resendOtp as resendOtpAction,
  getVerifyEmailData,
} from "@/lib/actions/auth";

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "0s";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function PageSpinner() {
  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[hsl(270,70%,50%)]" />
    </div>
  );
}

interface ErrorCardProps {
  message: string;
  onRetry: () => void;
}

function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div className="min-h-[100dvh] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center py-10">
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10 flex flex-col items-center bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.15),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.05)]">
        <div className="flex items-center justify-center mb-6">
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
        <h1 className="font-primary text-2xl font-semibold mb-2 text-center text-[hsl(222.2,47.4%,11.2%)]">
          Verification Failed
        </h1>
        <p className="font-secondary text-sm mb-6 text-center text-[hsl(215.4,16.3%,46.9%)]">
          {message}
        </p>
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={onRetry}
            className="w-full h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0]"
          >
            Try Again
          </Button>
          <Link
            href="/sign-in"
            className="text-center text-sm font-primary font-medium text-[hsl(270,70%,50%)] hover:opacity-80 transition-opacity duration-200"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  const loadSessionData = useCallback(async () => {
    if (!token) {
      setPageError("No verification token found.");
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setPageError("");

    try {
      const result = await getVerifyEmailData(token);
      if (!result?.success || !result.data) {
        setPageError(result?.message || "Session expired. Please start over.");
        setPageLoading(false);
        return;
      }
      setEmail(result.data.email);
      setPurpose(result.data.purpose);
      setCountdown(result.data.remainingSeconds);
      setPageLoading(false);
    } catch (error) {
      logger.error({
        fn: "VerifyEmailPage.loadSessionData",
        message: "Failed to load verify session",
        meta: error,
      });
      setPageError("Failed to load verification session. Please try again.");
      setPageLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleDigitChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (digits[index]) {
          setDigits((prev) => {
            const next = [...prev];
            next[index] = "";
            return next;
          });
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < 5) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const code = digits.join("");

      if (code.length !== 6) {
        Toast("Error", "Please enter all 6 digits.", "error");
        return;
      }

      setLoading(true);
      try {
        const result = await verifyOtpAction(token, code);

        if (!result.success) {
          let msg = result.message || "Verification failed.";
          if (
            result.attemptsRemaining !== undefined &&
            result.attemptsRemaining > 0
          ) {
            msg += ` (${result.attemptsRemaining} attempt${result.attemptsRemaining === 1 ? "" : "s"} remaining)`;
          }
          Toast("Error", msg, "error");
          return;
        }

        Toast("Success", result.message, "success");

        if (result.purpose === "forgot-password" && result.resetToken) {
          router.push(`/reset-password?token=${result.resetToken}`);
          return;
        }

        window.location.href = result.redirectTo ?? "/";
      } catch (error) {
        logger.error({
          fn: "VerifyEmailPage.handleSubmit",
          message: "Failed to verify otp",
          meta: error,
        });
        Toast("Error", "An unexpected error occurred.", "error");
      } finally {
        setLoading(false);
      }
    },
    [digits, token, router],
  );

  const handleResend = useCallback(async () => {
    setResending(true);
    try {
      const result = await resendOtpAction(token);
      if (result.success) {
        setDigits(Array(6).fill(""));
        setCountdown(result.remainingSeconds ?? 60);
        Toast("Success", result.message, "success");
        return;
      }
      if (result.remainingSeconds) setCountdown(result.remainingSeconds);
      Toast("Error", result.message, "error");
    } catch (error) {
      logger.error({
        fn: "VerifyEmailPage.handleResend",
        message: "Failed to resend otp",
        meta: error,
      });
      Toast("Error", "Failed to resend code.", "error");
    } finally {
      setResending(false);
    }
  }, [token]);

  if (pageLoading) return <PageSpinner />;
  if (pageError)
    return <ErrorCard message={pageError} onRetry={loadSessionData} />;

  const pageTitle =
    purpose === "forgot-password" ? "Reset Your Password" : "Verify Your Email";
  const submitLabel =
    purpose === "forgot-password" ? "Verify & Continue" : "Verify Email";
  const isResendDisabled = countdown > 0 || resending;

  return (
    <div className="min-h-[100dvh] w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-x-hidden overflow-y-auto py-10">
      <div className="relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10 flex flex-col items-center overflow-hidden my-auto bg-white/85 backdrop-blur-xl shadow-[0_25px_50px_-12px_hsl(222.2_47.4%_11.2%_/_0.15),0_0_0_1px_hsl(222.2_47.4%_11.2%_/_0.05)]">
        <div className="flex items-center justify-center mb-6">
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

        <h1 className="font-primary text-3xl font-semibold mb-2 text-center text-[hsl(222.2,47.4%,11.2%)]">
          {pageTitle}
        </h1>
        <p className="font-secondary text-sm mb-6 text-center text-[hsl(215.4,16.3%,46.9%)]">
          Enter the 6-digit code sent to
          <br />
          <span className="font-primary font-medium text-[hsl(270,70%,50%)] truncate inline-block max-w-[250px] align-bottom">
            {email}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div
            className="flex gap-2 sm:gap-3 justify-center w-full"
            role="group"
            aria-label="One-time password"
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(null)}
                className={cn(
                  "w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-primary font-semibold rounded-xl",
                  "border-2 transition-all duration-200 bg-[hsl(210,40%,98%)]",
                  "text-[hsl(222.2,47.4%,11.2%)] outline-none select-none caret-transparent",
                  focusedIndex === i
                    ? "border-[hsl(270,70%,50%)]"
                    : digit
                      ? "border-[hsl(270,70%,50%)] bg-[hsl(270,70%,98%)]"
                      : "border-[hsl(214.3,31.8%,91.4%)]",
                )}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-auto py-3 rounded-xl font-primary font-medium text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 border-none bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] bg-[position:0_0] hover:bg-[position:100%_0] disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              submitLabel
            )}
          </Button>

          <button
            type="button"
            disabled={isResendDisabled}
            onClick={handleResend}
            className={cn(
              "text-xs font-secondary mx-auto mt-0 transition-colors duration-200",
              isResendDisabled
                ? "text-[hsl(215.4,16.3%,46.9%)]/60 cursor-not-allowed"
                : "text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] cursor-pointer",
            )}
          >
            {resending
              ? "Sending…"
              : countdown > 0
                ? `Resend code in ${formatCountdown(countdown)}`
                : "Didn\u2019t receive the code? Resend"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center font-secondary text-[hsl(215.4,16.3%,46.9%)]">
          Already verified?{" "}
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
