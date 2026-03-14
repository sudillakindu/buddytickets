"use client";

import React, { useState, useEffect, memo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Crown,
  User,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Share2,
  ImageOff,
  CheckCircle2,
  AlertCircle,
  Radio,
  Info,
  Bell,
  Loader2,
  Mail,
  Star,
  MessageSquare,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EVENT_STATUS_PILLS,
  FALLBACK_STATUS_PILL,
} from "@/lib/constants/event-status";
import type { EventDetails, EventStatus, TicketType } from "@/lib/types/event";
import { joinWaitlist, getEventReviews, submitReview, getReviewEligibility } from "@/lib/actions/event";
import LogoSrc from "@/app/assets/images/logo/upscale_media_logo.png";

interface StatusConfig {
  label: string;
  pillClass: string;
  buttonText: string;
  buttonClass: string;
  buttonDisabled: boolean;
  isActive: boolean;
}

const BUTTON_OVERRIDES: Record<EventStatus, Omit<StatusConfig, "label" | "pillClass">> = {
  ON_SALE: {
    buttonText: "Book Ticket",
    buttonClass:
      "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] hover:bg-[position:100%_0] transition-[background-position] duration-500",
    buttonDisabled: false,
    isActive: true,
  },
  ONGOING: {
    buttonText: "Live Now",
    buttonClass:
      "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-emerald-500 to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] hover:bg-[position:100%_0] transition-[background-position] duration-500",
    buttonDisabled: false,
    isActive: true,
  },
  PUBLISHED: {
    buttonText: "Upcoming",
    buttonClass: "bg-[#C76E00]",
    buttonDisabled: true,
    isActive: false,
  },
  SOLD_OUT: {
    buttonText: "Sold Out",
    buttonClass: "bg-red-600",
    buttonDisabled: true,
    isActive: false,
  },
  COMPLETED: {
    buttonText: "Completed",
    buttonClass: "bg-emerald-600",
    buttonDisabled: true,
    isActive: false,
  },
  CANCELLED: {
    buttonText: "Cancelled",
    buttonClass: "bg-gray-400",
    buttonDisabled: true,
    isActive: false,
  },
  DRAFT: {
    buttonText: "Draft",
    buttonClass: "bg-gray-200",
    buttonDisabled: true,
    isActive: false,
  },
};

function getStatusConfig(status: EventStatus): StatusConfig {
  const pill = EVENT_STATUS_PILLS[status] ?? FALLBACK_STATUS_PILL;
  const button = BUTTON_OVERRIDES[status] ?? {
    buttonText: "Unavailable",
    buttonClass: "bg-gray-400",
    buttonDisabled: true,
    isActive: false,
  };
  return { ...pill, ...button };
}

const formatFullDate = (iso: string): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";
const formatTime = (iso: string): string =>
  iso
    ? new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const formatPrice = (price: number | null): string => {
  if (price === null) return "—";
  if (price === 0) return "Free";
  return `LKR ${price.toLocaleString()}`;
};

const formatSaleEndParts = (
  saleEndAt: string | null,
  eventEndAt: string,
): { date: string; time: string } => {
  const source = saleEndAt ?? eventEndAt;
  const date = new Date(source).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = new Date(source).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
};

interface ImageGalleryProps {
  images: { image_url: string; priority_order: number }[];
  eventName: string;
}

const ImageGallery = memo<ImageGalleryProps>(({ images, eventName }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const handleError = useCallback(
    (idx: number) => setImgErrors((prev) => ({ ...prev, [idx]: true })),
    [],
  );
  const handlePrev = useCallback(
    () =>
      images.length > 1 &&
      setActiveIndex((p) => (p - 1 + images.length) % images.length),
    [images.length],
  );
  const handleNext = useCallback(
    () => images.length > 1 && setActiveIndex((p) => (p + 1) % images.length),
    [images.length],
  );

  const activeImage = images[activeIndex] ?? null;

  return (
    <div className="flex flex-col gap-3 max-w-[90%] mx-auto lg:max-w-none">
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {!activeImage || imgErrors[activeIndex] ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 bg-gray-50">
                <ImageOff className="w-10 h-10" aria-hidden="true" />
                <span className="text-sm font-secondary">
                  Image unavailable
                </span>
              </div>
            ) : (
              <Image
                src={activeImage.image_url}
                alt={`${eventName} — image ${activeIndex + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
                className="object-cover"
                onError={() => handleError(activeIndex)}
                priority={activeIndex === 0}
              />
            )}
          </motion.div>
        </AnimatePresence>
        {images.length > 1 && (
          <>
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-secondary px-2.5 py-1 rounded-full backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </div>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
});
ImageGallery.displayName = "ImageGallery";

interface EventTicketCardProps {
  ticket: TicketType;
  eventStatus: EventStatus;
  eventEndAt: string;
}

const EventTicketCard = memo<EventTicketCardProps>(
  ({ ticket, eventStatus, eventEndAt }) => {
    const available = Math.max(0, ticket.capacity - ticket.qty_sold);
    const soldPct =
      ticket.capacity > 0
        ? Math.min(100, Math.round((ticket.qty_sold / ticket.capacity) * 100))
        : 0;

    const isTicketSoldOut = available <= 0;
    const isExpired = ticket.sale_end_at
      ? new Date(ticket.sale_end_at) < new Date()
      : false;
    const notStarted = ticket.sale_start_at
      ? new Date(ticket.sale_start_at) > new Date()
      : false;
    const canBook =
      !isTicketSoldOut &&
      !isExpired &&
      !notStarted &&
      (eventStatus === "ON_SALE" || eventStatus === "ONGOING");

    const inclusions = Array.isArray(ticket.inclusions)
      ? ticket.inclusions
      : [];
    const accentColor = canBook ? "hsl(262 83% 58%)" : "hsl(220 9% 70%)";
    const barColor =
      soldPct >= 90
        ? "bg-red-500"
        : soldPct >= 60
          ? "bg-amber-400"
          : "bg-emerald-500";
    const statusBadge = isTicketSoldOut
      ? { label: "Sold Out", cls: "bg-red-100 text-red-600" }
      : isExpired
        ? { label: "Sale Ended", cls: "bg-gray-100 text-gray-500" }
        : notStarted
          ? { label: "Coming Soon", cls: "bg-amber-100 text-amber-600" }
          : null;

    return (
      <div
        className={cn(
          "relative flex flex-col sm:flex-row rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.08)] transition-shadow duration-300",
          canBook ? "hover:shadow-[0_6px_28px_rgba(0,0,0,0.14)]" : "opacity-80",
        )}
      >
        <div
          className="w-full sm:w-2 h-2 sm:h-auto shrink-0"
          style={{ background: accentColor }}
        />
        <div
          className={cn(
            "flex-1 flex flex-col sm:flex-row",
            canBook ? "bg-white" : "bg-gray-50",
          )}
        >
          <div className="flex-1 min-w-0 px-5 pt-5 pb-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Ticket
                  className="w-4 h-4 shrink-0"
                  style={{ color: accentColor }}
                  aria-hidden="true"
                />
                <h4
                  className={cn(
                    "font-primary font-black text-sm uppercase tracking-wide leading-tight truncate",
                    canBook ? "text-[hsl(222.2,47.4%,11.2%)]" : "text-gray-400",
                  )}
                >
                  {ticket.name}
                </h4>
              </div>
              {statusBadge && (
                <span
                  className={cn(
                    "shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full",
                    statusBadge.cls,
                  )}
                >
                  {statusBadge.label}
                </span>
              )}
            </div>
            {ticket.description && (
              <p className="font-secondary text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {ticket.description}
              </p>
            )}
            {inclusions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {inclusions.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-[11px] font-secondary font-semibold px-2.5 py-1 rounded-full border"
                    style={{
                      background: `${accentColor}18`,
                      color: accentColor,
                      borderColor: `${accentColor}45`,
                    }}
                  >
                    <CheckCircle2
                      className="w-3 h-3 shrink-0"
                      aria-hidden="true"
                    />
                    {item}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-auto space-y-1.5">
              <div className="flex justify-between text-[10px] font-secondary text-gray-400">
                <span>{ticket.qty_sold.toLocaleString()} sold</span>
                <span>
                  {available > 0
                    ? `${available.toLocaleString()} left`
                    : "0 left"}
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    barColor,
                  )}
                  style={{ width: `${soldPct}%` }}
                />
              </div>
            </div>
          </div>
          <div className="relative flex sm:flex-col items-center justify-center">
            <span
              className="absolute rounded-full w-4 h-4 border border-gray-200 z-10 left-0 sm:left-auto sm:top-0 -translate-x-1/2 sm:translate-x-0 sm:-translate-y-1/2"
              style={{
                background: canBook ? "hsl(210 40% 96.1%)" : "hsl(220 9% 95%)",
              }}
            />
            <span
              className="absolute rounded-full w-4 h-4 border border-gray-200 z-10 right-0 sm:right-auto sm:bottom-0 translate-x-1/2 sm:translate-x-0 sm:translate-y-1/2"
              style={{
                background: canBook ? "hsl(210 40% 96.1%)" : "hsl(220 9% 95%)",
              }}
            />
            <div className="w-full sm:w-px h-px sm:h-full border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-gray-200 mx-2 sm:mx-0 my-0 sm:my-2" />
          </div>
          <div
            className={cn(
              "w-full sm:w-40 shrink-0 px-5 py-4 flex sm:flex-col justify-between gap-3",
              canBook ? "bg-white" : "bg-gray-50",
            )}
          >
            <div>
              <p className="font-secondary text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">
                Price
              </p>
              <p
                className={cn(
                  "font-primary font-black text-2xl leading-none",
                  canBook ? "text-[hsl(222.2,47.4%,11.2%)]" : "text-gray-400",
                )}
              >
                {formatPrice(ticket.price)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-secondary text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                Sale Ends
              </p>
              <div className="flex items-start gap-1.5 justify-end">
                <div className="text-right">
                  <p className="font-secondary text-[11px] leading-snug text-gray-600">
                    {formatSaleEndParts(ticket.sale_end_at, eventEndAt).date}
                  </p>
                  <p className="font-secondary text-[11px] leading-snug text-gray-500">
                    {formatSaleEndParts(ticket.sale_end_at, eventEndAt).time}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
EventTicketCard.displayName = "EventTicketCard";

// --- Waitlist Section ---

interface WaitlistSectionProps {
  eventId: string;
  userEmail?: string;
}

const WaitlistSection: React.FC<WaitlistSectionProps> = memo(
  ({ eventId, userEmail }) => {
    const [email, setEmail] = useState(userEmail ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [joined, setJoined] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!email.trim()) {
          setError("Please enter your email address.");
          return;
        }

        setIsSubmitting(true);
        try {
          const result = await joinWaitlist(eventId, email.trim());
          if (result.success) {
            setJoined(true);
            setMessage(result.message);
          } else {
            if (result.message === "UNAUTHENTICATED") {
              setError("Please sign in to join the waitlist.");
            } else {
              setError(result.message);
            }
          }
        } catch {
          setError("Something went wrong. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      },
      [eventId, email],
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Bell
              className="w-[18px] h-[18px] text-amber-600"
              aria-hidden="true"
            />
          </div>
          <div>
            <h3 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
              Join Waitlist
            </h3>
            <p className="font-secondary text-xs text-gray-500">
              Get notified when tickets become available
            </p>
          </div>
        </div>

        {joined ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-4"
          >
            <CheckCircle2
              className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="font-secondary text-sm font-semibold text-emerald-700">
                You&apos;re on the list!
              </p>
              <p className="font-secondary text-xs text-emerald-600 mt-0.5">
                {message}
              </p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-9 rounded-xl text-sm font-secondary h-10"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "rounded-xl font-primary font-bold text-sm h-10 px-5 text-white shadow-sm",
                  "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Notify Me"
                )}
              </Button>
            </div>
            {error && (
              <p className="font-secondary text-xs text-red-600">{error}</p>
            )}
          </form>
        )}
      </motion.div>
    );
  },
);

WaitlistSection.displayName = "WaitlistSection";

// --- Review Components ---

interface ReviewDisplayItem {
  review_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user: {
    name: string;
    image_url: string | null;
  };
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

const ReviewCard: React.FC<{ review: ReviewDisplayItem; index: number }> = memo(
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

// --- Review Form ---

interface ReviewFormProps {
  eventId: string;
  ticketId: string;
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = memo(
  ({ eventId, ticketId, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (rating < 1) {
          setError("Please select a star rating.");
          return;
        }

        setIsSubmitting(true);
        try {
          const result = await submitReview(
            eventId,
            ticketId,
            rating,
            reviewText,
          );
          if (result.success) {
            setSubmitted(true);
            onReviewSubmitted();
          } else {
            setError(
              result.message === "UNAUTHENTICATED"
                ? "Please sign in to submit a review."
                : result.message,
            );
          }
        } catch {
          setError("Something went wrong. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      },
      [eventId, ticketId, rating, reviewText, onReviewSubmitted],
    );

    if (submitted) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 flex items-start gap-3"
        >
          <CheckCircle2
            className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="font-primary font-bold text-sm text-emerald-700">
              Thank you for your review!
            </p>
            <p className="font-secondary text-xs text-emerald-600 mt-0.5">
              Your feedback helps others discover great events.
            </p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-purple-100 bg-purple-50/60 p-5 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
            <Send
              className="w-[18px] h-[18px] text-[hsl(270,70%,50%)]"
              aria-hidden="true"
            />
          </div>
          <div>
            <h3 className="font-primary font-bold text-sm uppercase tracking-wide text-[hsl(222.2,47.4%,11.2%)]">
              Write a Review
            </h3>
            <p className="font-secondary text-xs text-gray-500">
              Share your experience with others
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-secondary text-xs font-medium text-gray-600 mb-1.5 block">
              Your Rating
            </label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  onMouseEnter={() => setHoverRating(i + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight" && i < 4) setRating(i + 2);
                    if (e.key === "ArrowLeft" && i > 0) setRating(i);
                  }}
                  className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(270,70%,50%)] rounded"
                  aria-label={`Rate ${i + 1} star${i > 0 ? "s" : ""}`}
                >
                  <Star
                    className={cn(
                      "w-7 h-7 transition-colors",
                      i < (hoverRating || rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-300",
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="font-secondary text-xs text-gray-500 ml-2">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="review-text"
              className="font-secondary text-xs font-medium text-gray-600 mb-1.5 block"
            >
              Your Review{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell others about your experience..."
              maxLength={500}
              rows={3}
              disabled={isSubmitting}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-secondary ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(270,70%,50%)] disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="font-secondary text-[10px] text-gray-400 mt-1 text-right">
              {reviewText.length}/500
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || rating < 1}
            className={cn(
              "w-full rounded-xl font-primary font-bold text-sm h-10 text-white shadow-sm",
              "bg-gradient-to-r from-[hsl(270,70%,50%)] to-[hsl(270,60%,60%)] hover:from-[hsl(270,70%,45%)] hover:to-[hsl(270,60%,55%)]",
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-4 h-4" aria-hidden="true" />
                Submit Review
              </span>
            )}
          </Button>

          {error && (
            <p className="font-secondary text-xs text-red-600">{error}</p>
          )}
        </form>
      </motion.div>
    );
  },
);

ReviewForm.displayName = "ReviewForm";

// --- Reviews Section ---

const ReviewsSection: React.FC<{ eventId: string }> = memo(({ eventId }) => {
  const [reviews, setReviews] = useState<ReviewDisplayItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [eligibleTicketId, setEligibleTicketId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [reviewsResult, eligibilityResult] = await Promise.all([
          getEventReviews(eventId),
          getReviewEligibility(eventId),
        ]);
        if (!cancelled) {
          if (reviewsResult.success) {
            setReviews((reviewsResult.reviews ?? []) as ReviewDisplayItem[]);
            setAverageRating(reviewsResult.average_rating ?? 0);
            setTotalCount(reviewsResult.total_count ?? 0);
          }
          if (eligibilityResult.success && eligibilityResult.canReview) {
            setCanReview(true);
            setEligibleTicketId(eligibilityResult.ticketId ?? null);
          }
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
  }, [eventId, refreshKey]);

  const handleReviewSubmitted = useCallback(() => {
    setCanReview(false);
    setRefreshKey((k) => k + 1);
  }, []);

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

  if (totalCount === 0 && !canReview) return null;

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
        {totalCount > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <StarRating rating={Math.round(averageRating)} />
            <span className="font-primary font-bold text-sm text-[hsl(222.2,47.4%,11.2%)]">
              {averageRating}
            </span>
            <span className="font-secondary text-xs text-gray-400">
              ({totalCount})
            </span>
          </div>
        )}
      </div>

      {canReview && eligibleTicketId && (
        <div className="mb-6">
          <ReviewForm
            eventId={eventId}
            ticketId={eligibleTicketId}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      )}

      {totalCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review, index) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              index={index}
            />
          ))}
        </div>
      )}

      {totalCount === 0 && !canReview && (
        <p className="font-secondary text-sm text-gray-500">
          No reviews yet. Be the first to share your experience!
        </p>
      )}
    </motion.section>
  );
});

ReviewsSection.displayName = "ReviewsSection";

// --- Event Detail ---

interface EventDetailProps {
  event: EventDetails;
}

export const EventDetail: React.FC<EventDetailProps> = memo(({ event }) => {
  const router = useRouter();
  const buyTicketHref = `/events/${event.event_id}/buy-tickets`;
  const statusCfg = getStatusConfig(event.status);

  const handleShare = useCallback(async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `/events/${event.event_id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.name,
          text: event.subtitle || event.description,
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
    } catch {}
  }, [event.event_id, event.name, event.subtitle, event.description]);

  const handleCTA = useCallback(() => {
    if (statusCfg.isActive) router.push(buyTicketHref);
  }, [statusCfg.isActive, buyTicketHref, router]);

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pb-12">
      <div className="relative w-full h-64 sm:h-64 lg:h-80 overflow-hidden bg-gray-200">
        {event.banner_image ? (
          <>
            <Image
              src={event.banner_image}
              alt={`${event.name} banner`}
              fill
              sizes="100vw"
              unoptimized
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.4))]" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={LogoSrc}
              alt="BuddyTickets Logo"
              width={180}
              height={180}
              className="w-28 h-28 sm:w-36 lg:w-44 object-contain"
              priority
            />
          </div>
        )}
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-20 -mt-40 sm:-mt-40 lg:-mt-56"
          >
            <ImageGallery images={event.images} eventName={event.name} />
            <div className="hidden lg:flex items-center justify-between p-4 mt-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[hsl(270,70%,50%)]/10 shrink-0">
                  {event.organizer.image_url ? (
                    <Image
                      src={event.organizer.image_url}
                      alt={event.organizer.name}
                      fill
                      sizes="40px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User
                        className="w-5 h-5 text-[hsl(270,70%,50%)]"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
                <p className="font-secondary text-[14px] uppercase tracking-wider text-gray-400 font-semibold">
                  Organizer
                </p>
              </div>
              <div className="text-right min-w-0">
                <p className="font-primary font-bold text-sm text-[hsl(222.2,47.4%,11.2%)] truncate">
                  {event.organizer.name}
                </p>
                <p className="font-secondary text-xs text-gray-400 truncate">
                  @{event.organizer.username}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center">
              <div className="flex items-center justify-between lg:ml-auto lg:gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-8 px-3 rounded-full text-xs font-secondary"
                >
                  <Link href="/events">
                    <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />{" "}
                    Back to Events
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="h-8 px-3 rounded-full text-xs font-secondary"
                  aria-label="Share this event"
                >
                  <Share2 className="w-3 h-3" aria-hidden="true" /> Share
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:order-first">
                {event.is_vip && (
                  <span className="inline-flex items-center gap-1 bg-yellow-400/90 text-yellow-900 px-3 py-1 rounded-full border border-yellow-300 text-xs font-bold uppercase tracking-wide">
                    <Crown className="w-3.5 h-3.5" aria-hidden="true" /> VIP
                  </span>
                )}
                <span className="px-3 py-1 text-xs font-primary font-bold bg-white rounded-full text-[hsl(222.2,47.4%,11.2%)] border border-gray-200 uppercase tracking-wide shadow-sm">
                  {event.category}
                </span>
                <span
                  className={cn(
                    "px-3 py-1 text-xs font-secondary font-semibold rounded-full border",
                    statusCfg.pillClass,
                  )}
                >
                  {event.status === "ONGOING" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      {statusCfg.label}
                    </span>
                  ) : (
                    statusCfg.label
                  )}
                </span>
              </div>
            </div>

            <div>
              <h1 className="font-primary font-black text-2xl sm:text-3xl lg:text-4xl uppercase leading-tight text-[hsl(222.2,47.4%,11.2%)] mb-1">
                {event.name}
              </h1>
              {event.subtitle && (
                <p className="font-secondary text-base text-[hsl(215.4,16.3%,46.9%)] mt-1">
                  {event.subtitle}
                </p>
              )}
              <div className="h-1 w-16 rounded-full mt-2 mb-2 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
            </div>

            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-50 pt-2 pb-2">
              <div className="flex items-center gap-4 px-5 py-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-[hsl(270,70%,50%)]/10 flex items-center justify-center">
                  <Calendar
                    className="w-[18px] h-[18px] text-[hsl(270,70%,50%)]"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="font-secondary text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    Date
                  </p>
                  <p className="font-secondary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                    {formatFullDate(event.start_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-5 py-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-[hsl(270,70%,50%)]/10 flex items-center justify-center">
                  <Clock
                    className="w-[18px] h-[18px] text-[hsl(270,70%,50%)]"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="font-secondary text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    Time
                  </p>
                  <p className="font-secondary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                    <time dateTime={event.start_at}>
                      {formatTime(event.start_at)}
                    </time>{" "}
                    {" — "}{" "}
                    <time dateTime={event.end_at}>
                      {formatTime(event.end_at)}
                    </time>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-5 py-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-[hsl(270,70%,50%)]/10 flex items-center justify-center">
                  <MapPin
                    className="w-[18px] h-[18px] text-[hsl(270,70%,50%)]"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-secondary text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    Location
                  </p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-secondary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                      {event.location}
                    </p>
                    {event.map_link && (
                      <a
                        href={event.map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[hsl(270,70%,50%)] bg-[hsl(270,70%,97%)] text-[11px] font-secondary text-[hsl(270,70%,50%)] hover:bg-[hsl(270,70%,92%)] hover:underline transition-colors"
                        aria-label="Open location on map"
                      >
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />{" "}
                        Map
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button
              disabled={statusCfg.buttonDisabled}
              onClick={handleCTA}
              className={cn(
                "w-full font-primary font-bold text-sm py-4 h-auto rounded-xl text-white shadow-md transition-all duration-300 mt-1",
                !statusCfg.buttonDisabled &&
                  "hover:shadow-xl hover:-translate-y-0.5",
                statusCfg.buttonClass,
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {event.status === "ON_SALE" && (
                  <Ticket className="w-4 h-4" aria-hidden="true" />
                )}
                {event.status === "ONGOING" && (
                  <Radio className="w-4 h-4" aria-hidden="true" />
                )}
                {statusCfg.buttonText}
              </span>
            </Button>

            {event.status === "SOLD_OUT" && (
              <WaitlistSection eventId={event.event_id} />
            )}

            <div className="overflow-hidden">
              <h2 className="font-primary font-bold text-xl uppercase tracking-wider text-[hsl(222.2,47.4%,11.2%)] mb-1 mt-2">
                About
              </h2>
              <p className="font-secondary text-sm leading-relaxed text-gray-600 whitespace-pre-line break-words">
                {event.description}
              </p>
            </div>

            {event.requirements && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 flex gap-3 overflow-hidden">
                <AlertCircle
                  className="w-5 h-5 text-orange-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h3 className="font-primary font-bold text-xs uppercase tracking-wider text-orange-700 mb-1">
                    Requirements
                  </h3>
                  <p className="font-secondary text-sm text-orange-800 leading-relaxed whitespace-pre-line break-words">
                    {event.requirements}
                  </p>
                </div>
              </div>
            )}

            <div className="flex lg:hidden items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[hsl(270,70%,50%)]/10 shrink-0">
                  {event.organizer.image_url ? (
                    <Image
                      src={event.organizer.image_url}
                      alt={event.organizer.name}
                      fill
                      sizes="40px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User
                        className="w-5 h-5 text-[hsl(270,70%,50%)]"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
                <p className="font-secondary text-[14px] uppercase tracking-wider text-gray-400 font-semibold">
                  Organizer
                </p>
              </div>
              <div className="text-right min-w-0">
                <p className="font-primary font-bold text-sm text-[hsl(222.2,47.4%,11.2%)] truncate">
                  {event.organizer.name}
                </p>
                <p className="font-secondary text-xs text-gray-400 truncate">
                  @{event.organizer.username}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 sm:mt-8"
          aria-label="Ticket Types"
        >
          <div className="flex items-center gap-3 mb-4">
            <Ticket
              className="w-8 h-8 text-[hsl(270,70%,50%)]"
              aria-hidden="true"
            />
            <h1 className="font-primary text-xl sm:text-3xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
                Tickets
              </span>
            </h1>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {event.platform_fee_value > 0 && (
            <div className="flex items-center gap-2 mb-4 px-1">
              <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
              <p className="font-secondary text-[11px] text-gray-400">
                {event.platform_fee_type === "PERCENTAGE"
                  ? `A ${event.platform_fee_value}% service fee applies per ticket`
                  : `A LKR ${event.platform_fee_value.toLocaleString()} service fee applies per ticket`}
                {event.platform_fee_type === "PERCENTAGE" &&
                  event.platform_fee_cap !== null &&
                  ` (max LKR ${event.platform_fee_cap.toLocaleString()})`}
              </p>
            </div>
          )}

          {event.ticket_types.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Ticket
                className="w-12 h-12 text-gray-300 mb-3"
                aria-hidden="true"
              />
              <p className="font-secondary text-gray-400">
                No tickets available at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {event.ticket_types.map((ticket) => (
                <EventTicketCard
                  key={ticket.ticket_type_id}
                  ticket={ticket}
                  eventStatus={event.status}
                  eventEndAt={event.end_at}
                />
              ))}
            </div>
          )}
        </motion.section>

        {event.status === "COMPLETED" && (
          <ReviewsSection eventId={event.event_id} />
        )}

        {event.status === "SOLD_OUT" && (
          <div className="mt-6 lg:hidden">
            <WaitlistSection eventId={event.event_id} />
          </div>
        )}

        <div className="mt-6 lg:hidden">
          <Button
            disabled={statusCfg.buttonDisabled}
            onClick={handleCTA}
            className={cn(
              "w-full font-primary font-bold text-sm py-4 h-auto rounded-xl text-white shadow-md transition-all duration-300",
              !statusCfg.buttonDisabled &&
                "hover:shadow-xl hover:-translate-y-0.5",
              statusCfg.buttonClass,
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {event.status === "ON_SALE" && (
                <Ticket className="w-4 h-4" aria-hidden="true" />
              )}
              {event.status === "ONGOING" && (
                <Radio className="w-4 h-4" aria-hidden="true" />
              )}
              {statusCfg.buttonText}
            </span>
          </Button>
        </div>
      </div>
    </main>
  );
});

EventDetail.displayName = "EventDetail";
