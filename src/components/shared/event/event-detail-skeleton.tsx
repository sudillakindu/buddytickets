// components/shared/event/event-detail-skeleton.tsx
"use client";

import React, { memo } from "react";

export const EventDetailSkeleton: React.FC = memo(() => {
  return (
    <div className="animate-pulse w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="h-4 w-48 bg-gray-200 rounded mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* ── Left: Gallery ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="aspect-square w-full rounded-2xl bg-gray-200" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>

        {/* ── Right: Info ────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* VIP / Category badges */}
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-gray-200" />
            <div className="h-6 w-20 rounded-full bg-gray-200" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="h-5 w-1/2 rounded bg-gray-200" />
          </div>

          {/* Meta row */}
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-gray-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="h-8 w-8 rounded-lg bg-gray-200 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-40 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-4 w-4/6 rounded bg-gray-200" />
          </div>

          {/* Ticket types */}
          <div className="space-y-3">
            <div className="h-5 w-32 rounded bg-gray-200" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="h-5 w-32 rounded bg-gray-200" />
                  <div className="h-5 w-24 rounded bg-gray-200" />
                </div>
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-2 w-full rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

EventDetailSkeleton.displayName = "EventDetailSkeleton";