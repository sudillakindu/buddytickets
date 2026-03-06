// app/(main)/checkout/cancel/page.tsx
// Shown when user cancels the PayHere payment flow.
// PayHere redirects here via the cancel_url parameter.
// The order remains PENDING (not FAILED) until it either:
//   - Times out (reservation expires → cron marks EXPIRED)
//   - User retries
//   - PayHere sends a failure webhook

"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, RotateCcw, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] flex items-center justify-center px-4 pt-16 pb-16">
      <div className="max-w-md mx-auto text-center">
        {/* ── Cancel Icon ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex justify-center mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
            <XCircle className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* ── Message ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="font-primary font-black text-3xl text-[hsl(222.2,47.4%,11.2%)] mb-3">
            Payment Cancelled
          </h1>
          <p className="font-secondary text-base text-gray-500 leading-relaxed">
            Your payment was cancelled and no charge was made.
            Your ticket reservation may still be active — you can try again.
          </p>

          {orderId && (
            <p className="mt-3 font-secondary text-xs text-gray-400">
              Order reference:{" "}
              <span className="font-mono font-semibold text-gray-500">
                {orderId.split("-")[0].toUpperCase()}
              </span>
            </p>
          )}
        </motion.div>

        {/* ── Info card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm mb-8 text-left"
        >
          <h3 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)] mb-3">
            What happened?
          </h3>
          <ul className="space-y-2">
            {[
              "Your payment was cancelled before completion.",
              "No money has been deducted from your account.",
              "Your ticket reservation may still be active (held for 10 min).",
              "You can return and retry the payment at any time.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 font-secondary text-sm text-gray-600">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[hsl(270,70%,50%)] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ── CTAs ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          <Button
            asChild
            className="w-full font-primary font-bold text-sm py-4 h-auto rounded-xl text-white bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] hover:bg-[position:100%_0] transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            <Link href="/events">
              <RotateCcw className="w-4 h-4" />
              Browse Events & Try Again
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl font-secondary text-sm"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              Return to Home
            </Link>
          </Button>
        </motion.div>

        {/* ── Support ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 font-secondary text-xs text-gray-400"
        >
          If money was deducted despite the cancellation, please{" "}
          <a
            href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@buddyticket.lk"}`}
            className="text-[hsl(270,70%,50%)] hover:underline"
          >
            contact our support team
          </a>{" "}
          immediately with your order reference.
        </motion.p>
      </div>
    </main>
  );
}