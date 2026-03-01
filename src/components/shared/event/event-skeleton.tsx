// components/shared/event/event-skeleton.tsx
'use client';

import React, { memo } from 'react';

export const EventCardSkeleton: React.FC = memo(() => {
  return (
    <div className="animate-pulse flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm w-full">
      <div className="relative w-full aspect-square bg-gray-200">
        <div className="absolute top-3 right-3 h-5 w-16 rounded-lg bg-gray-300/60" />
      </div>
      <div className="p-4 flex flex-col flex-grow gap-2.5">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-2/3 rounded bg-gray-200" />
        </div>
        <div className="h-3 w-3/4 rounded bg-gray-100" />
        <div className="mt-auto pt-3 border-t-2 border-gray-100 space-y-3">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="h-2 w-16 rounded bg-gray-100" />
              <div className="h-5 w-12 rounded bg-gray-200" />
            </div>
          </div>
          <div className="h-10 w-full rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
});

EventCardSkeleton.displayName = 'EventCardSkeleton';

export interface EventGridSkeletonProps {
  count?: number;
}

export const EventGridSkeleton: React.FC<EventGridSkeletonProps> = memo(({ count = 4 }) => {
  return (
    <div aria-label="Loading events" role="status" className="w-full">
      <span className="sr-only">Loading events...</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
        {Array.from({ length: count }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});

EventGridSkeleton.displayName = 'EventGridSkeleton';