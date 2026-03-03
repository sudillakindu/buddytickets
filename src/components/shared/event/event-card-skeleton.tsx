// components/shared/event/event-card-skeleton.tsx
"use client";

import React, { memo } from "react";

// ─── Single Card Skeleton ─────────────────────────────────────────────────────

export const EventCardSkeleton: React.FC = memo(() => (
  <div className="animate-pulse flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm w-full">
    {/* ── Thumbnail ── */}
    <div className="relative w-full aspect-square bg-gray-100/80">
      {/* Top Left Badge (VIP/Live) */}
      <div className="absolute top-3 left-3 h-6 w-14 rounded-lg bg-gray-200/80 backdrop-blur-md" />
      {/* Top Right Badge (Category) */}
      <div className="absolute top-3 right-3 h-6 w-16 rounded-lg bg-gray-200/80 backdrop-blur-md" />
    </div>

    {/* ── Card Body ── */}
    <div className="p-4 flex flex-col flex-grow gap-2.5">
      {/* Date & time row */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-full bg-gray-200" />
          <div className="h-3 w-12 rounded bg-gray-200" />
        </div>
      </div>

      {/* Name & location */}
      <div className="flex flex-col gap-1.5 mt-1">
        <div className="space-y-1.5">
          <div className="h-5 w-full rounded bg-gray-200" />
          <div className="h-5 w-3/4 rounded bg-gray-200" />
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-3.5 h-3.5 flex-shrink-0 rounded-full bg-gray-200" />
          <div className="h-3 w-2/3 rounded bg-gray-200" />
        </div>
      </div>

      {/* Price & CTA */}
      <div className="flex flex-col mt-auto pt-3 border-t-2 border-gray-50 gap-3">
        <div className="space-y-1.5">
          <div className="h-2 w-16 rounded bg-gray-200" />
          <div className="h-5 w-24 rounded bg-gray-200" />
        </div>
        <div className="h-[44px] w-full rounded-xl bg-gray-200 mt-1" />
      </div>
    </div>
  </div>
));

EventCardSkeleton.displayName = "EventCardSkeleton";

// ─── Grid Skeleton ────────────────────────────────────────────────────────────

interface EventGridSkeletonProps {
  count?: number;
}

export const EventGridSkeleton: React.FC<EventGridSkeletonProps> = memo(
  ({ count = 8 }) => (
    <div aria-label="Loading events" role="status" className="w-full">
      <span className="sr-only">Loading events...</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
        {Array.from({ length: count }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  ),
);

EventGridSkeleton.displayName = "EventGridSkeleton";