"use client";

import React, { memo } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import type { Review } from "@/lib/types/review";

export interface ReviewCardProps {
  review: Review;
}

const formatDate = (iso: string): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export const ReviewCard: React.FC<ReviewCardProps> = memo(({ review }) => {
  return (
    <div className="rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-4 h-4",
                i < review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200",
              )}
              aria-hidden="true"
            />
          ))}
        </div>
        <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
          {formatDate(review.created_at)}
        </span>
      </div>
      {review.review_text && (
        <p className="font-secondary text-sm text-[hsl(222.2,47.4%,11.2%)] leading-relaxed">
          {review.review_text}
        </p>
      )}
    </div>
  );
});

ReviewCard.displayName = "ReviewCard";
