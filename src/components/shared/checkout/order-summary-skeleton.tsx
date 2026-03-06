// components/shared/checkout/order-summary-skeleton.tsx
"use client";

import { motion } from "framer-motion";

function SkeletonBlock({ w, h = "h-4" }: { w: string; h?: string }) {
  return <div className={`${h} ${w} bg-gray-200 rounded-full animate-pulse`} />;
}

export function OrderSummarySkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        <SkeletonBlock w="w-48" h="h-6" />
        <SkeletonBlock w="w-32" />
      </motion.div>

      {/* Event info card */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3">
        <SkeletonBlock w="w-64" h="h-5" />
        <SkeletonBlock w="w-40" />
        <SkeletonBlock w="w-36" />
      </div>

      {/* Line items */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-4">
        <SkeletonBlock w="w-28" h="h-5" />
        {[0, 1].map((i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
            <div className="space-y-1.5">
              <SkeletonBlock w="w-36" />
              <SkeletonBlock w="w-20" h="h-3" />
            </div>
            <SkeletonBlock w="w-24" h="h-5" />
          </div>
        ))}
        <div className="flex justify-between items-center pt-2">
          <SkeletonBlock w="w-20" />
          <SkeletonBlock w="w-28" h="h-5" />
        </div>
      </div>

      {/* Promo */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3">
        <SkeletonBlock w="w-32" />
        <div className="flex gap-2">
          <div className="flex-1 h-10 rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-10 w-24 rounded-xl bg-gray-200 animate-pulse" />
        </div>
      </div>

      {/* Payment methods */}
      <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3">
        <SkeletonBlock w="w-40" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
            <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
            <SkeletonBlock w="w-36" />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="h-14 w-full rounded-xl bg-gray-200 animate-pulse" />
    </div>
  );
}