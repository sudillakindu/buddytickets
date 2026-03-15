"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Loader2, Users, CheckCircle2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  joinWaitlist,
  getWaitlistPosition,
  getEventWaitlistCount,
} from "@/lib/actions/waitlist";

interface EventWaitlistProps {
  eventId: string;
  isAuthenticated: boolean;
}

const EventWaitlist = memo<EventWaitlistProps>(
  ({ eventId, isAuthenticated }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [position, setPosition] = useState<number | null>(null);
    const [total, setTotal] = useState<number | null>(null);
    const [waitlistCount, setWaitlistCount] = useState<number>(0);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;

      async function load() {
        const countRes = await getEventWaitlistCount(eventId);
        if (!cancelled && countRes.success) {
          setWaitlistCount(countRes.count ?? 0);
        }

        if (isAuthenticated) {
          const posRes = await getWaitlistPosition(eventId);
          if (!cancelled && posRes.success && posRes.position != null) {
            setPosition(posRes.position);
            setTotal(posRes.total ?? 0);
          }
        }

        if (!cancelled) setInitialLoading(false);
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [eventId, isAuthenticated]);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
          toast.error("Please enter your email address.");
          return;
        }

        setLoading(true);
        try {
          const result = await joinWaitlist(eventId, email.trim());
          if (result.success && result.entry) {
            setPosition(result.entry.position_order);
            setWaitlistCount((prev) => prev + 1);
            setTotal((prev) => (prev ?? 0) + 1);
            toast.success("You've joined the waitlist!", {
              description: `You're #${result.entry.position_order} on the waitlist.`,
            });
          } else {
            toast.error(result.message || "Failed to join waitlist.");
          }
        } catch {
          toast.error("Something went wrong. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      [eventId, email],
    );

    if (initialLoading) {
      return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 flex items-center justify-center">
          <Loader2
            className="w-5 h-5 animate-spin text-[hsl(270,70%,50%)]"
            aria-hidden="true"
          />
        </div>
      );
    }

    const joined = position != null;

    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-50">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-[hsl(270,70%,50%)]/10 flex items-center justify-center">
            <Bell
              className="w-[18px] h-[18px] text-[hsl(270,70%,50%)]"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="font-primary font-bold text-sm uppercase tracking-wider text-[hsl(222.2,47.4%,11.2%)]">
              Join Waitlist
            </h2>
            <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
              Get notified when tickets become available
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          <AnimatePresence mode="wait">
            {!isAuthenticated ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 rounded-xl bg-[hsl(210,40%,96.1%)] p-4"
              >
                <LogIn
                  className="w-4 h-4 text-[hsl(215.4,16.3%,46.9%)] shrink-0"
                  aria-hidden="true"
                />
                <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
                  Sign in to join the waitlist
                </p>
              </motion.div>
            ) : joined ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-3 py-2"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-500"
                    aria-hidden="true"
                  />
                </div>
                <p
                  className="font-primary font-bold text-lg text-[hsl(222.2,47.4%,11.2%)]"
                  aria-label={`You are number ${position} on the waitlist`}
                >
                  You&apos;re #{position} on the waitlist
                </p>
                {total != null && (
                  <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                    {total} {total === 1 ? "person" : "people"} waiting
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-3"
              >
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="font-secondary text-sm rounded-xl border-gray-200 focus-visible:ring-[hsl(270,70%,50%)]/30 focus-visible:border-[hsl(270,70%,50%)]"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full font-primary font-bold text-sm py-3 h-auto rounded-xl text-white shadow-md transition-all duration-300",
                    "bg-[hsl(270,70%,50%)] hover:bg-[hsl(270,70%,45%)]",
                    !loading && "hover:shadow-lg hover:-translate-y-0.5",
                  )}
                >
                  {loading ? (
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Bell className="w-4 h-4" aria-hidden="true" />
                      Join Waitlist
                    </span>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {waitlistCount > 0 && !joined && isAuthenticated && (
          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 text-[hsl(215.4,16.3%,46.9%)]">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <p className="font-secondary text-xs">
                {waitlistCount} {waitlistCount === 1 ? "person" : "people"}{" "}
                already waiting
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
);

EventWaitlist.displayName = "EventWaitlist";

export default EventWaitlist;
