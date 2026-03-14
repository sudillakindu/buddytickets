"use client";

import React, { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Wallet,
  Inbox,
} from "lucide-react";
import { PayoutCard } from "@/components/shared/payout/payout-card";
import { Toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { getOrganizerPayouts } from "@/lib/actions/payout";
import type { SessionUser } from "@/lib/utils/session";
import type { Payout } from "@/lib/types/payout";

const PayoutSkeleton: React.FC = memo(() => (
  <div className="animate-pulse rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-5 w-24 rounded bg-gray-200" />
      <div className="h-6 w-16 rounded-full bg-gray-100" />
    </div>
    <div className="border-t border-dashed border-gray-200" />
    <div className="space-y-2">
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-3/4 rounded bg-gray-100" />
      <div className="h-4 w-1/2 rounded bg-gray-200" />
    </div>
  </div>
));

PayoutSkeleton.displayName = "PayoutSkeleton";

export function OrganizerDashboard({ user }: { user: SessionUser }) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getOrganizerPayouts();
        if (!cancelled) {
          if (result.success) {
            setPayouts(result.payouts ?? []);
          } else {
            Toast("Error", result.message, "error");
          }
        }
      } catch (error) {
        logger.error({
          fn: "OrganizerDashboard.load",
          message: "Failed to load payouts",
          meta: error,
        });
        if (!cancelled)
          Toast("Error", "Failed to load dashboard data.", "error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalRevenue = payouts.reduce((sum, p) => sum + p.gross_revenue, 0);
  const totalNet = payouts.reduce((sum, p) => sum + p.net_payout_amount, 0);

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
              Organizer
            </span>{" "}
            Dashboard
          </h1>
          <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
          <p className="font-secondary text-[hsl(215.4,16.3%,46.9%)] mt-3">
            Welcome back, {user.name}. Manage your events and payouts.
          </p>
        </div>

        {/* --- Stats Overview --- */}
        {!isLoading && payouts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Wallet
                  className="w-4 h-4 text-[hsl(270,70%,50%)]"
                  aria-hidden="true"
                />
                <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                  Total Payouts
                </span>
              </div>
              <p className="font-primary text-2xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                {payouts.length}
              </p>
            </div>
            <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign
                  className="w-4 h-4 text-[hsl(270,70%,50%)]"
                  aria-hidden="true"
                />
                <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                  Gross Revenue
                </span>
              </div>
              <p className="font-primary text-2xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                LKR {totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign
                  className="w-4 h-4 text-emerald-500"
                  aria-hidden="true"
                />
                <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                  Net Earnings
                </span>
              </div>
              <p className="font-primary text-2xl font-semibold text-emerald-600">
                LKR {totalNet.toLocaleString()}
              </p>
            </div>
          </motion.div>
        )}

        {/* --- Payouts Section --- */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet
              className="w-5 h-5 text-[hsl(270,70%,50%)]"
              aria-hidden="true"
            />
            <h2 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              Payouts
            </h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <PayoutSkeleton key={i} />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox
                className="w-12 h-12 text-[hsl(215.4,16.3%,46.9%)] opacity-50 mb-3"
                aria-hidden="true"
              />
              <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
                No payouts yet. Payouts will appear here after your events are
                completed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {payouts.map((payout, index) => (
                <motion.div
                  key={payout.payout_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                >
                  <PayoutCard payout={payout} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
