"use client";

import React, { useEffect, useState, memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, User, MessageSquare } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { getEventReviews } from "@/lib/actions/review";

interface ReviewDisplay {
  review_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user: {
    name: string;
    image_url: string | null;
  };
}

interface ReviewsSectionProps {
  eventId: string;
}

const StarRating: React.FC<{ rating: number; size?: string }> = memo(
  ({ rating, size = "w-4 h-4" }) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size,
            i < rating
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200",
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  ),
);
StarRating.displayName = "StarRating";

const ReviewCard: React.FC<{ review: ReviewDisplay; index: number }> = memo(
  ({ review, index }) => {
    const date = new Date(review.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.06 }}
        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[hsl(270,70%,50%)]/10 shrink-0">
            {review.user.image_url ? (
              <Image
                src={review.user.image_url}
                alt={review.user.name}
                fill
                sizes="36px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User
                  className="w-4 h-4 text-[hsl(270,70%,50%)]"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-primary font-bold text-sm text-[hsl(222.2,47.4%,11.2%)] truncate">
                {review.user.name}
              </p>
              <p className="font-secondary text-[10px] text-gray-400 shrink-0">
                {date}
              </p>
            </div>
            <StarRating rating={review.rating} size="w-3.5 h-3.5" />
            {review.review_text && (
              <p className="font-secondary text-xs text-gray-600 mt-2 leading-relaxed">
                {review.review_text}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
);
ReviewCard.displayName = "ReviewCard";

export const ReviewsSection: React.FC<ReviewsSectionProps> = memo(
  ({ eventId }) => {
    const [reviews, setReviews] = useState<ReviewDisplay[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;
      const load = async () => {
        try {
          const result = await getEventReviews(eventId);
          if (!cancelled && result.success) {
            setReviews(result.reviews ?? []);
            setAverageRating(result.average_rating ?? 0);
            setTotalCount(result.total_count ?? 0);
          }
        } catch {
          /* silently fail — reviews are non-critical */
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
        <div className="mt-8 animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-gray-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-white p-4 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="h-3 w-20 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="h-4 w-full rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (totalCount === 0) return null;

    return (
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8"
        aria-label="Event Reviews"
      >
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare
            className="w-7 h-7 text-[hsl(270,70%,50%)]"
            aria-hidden="true"
          />
          <h2 className="font-primary text-xl sm:text-2xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
              Reviews
            </span>
          </h2>
          <div className="flex items-center gap-2 ml-auto">
            <StarRating rating={Math.round(averageRating)} />
            <span className="font-primary font-bold text-sm text-[hsl(222.2,47.4%,11.2%)]">
              {averageRating}
            </span>
            <span className="font-secondary text-xs text-gray-400">
              ({totalCount})
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review, index) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              index={index}
            />
          ))}
        </div>
      </motion.section>
    );
  },
);

ReviewsSection.displayName = "ReviewsSection";
