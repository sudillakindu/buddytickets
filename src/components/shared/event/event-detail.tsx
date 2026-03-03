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
  ImageOff,
  CheckCircle2,
  AlertCircle,
  Info,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import type { EventDetails, TicketType } from "@/lib/types/event";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFullDate = (iso: string): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (iso: string): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPrice = (price: number): string => {
  if (price === 0) return "Free";
  return `LKR ${price.toLocaleString()}`;
};

// ─── Status configs ───────────────────────────────────────────────────────────
//
// ONGOING  → Active  | navigates to buy-ticket
// ON_SALE  → Active  | navigates to buy-ticket
// All others → Disabled

interface StatusConfig {
  label: string;
  pillClass: string;      // pill badge on detail page
  buttonText: string;
  buttonClass: string;
  buttonDisabled: boolean;
  isActive: boolean;      // true → CTA navigates to buy-ticket
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
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
};

// ─── Image Gallery ─────────────────────────────────────────────────────────────

interface GalleryProps {
  images: { image_url: string; priority_order: number }[];
  eventName: string;
}

const ImageGallery: React.FC<GalleryProps> = memo(({ images, eventName }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const handleError = useCallback((idx: number) => {
    setImgErrors((prev) => ({ ...prev, [idx]: true }));
  }, []);

  const activeImage = images[activeIndex] ?? null;

  return (
    <div className="flex flex-col gap-3">
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
                <ImageOff className="w-10 h-10" />
                <span className="text-sm font-secondary">Image unavailable</span>
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

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-secondary px-2.5 py-1 rounded-full backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(270,70%,50%)]",
                i === activeIndex
                  ? "border-[hsl(270,70%,50%)] shadow-md opacity-100"
                  : "border-transparent opacity-55 hover:opacity-90",
              )}
              aria-label={`View image ${i + 1}${i === 0 ? " (main)" : i === 1 ? " (banner)" : ""}`}
            >
              {imgErrors[i] ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <ImageOff className="w-4 h-4 text-gray-400" />
                </div>
              ) : (
                <Image
                  src={img.image_url}
                  alt={`${eventName} thumbnail ${i + 1}`}
                  fill
                  sizes="80px"
                  unoptimized
                  className="object-cover"
                  onError={() => handleError(i)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
ImageGallery.displayName = "ImageGallery";

// ─── Ticket Card ──────────────────────────────────────────────────────────────

interface TicketCardProps {
  ticket: TicketType;
  eventStatus: string;
  onBook: () => void;
}

const TicketCard: React.FC<TicketCardProps> = memo(
  ({ ticket, eventStatus, onBook }) => {
    const available = Math.max(0, ticket.capacity - ticket.qty_sold);
    const soldPct = ticket.capacity > 0
      ? Math.min(100, Math.round((ticket.qty_sold / ticket.capacity) * 100))
      : 0;

    // Per-ticket sold-out state (independent of event status)
    const isTicketSoldOut = available <= 0;
    const isExpired =
      ticket.sale_end_at ? new Date(ticket.sale_end_at) < new Date() : false;
    const notStarted =
      ticket.sale_start_at ? new Date(ticket.sale_start_at) > new Date() : false;

    const canBook =
      !isTicketSoldOut &&
      !isExpired &&
      !notStarted &&
      (eventStatus === "ON_SALE" || eventStatus === "ONGOING");

    const availabilityColor =
      soldPct >= 90
        ? "bg-red-500"
        : soldPct >= 60
          ? "bg-orange-400"
          : "bg-emerald-500";

    const inclusions: string[] = Array.isArray(ticket.inclusions)
      ? ticket.inclusions
      : [];

    return (
      <div
        className={cn(
          "rounded-2xl border p-5 flex flex-col gap-3 transition-shadow duration-300",
          canBook
            ? "border-gray-200 hover:shadow-md bg-white"
            : "border-gray-100 bg-gray-50/60",
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "font-primary font-black text-base uppercase leading-tight",
                canBook ? "text-[hsl(222.2,47.4%,11.2%)]" : "text-gray-400",
              )}
            >
              {ticket.name}
            </h4>
            <p className="font-secondary text-xs text-gray-500 mt-0.5 line-clamp-2">
              {ticket.description}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "font-primary font-bold text-lg",
                canBook ? "text-[hsl(222.2,47.4%,11.2%)]" : "text-gray-400",
              )}
            >
              {formatPrice(ticket.price)}
            </p>
            {isTicketSoldOut && (
              <span className="text-[10px] font-secondary font-semibold text-red-500 uppercase">
                Sold out
              </span>
            )}
            {isExpired && !isTicketSoldOut && (
              <span className="text-[10px] font-secondary font-semibold text-gray-400 uppercase">
                Sale ended
              </span>
            )}
            {notStarted && !isTicketSoldOut && (
              <span className="text-[10px] font-secondary font-semibold text-orange-500 uppercase">
                Coming soon
              </span>
            )}
          </div>
        </div>

        {/* Inclusions */}
        {inclusions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {inclusions.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-1 text-[10px] font-secondary font-medium bg-[hsl(270,70%,50%)]/8 text-[hsl(270,70%,50%)] px-2 py-0.5 rounded-full"
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                {item}
              </span>
            ))}
          </div>
        )}

        {/* Availability bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-secondary text-gray-400">
            <span>{ticket.qty_sold.toLocaleString()} sold</span>
            <span>{available > 0 ? `${available.toLocaleString()} left` : "0 left"}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", availabilityColor)}
              style={{ width: `${soldPct}%` }}
            />
          </div>
        </div>

        {/* Sale window */}
        {(ticket.sale_start_at || ticket.sale_end_at) && (
          <p className="text-[10px] font-secondary text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            {ticket.sale_start_at &&
              `Opens ${new Date(ticket.sale_start_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            {ticket.sale_start_at && ticket.sale_end_at && " · "}
            {ticket.sale_end_at &&
              `Closes ${new Date(ticket.sale_end_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          </p>
        )}

        {/* Per-ticket book button (only when event is active) */}
        {canBook && (
          <Button
            onClick={onBook}
            className="w-full font-primary text-xs py-2.5 h-auto rounded-xl text-white bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)] hover:opacity-90 transition-opacity"
          >
            <Ticket className="w-3.5 h-3.5 mr-1.5" />
            Select
          </Button>
        )}
      </div>
    );
  },
);
TicketCard.displayName = "TicketCard";

// ─── Main Component ───────────────────────────────────────────────────────────

interface EventDetailProps {
  event: EventDetails;
}

export const EventDetail: React.FC<EventDetailProps> = memo(({ event }) => {
  const router = useRouter();
  const buyTicketHref = `/events/${event.event_id}/buy-ticket`;

  const statusCfg = STATUS_CONFIG[event.status] ?? {
    label: event.status,
    pillClass: "bg-gray-50 border-gray-200 text-gray-500",
    buttonText: event.status,
    buttonClass: "bg-gray-400",
    buttonDisabled: true,
    isActive: false,
  };

  const handleMainCTA = () => {
    if (statusCfg.isActive) {
      router.push(buyTicketHref);
    }
  };

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)]">
      {/* ── Banner Image (priority_order = 2) ──────────────────────── */}
      {event.banner_image && (
        <div className="relative w-full h-48 sm:h-64 lg:h-80 overflow-hidden bg-gray-200">
          <Image
            src={event.banner_image}
            alt={`${event.name} banner`}
            fill
            sizes="100vw"
            unoptimized
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/60" />
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm font-secondary text-[hsl(215.4,16.3%,46.9%)] hover:text-[hsl(270,70%,50%)] transition-colors group"
          >
            <ChevronLeft
              className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
            Back to Events
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* ── LEFT: Gallery (thumbnail = priority_order 1) ────────── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ImageGallery images={event.images} eventName={event.name} />
          </motion.div>

          {/* ── RIGHT: Event info ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
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
                {event.status === "ONGOING" && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    {statusCfg.label}
                  </span>
                )}
                {event.status !== "ONGOING" && statusCfg.label}
              </span>
            </div>

            {/* Title + subtitle */}
            <div>
              <h1 className="font-primary font-black text-2xl sm:text-3xl lg:text-4xl uppercase leading-tight text-[hsl(222.2,47.4%,11.2%)]">
                {event.name}
              </h1>
              {event.subtitle && (
                <p className="font-secondary text-base text-[hsl(215.4,16.3%,46.9%)] mt-2">
                  {event.subtitle}
                </p>
              )}
              <div className="h-1 w-16 rounded-full mt-3 bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]" />
            </div>

            {/* Meta info */}
            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-50">
              {/* Date */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-[hsl(270,70%,50%)]/10 flex items-center justify-center">
                  <Calendar className="w-[18px] h-[18px] text-[hsl(270,70%,50%)]" aria-hidden="true" />
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

              {/* Time */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-[hsl(270,70%,50%)]/10 flex items-center justify-center">
                  <Clock className="w-[18px] h-[18px] text-[hsl(270,70%,50%)]" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-secondary text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    Time
                  </p>
                  <p className="font-secondary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                    <time dateTime={event.start_at}>{formatTime(event.start_at)}</time>
                    {" — "}
                    <time dateTime={event.end_at}>{formatTime(event.end_at)}</time>
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-[hsl(270,70%,50%)]/10 flex items-center justify-center">
                  <MapPin className="w-[18px] h-[18px] text-[hsl(270,70%,50%)]" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-secondary text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                    Location
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-secondary text-sm font-semibold text-[hsl(222.2,47.4%,11.2%)]">
                      {event.location}
                    </p>
                    {event.map_link && (
                      <a
                        href={event.map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-secondary text-[hsl(270,70%,50%)] hover:underline"
                        aria-label="Open map"
                      >
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        Map
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main CTA */}
            <Button
              disabled={statusCfg.buttonDisabled}
              onClick={handleMainCTA}
              className={cn(
                "w-full font-primary font-bold text-sm py-4 h-auto rounded-xl text-white shadow-md transition-all duration-300",
                !statusCfg.buttonDisabled && "hover:shadow-xl hover:-translate-y-0.5",
                statusCfg.buttonClass,
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {event.status === "ON_SALE" && <Ticket className="w-4 h-4" />}
                {event.status === "ONGOING" && <Radio className="w-4 h-4" />}
                {statusCfg.buttonText}
              </span>
            </Button>

            {/* Description */}
            <div>
              <h2 className="font-primary font-bold text-sm uppercase tracking-wider text-[hsl(222.2,47.4%,11.2%)] mb-2">
                About
              </h2>
              <p className="font-secondary text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Requirements */}
            {event.requirements && (
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 flex gap-3">
                <AlertCircle
                  className="w-5 h-5 text-orange-500 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-primary font-bold text-xs uppercase tracking-wider text-orange-700 mb-1">
                    Requirements
                  </h3>
                  <p className="font-secondary text-sm text-orange-800 leading-relaxed whitespace-pre-line">
                    {event.requirements}
                  </p>
                </div>
              </div>
            )}

            {/* Organizer */}
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
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
                    <User className="w-5 h-5 text-[hsl(270,70%,50%)]" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-secondary text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                  Organizer
                </p>
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

        {/* ── Tickets Section ──────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 sm:mt-16"
          aria-label="Ticket Types"
        >
          <div className="flex items-center gap-3 mb-6">
            <Ticket className="w-5 h-5 text-[hsl(270,70%,50%)]" aria-hidden="true" />
            <h2 className="font-primary font-black text-xl sm:text-2xl uppercase text-[hsl(222.2,47.4%,11.2%)]">
              Tickets
            </h2>
            <div className="flex-1 h-px bg-gray-100" />
            {event.start_ticket_price !== null && (
              <p className="font-secondary text-xs text-gray-400 shrink-0">
                From{" "}
                <span className="font-bold text-[hsl(222.2,47.4%,11.2%)]">
                  {formatPrice(event.start_ticket_price)}
                </span>
              </p>
            )}
          </div>

          {event.ticket_types.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Ticket className="w-12 h-12 text-gray-300 mb-3" aria-hidden="true" />
              <p className="font-secondary text-gray-400">
                No tickets available at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {event.ticket_types.map((ticket) => (
                <TicketCard
                  key={ticket.ticket_type_id}
                  ticket={ticket}
                  eventStatus={event.status}
                  onBook={() => router.push(buyTicketHref)}
                />
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
});

EventDetail.displayName = "EventDetail";