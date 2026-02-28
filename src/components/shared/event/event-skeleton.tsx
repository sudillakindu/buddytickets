'use client';

import React from 'react';

const EventCardSkeleton = () => (
  <div className="animate-pulse flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
    {/* Image area */}
    <div className="relative w-full aspect-square bg-gray-200">
      <div className="absolute top-3 right-3 h-5 w-16 rounded-lg bg-gray-300/60" />
    </div>
    {/* Content */}
    <div className="p-4 flex flex-col flex-grow gap-2.5">
      {/* Date / time */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-gray-200" />
        <div className="h-3 w-20 rounded bg-gray-200" />
      </div>
      {/* Title */}
      <div className="space-y-1.5">
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-200" />
      </div>
      {/* Location */}
      <div className="h-3 w-3/4 rounded bg-gray-100" />
      {/* Price + button */}
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

const EventGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div aria-label="Loading events" role="status">
    <span className="sr-only">Loading events...</span>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
      {[...Array(count)].map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

EventCardSkeleton.displayName = 'EventCardSkeleton';
EventGridSkeleton.displayName = 'EventGridSkeleton';

export { EventCardSkeleton, EventGridSkeleton };
