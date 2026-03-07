// components/shared/buy-ticket/ticket-details.tsx
"use client";

import React, { useState, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Minus,
  Plus,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Lock,
  Crown,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/ui/utils";
import { Button } from "@/components/ui/button";
import { createReservation } from "@/lib/actions/checkout";
import type { TicketType, EventDetails, EventStatus } from "@/lib/types/event";
import type { CartItem, BuyTicketItem } from "@/lib/types/checkout";
import LogoSrc from "@/app/assets/images/logo/upscale_media_logo.png";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_QTY_PER_TYPE = 10;
const ACCENT = "hsl(270,70%,50%)";

interface StatusConfig {
  label: string;
  pillClass: string;
}

const STATUS_CONFIG: Record<EventStatus, StatusConfig> = {
  ON_SALE: {
    label: "On Sale",
    pillClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  ONGOING: {
    label: "Live Now",
    pillClass: "bg-emerald-50 border-emerald-300 text-emerald-700",
  },
  PUBLISHED: {
    label: "Upcoming",
    pillClass: "bg-orange-50 border-orange-200 text-orange-700",
  },
  SOLD_OUT: {
    label: "Sold Out",
    pillClass: "bg-red-50 border-red-200 text-red-700",
  },
  COMPLETED: {
    label: "Completed",
    pillClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  CANCELLED: {
    label: "Cancelled",
    pillClass: "bg-gray-50 border-gray-200 text-gray-500",
  },
  DRAFT: {
    label: "Draft",
    pillClass: "bg-gray-50 border-gray-200 text-gray-400",
  },
};

const FALLBACK_STATUS: StatusConfig = {
  label: "Unknown",
  pillClass: "bg-gray-50 border-gray-200 text-gray-500",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function enrichTicketType(
  ticket: TicketType,
  eventStatus: string,
): BuyTicketItem {
  const now = new Date();
  const available = Math.max(0, ticket.capacity - ticket.qty_sold);
  const is_sold_out = available <= 0;
  const sale_not_started = ticket.sale_start_at
    ? new Date(ticket.sale_start_at) > now
    : false;
  const sale_ended = ticket.sale_end_at
    ? new Date(ticket.sale_end_at) < now
    : false;
  const can_purchase =
    !is_sold_out &&
    !sale_not_started &&
    !sale_ended &&
    (eventStatus === "ON_SALE" || eventStatus === "ONGOING");

  return {
    ...ticket,
    available,
    is_sold_out,
    sale_not_started,
    sale_ended,
    can_purchase,
  };
}

const formatLKR = (amount: number) =>
  amount === 0 ? "Free" : `LKR ${amount.toLocaleString("en-US")}`;

const formatSaleEnd = (saleEndAt: string | null, eventEndAt: string) => {
  const src = saleEndAt ?? eventEndAt;
  return new Date(src).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── QuantityStepper ─────────────────────────────────────────────────────────

interface StepperProps {
  value: number;
  maxQty: number;
  available: number;
  canPurchase: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}

const QuantityStepper = memo<StepperProps>(
  ({ value, maxQty, available, canPurchase, onDecrement, onIncrement }) => {
    const atMin = value <= 0;
    const atMax = value >= maxQty || value >= available;

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onDecrement}
          disabled={atMin || !canPurchase}
          className={cn(
            "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-150",
            atMin || !canPurchase
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-[hsl(270,70%,50%)] text-[hsl(270,70%,50%)] hover:bg-[hsl(270,70%,50%)] hover:text-white",
          )}
          aria-label="Decrease quantity"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span
          className={cn(
            "w-6 text-center font-primary font-bold text-sm",
            value > 0
              ? "text-[hsl(222.2,47.4%,11.2%)]"
              : "text-gray-400",
          )}
        >
          {value}
        </span>

        <button
          onClick={onIncrement}
          disabled={atMax || !canPurchase}
          className={cn(
            "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-150",
            atMax || !canPurchase
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-[hsl(270,70%,50%)] text-[hsl(270,70%,50%)] hover:bg-[hsl(270,70%,50%)] hover:text-white",
          )}
          aria-label="Increase quantity"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  },
);

QuantityStepper.displayName = "QuantityStepper";

// ─── TicketTypeCard ───────────────────────────────────────────────────────────

interface TicketTypeCardProps {
  ticket: BuyTicketItem;
  quantity: number;
  onDecrement: (id: string) => void;
  onIncrement: (id: string) => void;
  eventEndAt: string;
}

const TicketTypeCard = memo<TicketTypeCardProps>(
  ({ ticket, quantity, onDecrement, onIncrement, eventEndAt }) => {
    const soldPct =
      ticket.capacity > 0
        ? Math.min(100, Math.round((ticket.qty_sold / ticket.capacity) * 100))
        : 0;
    const accentColor = ticket.can_purchase ? ACCENT : "hsl(220 9% 70%)";
    const barColor =
      soldPct >= 90
        ? "bg-red-500"
        : soldPct >= 60
          ? "bg-amber-400"
          : "bg-emerald-500";

    const inclusions = Array.isArray(ticket.inclusions)
      ? ticket.inclusions
      : [];
    const maxQty = Math.min(MAX_QTY_PER_TYPE, ticket.available);

    const statusBadge = ticket.is_sold_out
      ? { label: "Sold Out", cls: "bg-red-100 text-red-600" }
      : ticket.sale_ended
        ? { label: "Sale Ended", cls: "bg-gray-100 text-gray-500" }
        : ticket.sale_not_started
          ? { label: "Coming Soon", cls: "bg-amber-100 text-amber-600" }
          : null;

    return (
      <motion.div
        layout
        className={cn(
          "relative flex flex-col sm:flex-row rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all duration-300",
          ticket.can_purchase
            ? quantity > 0
              ? "shadow-[0_4px_24px_rgba(124,58,237,0.18)] ring-1 ring-[hsl(270,70%,50%)]/30"
              : "hover:shadow-[0_6px_28px_rgba(0,0,0,0.13)]"
            : "opacity-70",
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
            ticket.can_purchase ? "bg-white" : "bg-gray-50",
          )}
        >
          {/* Left: Details */}
          <div className="flex-1 min-w-0 px-5 pt-5 pb-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Ticket
                  className="w-4 h-4 shrink-0"
                  style={{ color: accentColor }}
                  aria-hidden
                />
                <h4
                  className={cn(
                    "font-primary font-black text-sm uppercase tracking-wide leading-tight",
                    ticket.can_purchase
                      ? "text-[hsl(222.2,47.4%,11.2%)]"
                      : "text-gray-400",
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
              <div className="flex flex-wrap gap-1.5">
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
                      aria-hidden
                    />
                    {item}
                  </span>
                ))}
              </div>
            )}

            {/* Capacity bar */}
            <div className="mt-auto space-y-1.5">
              {ticket.available <= 20 && ticket.available > 0 && (
                <p className="text-[10px] font-secondary font-semibold text-amber-600">
                  Only {ticket.available} left!
                </p>
              )}
              <div className="flex justify-between text-[10px] font-secondary text-gray-400">
                <span>{ticket.qty_sold.toLocaleString()} sold</span>
                <span>
                  {ticket.available > 0
                    ? `${ticket.available.toLocaleString()} left`
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

          {/* Divider notch */}
          <div className="relative flex sm:flex-col items-center justify-center">
            <span
              className="absolute rounded-full w-4 h-4 border border-gray-200 z-10 left-0 sm:left-auto sm:top-0 -translate-x-1/2 sm:translate-x-0 sm:-translate-y-1/2"
              style={{
                background: ticket.can_purchase
                  ? "hsl(210 40% 96.1%)"
                  : "hsl(220 9% 95%)",
              }}
            />
            <span
              className="absolute rounded-full w-4 h-4 border border-gray-200 z-10 right-0 sm:right-auto sm:bottom-0 translate-x-1/2 sm:translate-x-0 sm:translate-y-1/2"
              style={{
                background: ticket.can_purchase
                  ? "hsl(210 40% 96.1%)"
                  : "hsl(220 9% 95%)",
              }}
            />
            <div className="w-full sm:w-px h-px sm:h-full border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-gray-200 mx-2 sm:mx-0 my-0 sm:my-2" />
          </div>

          {/* Right: Price + Stepper */}
          <div
            className={cn(
              "w-full sm:w-48 shrink-0 px-5 py-4 flex sm:flex-col justify-between items-start gap-3",
              ticket.can_purchase ? "bg-white" : "bg-gray-50",
            )}
          >
            <div>
              <p className="font-secondary text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">
                Price
              </p>
              <p
                className={cn(
                  "font-primary font-black text-2xl leading-none",
                  ticket.can_purchase
                    ? "text-[hsl(222.2,47.4%,11.2%)]"
                    : "text-gray-400",
                )}
              >
                {formatLKR(ticket.price)}
              </p>
              {ticket.sale_end_at && ticket.can_purchase && (
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <p className="text-[10px] font-secondary text-gray-400">
                    Until {formatSaleEnd(ticket.sale_end_at, eventEndAt)}
                  </p>
                </div>
              )}
            </div>

            <QuantityStepper
              value={quantity}
              maxQty={maxQty}
              available={ticket.available}
              canPurchase={ticket.can_purchase}
              onDecrement={() => onDecrement(ticket.ticket_type_id)}
              onIncrement={() => onIncrement(ticket.ticket_type_id)}
            />
          </div>
        </div>
      </motion.div>
    );
  },
);

TicketTypeCard.displayName = "TicketTypeCard";

// ─── Main TicketDetails Component ────────────────────────────────────────────

interface TicketDetailsProps {
  event: EventDetails;
}

export function TicketDetails({ event }: TicketDetailsProps) {
  const router = useRouter();
  const statusCfg = STATUS_CONFIG[event.status] ?? FALLBACK_STATUS;
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrichedTickets = useMemo(
    () => event.ticket_types.map((t) => enrichTicketType(t, event.status)),
    [event.ticket_types, event.status],
  );

  const handleDecrement = useCallback((id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) - 1),
    }));
    setError(null);
  }, []);

  const handleIncrement = useCallback(
    (id: string) => {
      const ticket = enrichedTickets.find((t) => t.ticket_type_id === id);
      if (!ticket?.can_purchase) return;
      const max = Math.min(MAX_QTY_PER_TYPE, ticket.available);
      setQuantities((prev) => ({
        ...prev,
        [id]: Math.min(max, (prev[id] ?? 0) + 1),
      }));
      setError(null);
    },
    [enrichedTickets],
  );

  const cartItems: CartItem[] = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([ticket_type_id, quantity]) => ({ ticket_type_id, quantity })),
    [quantities],
  );

  const subtotal = useMemo(() => {
    return enrichedTickets.reduce((sum, t) => {
      return sum + t.price * (quantities[t.ticket_type_id] ?? 0);
    }, 0);
  }, [enrichedTickets, quantities]);

  const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);

  const handleProceedToCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      setError("Please select at least one ticket.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await createReservation(event.event_id, cartItems);

    if (!result.success) {
      if (result.message === "UNAUTHENTICATED") {
        // Redirect to sign-in, preserving the event URL for post-login redirect
        toast.info("Please sign in to continue", {
          description: "You'll be redirected back here after signing in.",
        });
        router.push(
          `/sign-in?redirect=/events/${event.event_id}/buy-tickets`,
        );
        return;
      }
      setError(result.message ?? "Failed to reserve tickets.");
      setIsLoading(false);
      return;
    }

    // Reservation created — redirect to checkout
    router.push(`/checkout/${result.primary_id}`);
  }, [cartItems, event.event_id, router]);

  const eventIsBookable =
    event.status === "ON_SALE" || event.status === "ONGOING";

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pb-12">
      {/* ── Banner ── */}
      <div className="relative w-full h-48 sm:h-56 lg:h-64 overflow-hidden bg-[hsl(222.2,47.4%,11.2%)]">
        {event.banner_image || event.thumbnail_image ? (
          <>
            <Image
              src={(event.banner_image ?? event.thumbnail_image)!}
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
              className="w-28 h-28 sm:w-36 lg:w-44 object-contain opacity-60"
              priority
            />
          </div>
        )}

        {/* Banner overlay content — bottom left */}
        <div className="absolute inset-0 flex flex-col justify-end pb-5">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <Button
              asChild
              variant="ghost"
              className="mb-3 h-7 px-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full text-xs font-secondary -ml-1"
            >
              <Link href={`/events/${event.event_id}`}>
                <ChevronLeft className="w-3.5 h-3.5" />
                Back to Event
              </Link>
            </Button>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {event.is_vip && (
                <span className="inline-flex items-center gap-1 bg-yellow-400/90 text-yellow-900 px-2.5 py-0.5 rounded-full border border-yellow-300 text-[11px] font-bold uppercase tracking-wide">
                  <Crown className="w-3 h-3" aria-hidden="true" />
                  VIP
                </span>
              )}
              <span className="px-2.5 py-0.5 text-[11px] font-primary font-bold bg-white/20 backdrop-blur-sm rounded-full text-white border border-white/20 uppercase tracking-wide">
                {event.category}
              </span>
              <span
                className={cn(
                  "px-2.5 py-0.5 text-[11px] font-secondary font-semibold rounded-full border backdrop-blur-sm",
                  statusCfg.pillClass,
                )}
              >
                {event.status === "ONGOING" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    {statusCfg.label}
                  </span>
                ) : (
                  statusCfg.label
                )}
              </span>
            </div>

            <h1 className="font-primary font-black text-white text-xl sm:text-2xl lg:text-3xl uppercase leading-tight drop-shadow-lg">
              {event.name}
            </h1>
            {event.subtitle && (
              <p className="font-secondary text-sm text-white/70 mt-1 drop-shadow-sm">
                {event.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* ── Section Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart
          className="w-7 h-7 text-[hsl(270,70%,50%)]"
          aria-hidden
        />
        <h2 className="font-primary text-xl sm:text-2xl font-semibold text-[hsl(222.2,47.4%,11.2%)]">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] to-[hsl(270,70%,50%)]">
            Select Tickets
          </span>
        </h2>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {!eventIsBookable && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="font-secondary text-sm text-amber-800">
            Ticket sales are not currently open for this event.
          </p>
        </div>
      )}

      {/* ── Ticket Type Cards ── */}
      {enrichedTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Ticket className="w-12 h-12 text-gray-300 mb-3" />
          <p className="font-secondary text-gray-400">
            No tickets available.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {enrichedTickets.map((ticket) => (
            <TicketTypeCard
              key={ticket.ticket_type_id}
              ticket={ticket}
              quantity={quantities[ticket.ticket_type_id] ?? 0}
              onDecrement={handleDecrement}
              onIncrement={handleIncrement}
              eventEndAt={event.end_at}
            />
          ))}
        </div>
      )}

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 flex items-start gap-3 p-4 rounded-2xl border border-red-200 bg-red-50"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="font-secondary text-sm text-red-800">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cart Summary + CTA ── */}
      <motion.div
        layout
        className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white shadow-sm border border-gray-100"
      >
        {/* Subtotal */}
        <div>
          <p className="font-secondary text-xs uppercase tracking-widest text-gray-400 mb-0.5">
            {totalQty > 0
              ? `${totalQty} ticket${totalQty > 1 ? "s" : ""} selected`
              : "No tickets selected"}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={subtotal}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-primary font-black text-2xl text-[hsl(222.2,47.4%,11.2%)]"
            >
              {formatLKR(subtotal)}
            </motion.p>
          </AnimatePresence>
          {subtotal > 0 && (
            <p className="font-secondary text-[11px] text-gray-400 mt-0.5">
              Exclusive of any applicable promo discounts
            </p>
          )}
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleProceedToCheckout}
          disabled={!eventIsBookable || isLoading || totalQty === 0}
          className={cn(
            "font-primary font-bold text-sm py-3 px-8 h-auto rounded-xl text-white shadow-md transition-all duration-300 min-w-[220px]",
            totalQty > 0 && eventIsBookable
              ? "bg-gradient-to-r from-[hsl(222.2,47.4%,11.2%)] via-[hsl(270,70%,50%)] to-[hsl(222.2,47.4%,11.2%)] bg-[length:200%_auto] hover:bg-[position:100%_0] hover:shadow-xl hover:-translate-y-0.5"
              : "bg-gray-300 cursor-not-allowed",
          )}
        >
          <span className="flex items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reserving...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </span>
        </Button>
      </motion.div>

      {totalQty > 0 && (
        <p className="mt-3 text-center font-secondary text-xs text-gray-400">
          <Lock className="inline-block w-3 h-3 mr-1 text-gray-400" />
          Tickets are held for 10 minutes once you proceed to checkout.
        </p>
      )}
      </div>
    </main>
  );
}
