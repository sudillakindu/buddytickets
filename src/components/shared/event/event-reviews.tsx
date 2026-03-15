"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, User, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import {
  getEventReviews,
  getUserReviewForEvent,
  createReview,
} from "@/lib/actions/review";
import type { EventReview } from "@/lib/types/review";

interface EventReviewsProps {
  eventId: string;
  isAuthenticated: boolean;
}

function StarRating({
  rating,
  interactive = false,
  onRate,
}: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={cn(
            "p-0 border-0 bg-transparent",
            interactive
              ? "cursor-pointer hover:scale-110 transition-transform"
              : "cursor-default",
          )}
          aria-label={interactive ? `Rate ${i} star${i > 1 ? "s" : ""}` : undefined}
        >
          <Star
            className={cn(
              "w-4 h-4 transition-colors",
              (interactive ? hovered || rating : rating) >= i
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-gray-300",
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const EventReviews = memo<EventReviewsProps>(
  ({ eventId, isAuthenticated }) => {
    const [reviews, setReviews] = useState<EventReview[]>([]);
    const [userHasReview, setUserHasReview] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [newText, setNewText] = useState("");

    useEffect(() => {
      let cancelled = false;

      async function load() {
        const reviewsRes = await getEventReviews(eventId);
        if (!cancelled && reviewsRes.success && reviewsRes.reviews) {
          setReviews(reviewsRes.reviews);
        }

        if (isAuthenticated) {
          const userRes = await getUserReviewForEvent(eventId);
          if (!cancelled && userRes.success && userRes.review) {
            setUserHasReview(true);
          }
        }

        if (!cancelled) setInitialLoading(false);
      }

      load();
      return () => {
        cancelled = true;
      };
    }, [eventId, isAuthenticated]);

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (newRating < 1) {
          toast.error("Please select a rating.");
          return;
        }

        setSubmitting(true);
        try {
          const result = await createReview({
            event_id: eventId,
            rating: newRating,
            review_text: newText.trim() || null,
          });

          if (result.success) {
            toast.success("Review submitted!");
            setUserHasReview(true);
            setNewRating(0);
            setNewText("");
            // Refresh reviews
            const updated = await getEventReviews(eventId);
            if (updated.success && updated.reviews) {
              setReviews(updated.reviews);
            }
          } else {
            toast.error(result.message || "Failed to submit review.");
          }
        } catch {
          toast.error("Something went wrong. Please try again.");
        } finally {
          setSubmitting(false);
        }
      },
      [eventId, newRating, newText],
    );

    if (initialLoading) {
      return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 flex items-center justify-center">
          <Loader2
            className="w-5 h-5 animate-spin text-[hsl(270,70%,50%)]"
            aria-hidden="true"
          />
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-50">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-[hsl(270,70%,50%)]/10 flex items-center justify-center">
            <Star
              className="w-[18px] h-[18px] text-[hsl(270,70%,50%)]"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="font-primary font-bold text-sm uppercase tracking-wider text-[hsl(222.2,47.4%,11.2%)]">
              Reviews
            </h2>
            {reviews.length > 0 && (
              <p className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                {averageRating.toFixed(1)} avg · {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Review list */}
          {reviews.length > 0 ? (
            <div className="flex flex-col gap-3">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.review_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <StarRating rating={review.rating} />
                    <span className="font-secondary text-[11px] text-[hsl(215.4,16.3%,46.9%)]">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="font-secondary text-sm text-[hsl(222.2,47.4%,11.2%)] leading-relaxed">
                      {review.review_text}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5">
                    <User
                      className="w-3 h-3 text-[hsl(215.4,16.3%,46.9%)]"
                      aria-hidden="true"
                    />
                    <span className="font-secondary text-xs text-[hsl(215.4,16.3%,46.9%)]">
                      {review.user_name}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <MessageSquare
                className="w-6 h-6 text-gray-300"
                aria-hidden="true"
              />
              <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
                No reviews yet. Be the first!
              </p>
            </div>
          )}

          {/* Write a review or auth prompt */}
          <AnimatePresence mode="wait">
            {!isAuthenticated ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 rounded-xl bg-[hsl(210,40%,96.1%)] p-4"
              >
                <LogIn
                  className="w-4 h-4 text-[hsl(215.4,16.3%,46.9%)] shrink-0"
                  aria-hidden="true"
                />
                <p className="font-secondary text-sm text-[hsl(215.4,16.3%,46.9%)]">
                  Sign in to leave a review
                </p>
              </motion.div>
            ) : !userHasReview ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4"
              >
                <p className="font-primary font-bold text-xs uppercase tracking-wider text-[hsl(222.2,47.4%,11.2%)]">
                  Write a Review
                </p>
                <StarRating
                  rating={newRating}
                  interactive
                  onRate={setNewRating}
                />
                <textarea
                  placeholder="Share your experience (optional)"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  disabled={submitting}
                  rows={3}
                  className="font-secondary text-sm rounded-xl border border-gray-200 bg-white px-3 py-2 resize-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(270,70%,50%)]/30 focus:border-[hsl(270,70%,50%)] disabled:opacity-50 transition-colors"
                />
                <Button
                  type="submit"
                  disabled={submitting || newRating < 1}
                  className={cn(
                    "w-full font-primary font-bold text-sm py-3 h-auto rounded-xl text-white shadow-md transition-all duration-300",
                    "bg-[hsl(270,70%,50%)] hover:bg-[hsl(270,70%,45%)]",
                    !submitting && "hover:shadow-lg hover:-translate-y-0.5",
                  )}
                >
                  {submitting ? (
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Star className="w-4 h-4" aria-hidden="true" />
                      Submit Review
                    </span>
                  )}
                </Button>
              </motion.form>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    );
  },
);

EventReviews.displayName = "EventReviews";

export default EventReviews;
