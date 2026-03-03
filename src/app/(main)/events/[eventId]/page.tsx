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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const result = await getEventById(eventId);

  if (!result.success || !result.event) return { title: "Event Not Found" };

  const { event } = result;
  return {
    title: event.name,
    description: event.subtitle || event.description.slice(0, 160),
    openGraph: {
      title: event.name,
      description: event.subtitle || event.description.slice(0, 160),
      images: event.banner_image ? [{ url: event.banner_image }] : event.thumbnail_image ? [{ url: event.thumbnail_image }] : [],
    },
  };
}

async function EventDetailLoader({ eventId }: { eventId: string }) {
  const result = await getEventById(eventId);
  if (!result.success || !result.event) {
    logger.error({ fn: "EventDetailPage", message: result.message ?? "Not found", meta: { eventId } });
    notFound();
  }
  return <EventDetail event={result.event} />;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;
  return (
    <Suspense fallback={<EventDetailSkeleton />}>
      <EventDetailLoader eventId={eventId} />
    </Suspense>
  );
}