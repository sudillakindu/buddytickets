// app/(main)/events/[eventId]/buy-tickets/page.tsx
// Server Component: fetches event data, renders ticket-details view.
//
// This page is accessible to guests (no auth required to browse).
// Authentication is enforced in the createReservation server action
// when the user clicks "Proceed to Checkout".

import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getEventById } from "@/lib/actions/event";
import { TicketDetails } from "@/components/shared/buy-ticket/ticket-details";
import { TicketDetailsSkeleton } from "@/components/shared/buy-ticket/ticket-details-skeleton";
import { logger } from "@/lib/logger";

// --- Types ---

interface PageProps {
  params: Promise<{ eventId: string }>;
}

// --- Metadata ---

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const result = await getEventById(eventId);

  if (!result.success || !result.event) {
    return { title: "Event Not Found — BuddyTicket" };
  }

  const { event } = result;
  const description =
    event.subtitle || event.description?.slice(0, 160) || "";

  return {
    title: `Buy Tickets — ${event.name} | BuddyTicket`,
    description: `Select your tickets for ${event.name}. Fast, secure checkout.`,
    openGraph: {
      title: `Buy Tickets — ${event.name}`,
      description,
      images: event.banner_image ?? event.thumbnail_image
        ? [{ url: (event.banner_image ?? event.thumbnail_image)! }]
        : [],
    },
  };
}

// --- Loader ---

async function TicketDetailsLoader({ eventId }: { eventId: string }) {
  const result = await getEventById(eventId);

  if (!result.success || !result.event) {
    logger.error({
      fn: "BuyTicketsPage",
      message: result.message ?? "Event not found",
      meta: { eventId },
    });
    notFound();
  }

  return <TicketDetails event={result.event} />;
}

// --- Page ---

export default async function BuyTicketsPage({ params }: PageProps) {
  const { eventId } = await params;
  return (
    <Suspense fallback={<TicketDetailsSkeleton />}>
      <TicketDetailsLoader eventId={eventId} />
    </Suspense>
  );
}