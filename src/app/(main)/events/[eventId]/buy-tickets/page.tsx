// app/(main)/events/[eventId]/buy-tickets/page.tsx
// Server Component: fetches event data, renders ticket selection cart.
//
// This page is accessible to guests (no auth required to browse).
// Authentication is enforced in the createReservation server action
// when the user clicks "Proceed to Checkout".

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Calendar, MapPin, Clock, AlertCircle } from "lucide-react";

import { getEventById } from "@/lib/actions/event";
import { TicketCart } from "@/components/shared/buy-ticket/ticket-cart";
import { TicketCartSkeleton } from "@/components/shared/buy-ticket/ticket-cart-skeleton";
import { Button } from "@/components/ui/button";
import LogoSrc from "@/app/assets/images/logo/upscale_media_logo.png";

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const result = await getEventById(eventId);
  if (!result.success || !result.event) {
    return { title: "Event Not Found — BuddyTicket" };
  }
  return {
    title: `Buy Tickets — ${result.event.name} | BuddyTicket`,
    description: `Select your tickets for ${result.event.name}. Fast, secure checkout.`,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function BuyTicketsPage({ params }: PageProps) {
  const { eventId } = await params;
  const result = await getEventById(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  const event = result.event;

  // Check if event allows ticket purchase
  const isBookable = event.status === "ON_SALE" || event.status === "ONGOING";
  const hasActiveTickets = event.ticket_types.some((t) => t.is_active);

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-white to-[hsl(210,40%,96.1%)] pb-16">
      {/* ── Compact Banner ── */}
      <div className="relative w-full h-40 sm:h-48 overflow-hidden bg-gray-200">
        {event.thumbnail_image ? (
          <>
            <Image
              src={event.thumbnail_image}
              alt={event.name}
              fill
              sizes="100vw"
              unoptimized
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[hsl(222.2,47.4%,11.2%)]">
            <Image
              src={LogoSrc}
              alt="BuddyTickets"
              width={120}
              height={120}
              className="w-20 h-20 object-contain opacity-60"
            />
          </div>
        )}

        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col justify-end px-4 sm:px-8 pb-5">
          <div className="max-w-7xl mx-auto w-full">
            <Button
              asChild
              variant="ghost"
              className="mb-2 h-7 px-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full text-xs font-secondary -ml-1"
            >
              <Link href={`/events/${eventId}`}>
                <ChevronLeft className="w-3.5 h-3.5" />
                Back to Event
              </Link>
            </Button>
            <h1 className="font-primary font-black text-white text-xl sm:text-2xl uppercase leading-tight drop-shadow-lg">
              {event.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* ── Event Meta Strip ── */}
        <div className="flex flex-wrap items-center gap-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-secondary text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-[hsl(270,70%,50%)]" />
            {formatDate(event.start_at)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-secondary text-gray-500">
            <Clock className="w-3.5 h-3.5 text-[hsl(270,70%,50%)]" />
            {formatTime(event.start_at)} – {formatTime(event.end_at)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-secondary text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-[hsl(270,70%,50%)]" />
            {event.location}
          </div>
        </div>

        {/* ── Unavailable State ── */}
        {!isBookable && (
          <div className="mt-6 flex items-start gap-3 p-5 rounded-2xl border border-amber-200 bg-amber-50">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-primary font-bold text-sm uppercase tracking-wide text-amber-800 mb-1">
                Tickets Not Available
              </p>
              <p className="font-secondary text-sm text-amber-700">
                {event.status === "SOLD_OUT"
                  ? "All tickets for this event have been sold out."
                  : event.status === "COMPLETED"
                    ? "This event has already taken place."
                    : event.status === "CANCELLED"
                      ? "This event has been cancelled."
                      : "Ticket sales are not currently open for this event."}
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-3 h-8 px-4 text-xs rounded-full border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Link href={`/events/${eventId}`}>View Event Details</Link>
              </Button>
            </div>
          </div>
        )}

        {/* ── No Active Tickets ── */}
        {isBookable && !hasActiveTickets && (
          <div className="mt-6 flex items-start gap-3 p-5 rounded-2xl border border-gray-200 bg-gray-50">
            <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <p className="font-secondary text-sm text-gray-600">
              No tickets are currently available for this event.
            </p>
          </div>
        )}

        {/* ── Ticket Cart ── */}
        {isBookable && hasActiveTickets && (
          <Suspense fallback={<TicketCartSkeleton />}>
            <TicketCart event={event} />
          </Suspense>
        )}
      </div>
    </main>
  );
}