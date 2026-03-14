"use client";

import React, { useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Bell, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface JoinWaitlistFormProps {
  eventId: string;
  ticketTypeId?: string;
  onSubmit: (data: {
    event_id: string;
    ticket_type_id: string | null;
    notify_email: string;
  }) => Promise<{ success: boolean; message: string; position?: number }>;
}

export const JoinWaitlistForm: React.FC<JoinWaitlistFormProps> = memo(
  ({ eventId, ticketTypeId, onSubmit }) => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
      success: boolean;
      message: string;
      position?: number;
    } | null>(null);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubmitting(true);
        setResult(null);

        const response = await onSubmit({
          event_id: eventId,
          ticket_type_id: ticketTypeId ?? null,
          notify_email: email.trim(),
        });

        setResult(response);
        setIsSubmitting(false);
        if (response.success) setEmail("");
      },
      [email, eventId, ticketTypeId, onSubmit],
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl border border-amber-100 bg-amber-50/60 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-600" />
          <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-amber-900">
            Join Waitlist
          </h4>
        </div>

        <p className="font-secondary text-xs text-amber-700">
          This event is sold out. Enter your email to be notified when tickets
          become available.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label
              htmlFor="waitlist-email"
              className="font-secondary text-xs text-amber-700"
            >
              Email Address
            </Label>
            <Input
              id="waitlist-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-9 text-sm rounded-xl border-amber-200 bg-white focus:border-amber-400 focus:ring-amber-400"
              maxLength={255}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={!email.trim() || isSubmitting}
            className="w-full font-primary font-bold text-sm py-2.5 h-auto rounded-xl text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Joining...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notify Me When Available
              </span>
            )}
          </Button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2 p-3 rounded-xl ${
              result.success
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`font-secondary text-sm ${result.success ? "text-emerald-800" : "text-red-800"}`}
              >
                {result.message}
              </p>
              {result.position && (
                <p className="font-secondary text-xs text-emerald-600 mt-0.5">
                  Your position: #{result.position}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  },
);

JoinWaitlistForm.displayName = "JoinWaitlistForm";
