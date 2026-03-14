"use client";

import React, { useState, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { Star, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface ReviewFormProps {
  eventId: string;
  ticketId: string;
  onSubmit: (data: {
    event_id: string;
    ticket_id: string;
    rating: number;
    review_text: string;
  }) => Promise<{ success: boolean; message: string }>;
}

const StarRating: React.FC<{
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}> = memo(({ value, onChange, disabled }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={cn(
            "p-0.5 transition-all duration-150 focus:outline-none",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          )}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          role="radio"
          aria-checked={value === star}
        >
          <Star
            className={cn(
              "w-7 h-7 transition-all duration-150",
              (hovered || value) >= star
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-gray-300",
              !disabled && hovered >= star && "scale-110",
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 font-secondary text-sm font-semibold text-amber-600">
          {value}/5
        </span>
      )}
    </div>
  );
});

StarRating.displayName = "StarRating";

export const ReviewForm: React.FC<ReviewFormProps> = memo(
  ({ eventId, ticketId, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
      success: boolean;
      message: string;
    } | null>(null);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        setResult(null);

        const response = await onSubmit({
          event_id: eventId,
          ticket_id: ticketId,
          rating,
          review_text: reviewText.trim(),
        });

        setResult(response);
        setIsSubmitting(false);
      },
      [rating, reviewText, eventId, ticketId, onSubmit],
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500" />
          <h4 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
            Leave a Review
          </h4>
        </div>

        <p className="font-secondary text-xs text-gray-400">
          Share your experience to help others find great events.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-secondary text-xs text-gray-500">
              Your Rating
            </Label>
            <StarRating
              value={rating}
              onChange={setRating}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="review-text"
              className="font-secondary text-xs text-gray-500"
            >
              Your Review{" "}
              <span className="text-gray-300">(optional)</span>
            </Label>
            <Textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you enjoy most about this event?"
              className="text-sm rounded-xl border-gray-200 focus:border-[hsl(270,70%,50%)] focus:ring-[hsl(270,70%,50%)] min-h-[100px]"
              maxLength={2000}
              disabled={isSubmitting}
            />
            <p className="font-secondary text-xs text-gray-300 text-right">
              {reviewText.length}/2000
            </p>
          </div>

          <Button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className={cn(
              "w-full font-primary font-bold text-sm py-2.5 h-auto rounded-xl text-white shadow-sm transition-all",
              rating > 0
                ? "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] hover:shadow-md"
                : "bg-gray-300",
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Review"
            )}
          </Button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-2 p-3 rounded-xl ${
              result.success
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            )}
            <p
              className={`font-secondary text-sm ${result.success ? "text-emerald-800" : "text-red-800"}`}
            >
              {result.message}
            </p>
          </motion.div>
        )}
      </motion.div>
    );
  },
);

ReviewForm.displayName = "ReviewForm";
