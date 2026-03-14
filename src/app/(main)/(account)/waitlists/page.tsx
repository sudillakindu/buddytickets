"use client";

import React, { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { Clock, Inbox } from "lucide-react";
import { WaitlistCard } from "@/components/shared/waitlist/waitlist-card";
import { Toast } from "@/components/ui/toast";
import { logger } from "@/lib/logger";
import { getUserWaitlistEntries } from "@/lib/actions/waitlist";
import type { WaitlistEntry } from "@/lib/types/waitlist";

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
      No Waitlist Entries
    </h3>
    <p className="font-secondary text-base sm:text-lg text-[hsl(215.4,16.3%,46.9%)] max-w-md mx-auto">
      When you join a waitlist for a sold-out event, your entries will appear
      here. We&apos;ll notify you when tickets become available!
    </p>
  </motion.div>
));

EmptyState.displayName = "WaitlistsEmptyState";

const CardSkeleton: React.FC = memo(() => (
  <div className="animate-pulse rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-5 w-32 rounded bg-gray-200" />
      <div className="h-6 w-16 rounded-full bg-gray-100" />
    </div>
    <div className="border-t border-dashed border-gray-200" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-4 w-24 rounded bg-gray-100" />
      <div className="h-4 w-32 rounded bg-gray-100" />
    </div>
    <div className="border-t border-dashed border-gray-200" />
    <div className="h-4 w-28 rounded bg-gray-100" />
  </div>
));

CardSkeleton.displayName = "WaitlistCardSkeleton";

export default function WaitlistsPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await getUserWaitlistEntries();
        if (!cancelled) {
          if (result.success) {
            setEntries(result.entries ?? []);
          } else {
            Toast("Error", result.message, "error");
          }
        }
      } catch (error) {
        logger.error({
          fn: "WaitlistsPage.load",
          message: "Failed to load waitlist entries",
          meta: error,
        });
        if (!cancelled)
          Toast(
            "Connection Error",
            "Failed to load waitlist entries. Please check your connection.",
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
                Waitlists
              </h1>
              <div className="h-1.5 w-20 rounded-full mt-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
            </div>

            {!isLoading && entries.length > 0 && (
              <div className="flex items-center gap-2">
                <Clock
                  className="w-4 h-4 text-[hsl(270,70%,50%)]"
                  aria-hidden="true"
                />
                <span className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
                  {entries.length} entr{entries.length !== 1 ? "ies" : "y"}
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
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.waitlist_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <WaitlistCard entry={entry} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
