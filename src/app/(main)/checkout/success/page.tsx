// app/(main)/checkout/success/page.tsx
// Order confirmation success page.
// Payment gateway redirects here after payment: /checkout/success?order_id=<uuid>
//
// IMPORTANT: The gateway's return_url fires BEFORE the webhook in most cases.
// The page polls the order payment_status until it transitions from PENDING → PAID.
// This gives a good UX even if the webhook fires slightly after the redirect.

"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Ticket,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Loader2,
  Share2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getOrderSuccessData, getOrderPaymentStatus } from "@/lib/actions/order";
import { cn } from "@/lib/ui/utils";
import { formatLKR, formatFullDate, formatTime } from "@/lib/utils/formatting";
import type { OrderSuccessData } from "@/lib/types/payment";

// ─── Status States ────────────────────────────────────────────────────────────

type PageState = "loading" | "confirming" | "confirmed" | "bank_pending" | "error";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [state, setState] = useState<PageState>("loading");
  const [orderData, setOrderData] = useState<OrderSuccessData | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 12; // 12 × 5s = 60s max

  // ── Fetch initial order data ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) {
        setState("error");
        return;
      }
      const result = await getOrderSuccessData(orderId);
      if (!result.success || !result.data) {
        setState("error");
        return;
      }
      setOrderData(result.data);

      if (result.data.payment_status === "PAID") {
        setState("confirmed");
      } else if (result.data.payment_status === "PENDING") {
        // Check if this was a bank transfer (ticket_count = 0 and PENDING)
        if (result.data.ticket_count === 0) {
          setState("confirming"); // polling
        } else {
          setState("bank_pending"); // bank transfer
        }
      } else {
        setState("error");
      }
    };

    fetchData();
  }, [orderId]);

  // ── Poll payment status ────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (!orderId || state !== "confirming") return;

    const result = await getOrderPaymentStatus(orderId);
    if (!result.success) return;

    const newCount = pollCount + 1;
    setPollCount(newCount);

    if (result.status === "PAID") {
      // Refresh order data with ticket count
      const fullResult = await getOrderSuccessData(orderId);
      if (fullResult.success && fullResult.data) {
        setOrderData(fullResult.data);
      }
      setState("confirmed");
    } else if (newCount >= MAX_POLLS) {
      // Timed out — probably bank transfer or webhook delay
      setState("bank_pending");
    }
  }, [orderId, state, pollCount]);

  useEffect(() => {
    if (state !== "confirming") return;
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [state, poll]);

  // ── Share handler ───────────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `I'm going to ${orderData?.event_name ?? "an event"}!`,
          text: `Just got my tickets via BuddyTicket. See you there!`,
          url: window.location.origin + "/events",
        });
      }
    } catch { /* silent fail */ }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────────────────

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[hsl(270,70%,50%)]" />
          <p className="font-secondary text-sm text-gray-500">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (state === "confirming") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-5 text-center max-w-sm"
        >
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-[hsl(270,70%,50%)]/10 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-[hsl(270,70%,50%)]/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[hsl(270,70%,50%)]" />
            </div>
          </div>
          <div>
            <h2 className="font-primary font-black text-xl text-[hsl(222.2,47.4%,11.2%)] mb-2">
              Confirming Payment
            </h2>
            <p className="font-secondary text-sm text-gray-500 leading-relaxed">
              We&apos;re waiting for payment confirmation. This usually takes a few seconds.
              Please don&apos;t close this window.
            </p>
          </div>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: MAX_POLLS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i < pollCount ? "bg-[hsl(270,70%,50%)]" : "bg-gray-200",
                )}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center max-w-sm"
        >
          <AlertCircle className="w-16 h-16 text-red-400" />
          <h2 className="font-primary font-black text-xl text-[hsl(222.2,47.4%,11.2%)]">
            Something Went Wrong
          </h2>
          <p className="font-secondary text-sm text-gray-500">
            We couldn&apos;t load your order details. If you made a payment, please check
            your email or contact support.
          </p>
          <Button asChild className="rounded-xl">
            <Link href="/events">Browse Events</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Confirmed (PAID) or Bank Transfer Pending ─────────────────────────────
  const isPaid = state === "confirmed";

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        {/* ── Success Icon ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex justify-center mb-8"
        >
          <div
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center shadow-lg",
              isPaid
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                : "bg-gradient-to-br from-amber-400 to-amber-600",
            )}
          >
            {isPaid ? (
              <CheckCircle2 className="w-12 h-12 text-white" />
            ) : (
              <Clock className="w-12 h-12 text-white" />
            )}
          </div>
        </motion.div>

        {/* ── Status Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="font-primary font-black text-3xl text-[hsl(222.2,47.4%,11.2%)] mb-2">
            {isPaid ? "Booking Confirmed!" : "Order Received!"}
          </h1>
          <p className="font-secondary text-base text-gray-500 leading-relaxed">
            {isPaid
              ? "Your tickets have been issued. Check your wallet or the link below."
              : "Your order is pending. Your tickets will be issued once payment is confirmed."}
          </p>
        </motion.div>

        {/* ── Order Details Card ── */}
        {orderData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm mb-6"
          >
            <h2 className="font-primary font-black text-base uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)] mb-4">
              {orderData.event_name}
            </h2>

            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 text-sm font-secondary text-gray-600">
                <Calendar className="w-4 h-4 text-[hsl(270,70%,50%)] shrink-0" />
                {formatFullDate(orderData.event_start_at)}
              </div>
              <div className="flex items-center gap-3 text-sm font-secondary text-gray-600">
                <Clock className="w-4 h-4 text-[hsl(270,70%,50%)] shrink-0" />
                {formatTime(orderData.event_start_at)}
              </div>
              <div className="flex items-center gap-3 text-sm font-secondary text-gray-600">
                <MapPin className="w-4 h-4 text-[hsl(270,70%,50%)] shrink-0" />
                {orderData.event_location}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-[hsl(270,70%,50%)]" />
                  <span className="font-secondary text-sm text-gray-500">Tickets</span>
                </div>
                <span className="font-primary font-bold text-sm text-[hsl(222.2,47.4%,11.2%)]">
                  {isPaid
                    ? `${orderData.ticket_count} ticket${orderData.ticket_count > 1 ? "s" : ""}`
                    : "Pending confirmation"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-secondary text-sm text-gray-500">Amount Paid</span>
                <span className="font-primary font-black text-base text-[hsl(270,70%,50%)]">
                  {formatLKR(orderData.final_amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-secondary text-xs text-gray-400">Order ID</span>
                <span className="font-secondary text-xs text-gray-500 font-mono">
                  {orderData.order_id.split("-")[0].toUpperCase()}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Bank Transfer Pending Instructions ── */}
        <AnimatePresence>
          {state === "bank_pending" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl border border-amber-200 bg-amber-50 mb-6"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-secondary text-sm font-semibold text-amber-800 mb-1">
                    Awaiting Payment Confirmation
                  </p>
                  <p className="font-secondary text-xs text-amber-700 leading-relaxed">
                    Once your bank transfer is confirmed by our team, your tickets will
                    automatically appear in your wallet. This typically takes 1–2 business
                    days.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTAs ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          {isPaid && (
            <Button
              asChild
              className="w-full font-primary font-bold text-sm py-4 h-auto rounded-xl text-white bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] hover:bg-[position:100%_0] transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              <Link href="/tickets">
                <Ticket className="w-4 h-4" />
                View My Tickets
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex-1 rounded-xl font-secondary text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1 rounded-xl font-secondary text-sm"
            >
              <Link href="/events">Browse More Events</Link>
            </Button>
          </div>
        </motion.div>

        {/* ── Support note ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center font-secondary text-xs text-gray-400"
        >
          A confirmation email has been sent. Need help?{" "}
          <a
            href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@buddyticket.lk"}`}
            className="text-[hsl(270,70%,50%)] hover:underline"
          >
            Contact Support
          </a>
        </motion.p>
      </div>
    </main>
  );
}