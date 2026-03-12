// components/shared/event/event-detail.tsx
"use client";

import React, { useState, memo, useCallback } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import {
  formatFullDate,
  formatTime,
  formatPrice,
  formatSaleEndParts,
} from "@/lib/utils/formatting";
import type { EventDetails, EventStatus, TicketType } from "@/lib/types/event";
import LogoSrc from "@/app/assets/images/logo/upscale_media_logo.png";

// ─── Constants ───────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  pillClass: string;
  buttonText: string;
  buttonClass: string;
  buttonDisabled: boolean;
  isActive: boolean;
}

const STATUS_CONFIG: Record<EventStatus, StatusConfig> = {
  ON_SALE: {
    label: "On Sale",
    pillClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
    buttonText: "Book Ticket",
    buttonClass:
      "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] hover:bg-[position:100%_0] transition-[background-position] duration-500",
    buttonDisabled: false,
    isActive: true,
  },
  ONGOING: {
    label: "Live Now",
    pillClass: "bg-emerald-50 border-emerald-300 text-emerald-700",
    buttonText: "Live Now",
    buttonClass:
      "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-emerald-500 to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] hover:bg-[position:100%_0] transition-[background-position] duration-500",
    buttonDisabled: false,
    isActive: true,
  },
  PUBLISHED: {
    label: "Upcoming",
    pillClass: "bg-orange-50 border-orange-200 text-orange-700",
    buttonText: "Upcoming",
    buttonClass: "bg-[#C76E00]",
    buttonDisabled: true,
    isActive: false,
  },
  SOLD_OUT: {
    label: "Sold Out",
    pillClass: "bg-red-50 border-red-200 text-red-700",
    buttonText: "Sold Out",
    buttonClass: "bg-red-600",
    buttonDisabled: true,
    isActive: false,
  },
  COMPLETED: {
    label: "Completed",
    pillClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
    buttonText: "Completed",
    buttonClass: "bg-emerald-600",
    buttonDisabled: true,
    isActive: false,
  },
  CANCELLED: {
    label: "Cancelled",
    pillClass: "bg-gray-50 border-gray-200 text-gray-500",
    buttonText: "Cancelled",
    buttonClass: "bg-gray-400",
    buttonDisabled: true,
    isActive: false,
  },
  DRAFT: {
    label: "Draft",
    pillClass: "bg-gray-50 border-gray-200 text-gray-400",
    buttonText: "Draft",
    buttonClass: "bg-gray-200",
    buttonDisabled: true,
    isActive: false,
  },
};

const FALLBACK_STATUS_CONFIG: StatusConfig = {
  label: "Unknown",
  pillClass: "bg-gray-50 border-gray-200 text-gray-500",
  buttonText: "Unavailable",
  buttonClass: "bg-gray-400",
  buttonDisabled: true,
  isActive: false,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      {/* Main image */}
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

// ─────────────────────────────────────────────────────────────────────────────

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
        {/* Accent bar */}
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
          {/* Left: Details */}
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

            {/* Capacity bar */}
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

          {/* Divider with notches */}
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

          {/* Right: Price & sale end */}
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

// ─── Main Component ───────────────────────────────────────────────────────────

interface EventDetailProps {
  event: EventDetails;
}

export const EventDetail: React.FC<EventDetailProps> = memo(({ event }) => {
  const router = useRouter();
  const buyTicketHref = `/events/${event.event_id}/buy-tickets`;
  const statusCfg = STATUS_CONFIG[event.status] ?? FALLBACK_STATUS_CONFIG;

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
    } catch {
      // Share / clipboard not available — fail silently
    }
  }, [event.event_id, event.name, event.subtitle, event.description]);

  const handleCTA = useCallback(() => {
    if (statusCfg.isActive) router.push(buyTicketHref);
  }, [statusCfg.isActive, buyTicketHref, router]);

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]  pb-12">
      {/* ── Banner ── */}
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
            {/* Main soft overlay */}
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
          {/* ── Left Column: Gallery + Organizer ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-20 -mt-40 sm:-mt-40 lg:-mt-56"
          >
            <ImageGallery images={event.images} eventName={event.name} />

            {/* Organizer card — desktop only (mobile version is in right column) */}
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

          {/* ── Right Column: Event Info ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-3"
          >
            {/* Badges + actions — mobile: 2 rows, desktop: single row */}
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center">
              {/* Nav buttons — mobile: top row spread apart, desktop: pushed right */}
              <div className="flex items-center justify-between lg:ml-auto lg:gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-8 px-3 rounded-full text-xs font-secondary"
                >
                  <Link href="/events">
                    <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    Back to Events
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="h-8 px-3 rounded-full text-xs font-secondary"
                  aria-label="Share this event"
                >
                  <Share2 className="w-3 h-3" aria-hidden="true" />
                  Share
                </Button>
              </div>

              {/* Badges — mobile: second row, desktop: first via order */}
              <div className="flex flex-wrap items-center gap-2 lg:order-first">
                {event.is_vip && (
                  <span className="inline-flex items-center gap-1 bg-yellow-400/90 text-yellow-900 px-3 py-1 rounded-full border border-yellow-300 text-xs font-bold uppercase tracking-wide">
                    <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                    VIP
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

            {/* Title */}
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

            {/* Date / Time / Location info */}
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
                    </time>
                    {" — "}
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
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        Map
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA button */}
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

            {/* About */}
            <div className="overflow-hidden">
              <h2 className="font-primary font-bold text-xl uppercase tracking-wider text-[hsl(222.2,47.4%,11.2%)] mb-1 mt-2">
                About
              </h2>
              <p className="font-secondary text-sm leading-relaxed text-gray-600 whitespace-pre-line break-words">
                {event.description}
              </p>
            </div>

            {/* Requirements */}
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

            {/* Organizer card — mobile only (desktop version is in left column) */}
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

        {/* ── Tickets Section ── */}
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

        {/* Mobile-only Book Now CTA — below tickets */}
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
