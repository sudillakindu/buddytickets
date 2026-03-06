// components/shared/buy-ticket/ticket-cart-skeleton.tsx
"use client";

import { motion } from "framer-motion";

function TicketTypeSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="flex flex-col sm:flex-row rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)] bg-white"
    >
      {/* Accent bar */}
      <div className="w-full sm:w-2 h-2 sm:h-auto shrink-0 bg-gray-200 animate-pulse" />

      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Left details */}
        <div className="flex-1 px-5 pt-5 pb-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="h-4 w-36 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="h-3 w-3/4 bg-gray-100 rounded-full animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="mt-auto space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-3 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 animate-pulse" />
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex sm:flex-col items-center justify-center">
          <div className="w-full sm:w-px h-px sm:h-full border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-gray-200 mx-2 sm:mx-0 my-0 sm:my-2" />
        </div>

        {/* Right price + stepper */}
        <div className="w-full sm:w-48 shrink-0 px-5 py-4 flex sm:flex-col justify-between gap-3">
          <div>
            <div className="h-3 w-10 bg-gray-100 rounded-full animate-pulse mb-1.5" />
            <div className="h-7 w-28 bg-gray-200 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-5 w-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TicketCartSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-6 w-48 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Ticket type skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {[0, 1, 2].map((i) => (
          <TicketTypeSkeleton key={i} index={i} />
        ))}
      </div>

      {/* Bottom bar skeleton */}
      <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white shadow-sm border border-gray-100">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-7 w-36 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-12 w-52 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}