"use client";

import React, { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { logger } from "@/lib/logger";
import { getEventReviews } from "@/lib/actions/review";
import { ReviewCard } from "./review-card";
import type { Review } from "@/lib/types/review";

export interface ReviewSectionProps {
  eventId: string;
}

const ReviewSkeleton: React.FC = memo(() => (
  <div className="animate-pulse rounded-xl border border-[hsl(214.3,31.8%,91.4%)] bg-white p-4 sm:p-5 space-y-3">
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-4 h-4 rounded bg-gray-200" />
      ))}
    </div>
    <div className="h-4 w-3/4 rounded bg-gray-100" />
    <div className="h-4 w-1/2 rounded bg-gray-100" />
  </div>
));

ReviewSkeleton.displayName = "ReviewSkeleton";

export const ReviewSection: React.FC<ReviewSectionProps> = memo(
  ({ eventId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;
      const load = async () => {
        setIsLoading(true);
        try {
          const result = await getEventReviews(eventId);
          if (!cancelled && result.success) {
            setReviews(result.reviews ?? []);
            setAverageRating(result.average_rating ?? 0);
            setTotalCount(result.total_count ?? 0);
          }
        } catch (error) {
          logger.error({
            fn: "ReviewSection.load",
            message: "Failed to load reviews",
            meta: error,
          });
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      load();
      return () => {
        cancelled = true;
      };
    }, [eventId]);

    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare
              className="w-5 h-5 text-[hsl(270,70%,50%)]"
              aria-hidden="true"
            />
            <h3 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              Reviews
            </h3>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ReviewSkeleton key={i} />
            ))}
          </div>
        </div>
      );
    }

    if (totalCount === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare
              className="w-5 h-5 text-[hsl(270,70%,50%)]"
              aria-hidden="true"
            />
            <h3 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              Reviews
            </h3>
          </div>
          <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
            No reviews yet for this event.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare
              className="w-5 h-5 text-[hsl(270,70%,50%)]"
              aria-hidden="true"
            />
            <h3 className="font-primary text-lg font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              Reviews
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star
                className={cn(
                  "w-4 h-4",
                  averageRating > 0
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200",
                )}
                aria-hidden="true"
              />
              <span className="font-primary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
              ({totalCount} review{totalCount !== 1 ? "s" : ""})
            </span>
          </div>
        </div>
        <div className="space-y-3">
          {reviews.map((review, index) => (
            <motion.div
              key={review.review_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ReviewCard review={review} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  },
);

ReviewSection.displayName = "ReviewSection";
