"use client";

import React, { useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Bell, Loader2, CheckCircle2, Mail } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinWaitlist } from "@/lib/actions/waitlist";

interface WaitlistSectionProps {
  eventId: string;
  userEmail?: string;
}

export const WaitlistSection: React.FC<WaitlistSectionProps> = memo(
  ({ eventId, userEmail }) => {
    const [email, setEmail] = useState(userEmail ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joined, setJoined] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!email.trim()) {
          setError("Please enter your email address.");
          return;
        }

        setIsSubmitting(true);
        try {
          const result = await joinWaitlist(eventId, email.trim());
          if (result.success) {
            setJoined(true);
            setMessage(result.message);
          } else {
            if (result.message === "UNAUTHENTICATED") {
              setError("Please sign in to join the waitlist.");
            } else {
              setError(result.message);
            }
          }
        } catch {
          setError("Something went wrong. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      },
      [eventId, email],
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Bell
              className="w-[18px] h-[18px] text-amber-600"
              aria-hidden="true"
            />
          </div>
          <div>
            <h3 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
              Join Waitlist
            </h3>
            <p className="font-secondary text-xs text-gray-500">
              Get notified when tickets become available
            </p>
          </div>
        </div>

        {joined ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-4"
          >
            <CheckCircle2
              className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="font-secondary text-sm font-semibold text-emerald-700">
                You&apos;re on the list!
              </p>
              <p className="font-secondary text-xs text-emerald-600 mt-0.5">
                {message}
              </p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-9 rounded-xl text-sm font-secondary h-10"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "rounded-xl font-primary font-bold text-sm h-10 px-5 text-white shadow-sm",
                  "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Notify Me"
                )}
              </Button>
            </div>
            {error && (
              <p className="font-secondary text-xs text-red-600">{error}</p>
            )}
          </form>
        )}
      </motion.div>
    );
  },
);

WaitlistSection.displayName = "WaitlistSection";
