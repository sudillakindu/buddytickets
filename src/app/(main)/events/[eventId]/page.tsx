// app/(main)/events/[eventId]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getEventById } from "@/lib/actions/event";
import { EventDetail } from "@/components/shared/event/event-detail";
import { EventDetailSkeleton } from "@/components/shared/event/event-detail-skeleton";
import { logger } from "@/lib/logger";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

// ─── Dynamic metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const result = await getEventById(eventId);

  if (!result.success || !result.event) {
    return { title: "Event Not Found" };
  }

  return {
    title: result.event.name,
    description: result.event.subtitle || result.event.description.slice(0, 160),
    openGraph: {
      title: result.event.name,
      description: result.event.subtitle || result.event.description.slice(0, 160),
      images: result.event.primary_image ? [{ url: result.event.primary_image }] : [],
    },
  };
}

// ─── Inner async component (wrapped in Suspense) ──────────────────────────────
async function EventDetailLoader({ eventId }: { eventId: string }) {
  const result = await getEventById(eventId);

  if (!result.success || !result.event) {
    logger.error({
      fn: "EventDetailPage",
      message: result.message ?? "Event not found",
      meta: { eventId },
    });
    notFound();
  }

  return <EventDetail event={result.event} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;

  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventDetailLoader eventId={eventId} />
    </Suspense>
  );
}