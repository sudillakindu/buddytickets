"use client";

import React, { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Inbox } from "lucide-react";
import { RefundCard } from "@/components/shared/refund/refund-card";
import { Toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { getUserRefundRequests } from "@/lib/actions/refund";
import type { RefundRequest } from "@/lib/types/refund";

const EmptyState: React.FC = memo(() => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-24 text-center px-4 col-span-full"
    role="status"
  >
    <Inbox
      className="w-16 sm:w-20 h-16 sm:h-20 mb-4 opacity-50 text-[hsl(215.4,16.3%,46.9%)]"
      aria-hidden="true"
    />
    <h3 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)] mb-2">
      No Refund Requests
    </h3>
    <p className="font-secondary text-base sm:text-lg text-[hsl(215.4,16.3%,46.9%)] max-w-md mx-auto">
      Your refund requests will appear here. If you need a refund, you can
      request one from your order details.
    </p>
  </motion.div>
));

EmptyState.displayName = "RefundsEmptyState";

const CardSkeleton: React.FC = memo(() => (
  <div className="animate-pulse rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-5 w-32 rounded bg-gray-200" />
      <div className="h-6 w-16 rounded-full bg-gray-100" />
    </div>
    <div className="border-t border-dashed border-gray-200" />
    <div className="h-4 w-3/4 rounded bg-gray-100" />
    <div className="flex justify-between">
      <div className="h-4 w-24 rounded bg-gray-200" />
      <div className="h-4 w-20 rounded bg-gray-100" />
    </div>
  </div>
));

CardSkeleton.displayName = "RefundCardSkeleton";

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getUserRefundRequests();
        if (!cancelled) {
          if (result.success) {
            setRefunds(result.refunds ?? []);
          } else {
            Toast("Error", result.message, "error");
          }
        }
      } catch (error) {
        logger.error({
          fn: "RefundsPage.load",
          message: "Failed to load refund requests",
          meta: error,
        });
        if (!cancelled)
          Toast(
            "Connection Error",
            "Failed to load refund requests. Please check your connection.",
            "error",
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="w-full min-h-[80dvh] bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pt-24 pb-16">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="font-primary text-2xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                  My
                </span>{" "}
                Refunds
              </h1>
              <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
            </div>

            {!isLoading && refunds.length > 0 && (
              <div className="flex items-center gap-2">
                <RefreshCw
                  className="w-4 h-4 text-[hsl(270,70%,50%)]"
                  aria-hidden="true"
                />
                <span className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
                  {refunds.length} request{refunds.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : refunds.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full">
            {refunds.map((refund, index) => (
              <motion.div
                key={refund.refund_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <RefundCard refund={refund} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
