'use client';

import React, { memo } from 'react';

const TicketCardSkeleton: React.FC = memo(() => {
  return (
    <div className="animate-pulse rounded-2xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-5 sm:p-6 space-y-4 w-full">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-100" />
        </div>
        <div className="h-6 w-16 rounded-full bg-gray-100" />
      </div>
      <div className="border-t border-dashed border-gray-200" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-4 w-24 rounded bg-gray-100" />
        <div className="h-4 w-20 rounded bg-gray-100" />
        <div className="h-4 w-32 rounded bg-gray-100 col-span-2" />
      </div>
      <div className="border-t border-dashed border-gray-200" />
      <div className="flex justify-between">
        <div className="h-4 w-28 rounded bg-gray-100" />
        <div className="h-4 w-20 rounded bg-gray-200" />
      </div>
    </div>
  );
});

TicketCardSkeleton.displayName = 'TicketCardSkeleton';

export interface TicketGridSkeletonProps {
  count?: number;
}

const TicketGridSkeleton: React.FC<TicketGridSkeletonProps> = memo(({ count = 4 }) => {
  return (
    <div aria-label="Loading tickets" role="status" className="w-full">
      <span className="sr-only">Loading tickets...</span>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <TicketCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});

TicketGridSkeleton.displayName = 'TicketGridSkeleton';

export { TicketCardSkeleton, TicketGridSkeleton };