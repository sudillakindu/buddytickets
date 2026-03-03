// components/shared/event/event-detail-skeleton.tsx
"use client";

import React, { memo } from "react";

export const EventDetailSkeleton: React.FC = memo(() => (
  <div className="animate-pulse w-full min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]">
    {/* Banner */}
    <div className="w-full h-48 sm:h-64 lg:h-80 bg-gray-200" />

    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
        {/* Left: Gallery + Organizer */}
        <div className="relative z-20 -mt-24 sm:-mt-28 lg:-mt-32 flex flex-col gap-3">
          <div className="aspect-square w-full rounded-2xl bg-gray-200" />
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-2 w-16 rounded bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col gap-5">
          {/* Badges */}
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-gray-200" />
            <div className="h-6 w-20 rounded-full bg-gray-200" />
          </div>
          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="h-5 w-1/2 rounded bg-gray-200" />
            <div className="h-1 w-16 rounded-full bg-gray-200" />
          </div>
          {/* Info rows */}
          <div className="flex flex-col rounded-2xl bg-gray-100 overflow-hidden divide-y divide-gray-200">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center px-5 py-4">
                <div className="h-9 w-9 rounded-xl bg-gray-200 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-20 rounded bg-gray-200" />
                  <div className="h-4 w-40 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
          {/* CTA button */}
          <div className="h-12 w-full rounded-xl bg-gray-200" />
          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-4 w-4/6 rounded bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Tickets section */}
      <div className="mt-12 sm:mt-16 space-y-4">
        <div className="h-7 w-32 rounded bg-gray-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 p-4 space-y-3 bg-white"
            >
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
));

EventDetailSkeleton.displayName = "EventDetailSkeleton";
