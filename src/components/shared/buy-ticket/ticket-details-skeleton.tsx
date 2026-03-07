// components/shared/buy-ticket/ticket-details-skeleton.tsx
"use client";

import React, { memo } from "react";

export const TicketDetailsSkeleton: React.FC = memo(() => (
  <div className="animate-pulse w-full min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pb-12">
    {/* ── Banner ── */}
    <div className="relative w-full h-48 sm:h-56 lg:h-64 bg-gray-200">
      <div className="absolute inset-0 flex flex-col justify-end pb-5">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="h-7 w-28 rounded-full bg-gray-300/40 mb-3" />
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="h-5 w-12 rounded-full bg-gray-300/40" />
            <div className="h-5 w-16 rounded-full bg-gray-300/40" />
            <div className="h-5 w-14 rounded-full bg-gray-300/40" />
          </div>
          <div className="h-8 sm:h-9 w-3/4 rounded bg-gray-300/40 mb-1" />
          <div className="h-4 w-1/2 rounded bg-gray-300/40 mt-1" />
        </div>
      </div>
    </div>

    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
    {/* ── Section Header ── */}
    <div className="flex items-center gap-3 mb-6">
      <div className="w-7 h-7 rounded bg-gray-200 shrink-0" />
      <div className="h-7 w-36 rounded bg-gray-200" />
      <div className="flex-1 h-px bg-gray-100" />
    </div>

    {/* ── Ticket Type Cards ── */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-50 h-auto sm:h-[180px]"
        >
          {/* Accent bar */}
          <div className="w-full sm:w-2 h-2 sm:h-full bg-gray-200 shrink-0" />

          {/* Left: Details */}
          <div className="flex-1 px-5 pt-5 pb-4 flex flex-col gap-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0" />
                <div className="h-4 w-32 rounded bg-gray-200" />
              </div>
              <div className="h-5 w-16 rounded-full bg-gray-200 shrink-0" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-gray-200" />
              <div className="h-3 w-5/6 rounded bg-gray-200" />
            </div>
            {/* Capacity bar */}
            <div className="mt-auto space-y-1.5 pt-2">
              <div className="flex justify-between">
                <div className="h-2 w-12 rounded bg-gray-200" />
                <div className="h-2 w-12 rounded bg-gray-200" />
              </div>
              <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="w-1/3 h-full bg-gray-200 rounded-full" />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:flex items-center justify-center relative w-px h-full border-l-2 border-dashed border-gray-100 mx-0 my-2" />

          {/* Right: Price + Stepper */}
          <div className="w-full sm:w-48 px-5 py-4 flex sm:flex-col justify-between items-start gap-3 bg-gray-50/50">
            <div className="space-y-1 w-full flex flex-col items-start">
              <div className="h-2 w-10 rounded bg-gray-200" />
              <div className="h-6 w-24 rounded bg-gray-200 mt-1" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
              <div className="h-5 w-6 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* ── Cart Summary ── */}
    <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white shadow-sm border border-gray-100">
      <div className="space-y-2">
        <div className="h-3 w-20 bg-gray-200 rounded-full" />
        <div className="h-7 w-36 bg-gray-200 rounded-full" />
      </div>
      <div className="h-12 w-52 bg-gray-200 rounded-xl" />
    </div>
    </div>
  </div>
));

TicketDetailsSkeleton.displayName = "TicketDetailsSkeleton";
