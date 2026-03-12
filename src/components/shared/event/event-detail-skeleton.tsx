// components/shared/event/event-detail-skeleton.tsx
"use client";

import React, { memo } from "react";

export const EventDetailSkeleton: React.FC = memo(() => (
  <div className="animate-pulse w-full min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pb-12">
    {/* --- Banner --- */}
    <div className="w-full h-64 sm:h-64 lg:h-80 bg-gray-200" />

    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14">
        
        {/* --- Left Column: Gallery + Organizer --- */}
        <div className="relative z-20 -mt-40 sm:-mt-40 lg:-mt-56 flex flex-col gap-4">
          {/* Main Image Gallery */}
          <div className="aspect-square w-full rounded-2xl bg-gray-200 border border-gray-100 shadow-sm" />
          
          {/* Organizer Card (Desktop View Only) */}
          <div className="hidden lg:flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
              <div className="h-3 w-16 rounded bg-gray-200" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-20 rounded bg-gray-200" />
            </div>
          </div>
        </div>

        {/* --- Right Column: Event Info --- */}
        <div className="flex flex-col gap-3">
          
          {/* Nav buttons & Badges */}
          <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center">
             <div className="flex items-center justify-between lg:ml-auto lg:gap-2">
               <div className="h-8 w-28 rounded-full bg-gray-200" />
               <div className="h-8 w-20 rounded-full bg-gray-200" />
             </div>
             <div className="flex flex-wrap items-center gap-2 lg:order-first">
               <div className="h-6 w-14 rounded-full bg-gray-200" />
               <div className="h-6 w-20 rounded-full bg-gray-200" />
               <div className="h-6 w-24 rounded-full bg-gray-200" />
             </div>
          </div>

          {/* Title Area */}
          <div className="mt-2 space-y-3">
            <div className="space-y-2">
              <div className="h-8 sm:h-10 w-full rounded bg-gray-200" />
              <div className="h-8 sm:h-10 w-2/3 rounded bg-gray-200" />
            </div>
            <div className="h-4 w-5/6 rounded bg-gray-200 mt-4" />
            <div className="h-1 w-16 rounded-full mt-4 mb-2 bg-gray-200" />
          </div>

          {/* Date / Time / Location Block */}
          <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-50 pt-2 pb-2 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-2 w-16 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 sm:w-2/3 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button Skeleton */}
          <div className="h-[52px] w-full rounded-xl bg-gray-200 mt-1" />

          {/* About Section */}
          <div className="mt-4 space-y-3 overflow-hidden">
            <div className="h-6 w-20 rounded bg-gray-200 mb-3" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-4/5 rounded bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
          </div>

          {/* Organizer Card (Mobile View Only) */}
          <div className="flex lg:hidden items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-sm mt-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
              <div className="h-3 w-16 rounded bg-gray-200" />
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-20 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Tickets Section --- */}
      <div className="mt-8 sm:mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded bg-gray-200 shrink-0" />
          <div className="h-8 w-32 rounded bg-gray-200" />
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-50 h-auto sm:h-[180px]">
               {/* Left accent bar */}
               <div className="w-full sm:w-2 h-2 sm:h-full bg-gray-200 shrink-0" />
               
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

               {/* Divider area skeleton */}
               <div className="hidden sm:flex items-center justify-center relative w-px h-full border-l-2 border-dashed border-gray-100 mx-0 my-2" />
               
               {/* Right side area (Price & Date) */}
               <div className="w-full sm:w-40 px-5 py-4 flex sm:flex-col justify-between items-start sm:items-end gap-3 bg-gray-50/50">
                  <div className="space-y-1 sm:text-right w-full flex flex-col items-start sm:items-end">
                    <div className="h-2 w-10 rounded bg-gray-200" />
                    <div className="h-6 w-24 rounded bg-gray-200 mt-1" />
                  </div>
                  <div className="space-y-1.5 text-right w-full flex flex-col items-end">
                    <div className="h-2 w-16 rounded bg-gray-200" />
                    <div className="h-3 w-20 rounded bg-gray-200" />
                    <div className="h-3 w-16 rounded bg-gray-200" />
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
));

EventDetailSkeleton.displayName = "EventDetailSkeleton";