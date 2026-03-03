"use server";

// lib/actions/event.ts

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

import type {
  Event,
  EventDetails,
  EventImage,
  TicketType,
  Organizer,
  CategoryDetails,
  GetFeaturedEventsResult,
  GetAllEventsResult,
  GetEventByIdResult,
} from "@/lib/types/event";

// ─── Constants ────────────────────────────────────────────────────────────────
const FEATURED_ACTIVE_LIMIT = 8;   // max ON_SALE / ONGOING cards
const FEATURED_UPCOMING_LIMIT = 4; // max PUBLISHED cards

// ─── Shared select fragment ───────────────────────────────────────────────────
const EVENT_CARD_SELECT = `
  event_id,
  organizer_id,
  category_id,
  name,
  subtitle,
  description,
  requirements,
  location,
  map_link,
  start_at,
  end_at,
  status,
  is_active,
  is_vip,
  created_at,
  updated_at,
  categories ( name ),
  event_images ( image_url, priority_order ),
  ticket_types ( price, is_active ),
  vip_events ( priority_order )
` as const;

// ─── Row → Event mapper ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToEvent(row: any): Event {
  const images: { image_url: string; priority_order: number }[] =
    row.event_images ?? [];
  const tickets: { price: number; is_active: boolean }[] =
    row.ticket_types ?? [];
  const vipRows: { priority_order: number }[] = row.vip_events ?? [];

  const primaryImage =
    images
      .slice()
      .sort((a, b) => a.priority_order - b.priority_order)[0]?.image_url ??
    null;

  const activeTicketPrices = tickets
    .filter((t) => t.is_active)
    .map((t) => Number(t.price));

  const startTicketPrice =
    activeTicketPrices.length > 0 ? Math.min(...activeTicketPrices) : null;

  return {
    event_id: row.event_id,
    organizer_id: row.organizer_id,
    category_id: row.category_id,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    requirements: row.requirements ?? null,
    location: row.location,
    map_link: row.map_link,
    start_at: row.start_at,
    end_at: row.end_at,
    status: row.status,
    is_active: row.is_active,
    is_vip: row.is_vip,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    // joined
    category: (row.categories as { name: string } | null)?.name ?? "General",
    primary_image: primaryImage,
    start_ticket_price: startTicketPrice,
    vip_priority_order: vipRows[0]?.priority_order ?? null,
  };
}

// ─── getFeaturedEvents ────────────────────────────────────────────────────────
/**
 * Returns up to 8 ONGOING/ON_SALE + up to 4 PUBLISHED events,
 * ordered VIP-first then by start_at ASC.
 */
export async function getFeaturedEvents(): Promise<GetFeaturedEventsResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .eq("is_active", true)
      .in("status", ["ONGOING", "ON_SALE", "PUBLISHED"])
      .order("is_vip", { ascending: false })
      .order("start_at", { ascending: true });

    if (error) {
      logger.error({
        fn: "getFeaturedEvents",
        message: "Supabase query failed",
        meta: error,
      });
      return { success: false, message: "Failed to load featured events." };
    }

    const rows = (data ?? []).map(mapRowToEvent);

    const activeEvents = rows
      .filter((e) => e.status === "ON_SALE" || e.status === "ONGOING")
      .slice(0, FEATURED_ACTIVE_LIMIT);

    const upcomingEvents = rows
      .filter((e) => e.status === "PUBLISHED")
      .slice(0, FEATURED_UPCOMING_LIMIT);

    return { success: true, events: [...activeEvents, ...upcomingEvents] };
  } catch (err) {
    logger.error({
      fn: "getFeaturedEvents",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── getAllEvents ─────────────────────────────────────────────────────────────
/**
 * Returns all publicly visible active events, ordered by status priority
 * then VIP then start_at.
 */
export async function getAllEvents(): Promise<GetAllEventsResult> {
  const STATUS_PRIORITY: Record<string, number> = {
    ONGOING: 1,
    ON_SALE: 2,
    PUBLISHED: 3,
    SOLD_OUT: 4,
    COMPLETED: 5,
    CANCELLED: 6,
  };

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .eq("is_active", true)
      .in("status", [
        "ONGOING",
        "ON_SALE",
        "PUBLISHED",
        "SOLD_OUT",
        "COMPLETED",
        "CANCELLED",
      ])
      .order("start_at", { ascending: true });

    if (error) {
      logger.error({
        fn: "getAllEvents",
        message: "Supabase query failed",
        meta: error,
      });
      return { success: false, message: "Failed to load events." };
    }

    const rows = (data ?? [])
      .map(mapRowToEvent)
      .sort((a, b) => {
        const pa = STATUS_PRIORITY[a.status] ?? 7;
        const pb = STATUS_PRIORITY[b.status] ?? 7;
        if (pa !== pb) return pa - pb;
        if (a.is_vip !== b.is_vip) return a.is_vip ? -1 : 1;
        return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
      });

    return { success: true, events: rows };
  } catch (err) {
    logger.error({
      fn: "getAllEvents",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── getEventById ─────────────────────────────────────────────────────────────
/**
 * Returns full event details including images, ticket types, organizer, etc.
 * Excludes DRAFT events.
 */
export async function getEventById(
  eventId: string,
): Promise<GetEventByIdResult> {
  if (!eventId) {
    return { success: false, message: "Event ID is required." };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select(
        `
        event_id,
        organizer_id,
        category_id,
        name,
        subtitle,
        description,
        requirements,
        location,
        map_link,
        start_at,
        end_at,
        status,
        is_active,
        is_vip,
        created_at,
        updated_at,
        categories ( category_id, name, description ),
        event_images ( event_id, priority_order, image_url, created_at ),
        ticket_types (
          ticket_type_id, event_id, name, description,
          inclusions, price, capacity, qty_sold,
          sale_start_at, sale_end_at, is_active, version,
          created_at, updated_at
        ),
        users!events_organizer_id_fkey (
          user_id, name, image_url, email, username
        ),
        vip_events ( priority_order )
      `,
      )
      .eq("event_id", eventId)
      .eq("is_active", true)
      .neq("status", "DRAFT")
      .maybeSingle();

    if (error) {
      logger.error({
        fn: "getEventById",
        message: "Supabase query failed",
        meta: error,
      });
      return { success: false, message: "Failed to load event details." };
    }

    if (!data) {
      return { success: false, message: "Event not found." };
    }

    // ── Map raw data ────────────────────────────────────────────────────────
    const rawImages: EventImage[] = (
      (data.event_images as EventImage[] | null) ?? []
    )
      .slice()
      .sort((a, b) => a.priority_order - b.priority_order);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawTickets: TicketType[] = (
      (data.ticket_types as any[] | null) ?? []
    ).map((t) => ({
      ticket_type_id: t.ticket_type_id,
      event_id: t.event_id,
      name: t.name,
      description: t.description,
      inclusions: Array.isArray(t.inclusions) ? t.inclusions : [],
      price: Number(t.price),
      capacity: t.capacity,
      qty_sold: t.qty_sold ?? 0,
      sale_start_at: t.sale_start_at ?? null,
      sale_end_at: t.sale_end_at ?? null,
      is_active: t.is_active,
      version: t.version ?? 1,
      created_at: t.created_at,
      updated_at: t.updated_at ?? null,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawUser = data.users as any;
    const organizer: Organizer = {
      user_id: rawUser?.user_id ?? "",
      name: rawUser?.name ?? "Unknown Organizer",
      image_url: rawUser?.image_url ?? null,
      email: rawUser?.email ?? "",
      username: rawUser?.username ?? "",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawCat = data.categories as any;
    const categoryDetails: CategoryDetails = {
      category_id: rawCat?.category_id ?? data.category_id,
      name: rawCat?.name ?? "General",
      description: rawCat?.description ?? null,
    };

    const vipRows: { priority_order: number }[] =
      (data.vip_events as { priority_order: number }[] | null) ?? [];

    const activeTicketPrices = rawTickets
      .filter((t) => t.is_active)
      .map((t) => t.price);

    const startTicketPrice =
      activeTicketPrices.length > 0 ? Math.min(...activeTicketPrices) : null;

    const event: EventDetails = {
      event_id: data.event_id,
      organizer_id: data.organizer_id,
      category_id: data.category_id,
      name: data.name,
      subtitle: data.subtitle,
      description: data.description,
      requirements: data.requirements ?? null,
      location: data.location,
      map_link: data.map_link,
      start_at: data.start_at,
      end_at: data.end_at,
      status: data.status,
      is_active: data.is_active,
      is_vip: data.is_vip,
      created_at: data.created_at,
      updated_at: data.updated_at ?? null,
      // computed
      category: categoryDetails.name,
      primary_image: rawImages[0]?.image_url ?? null,
      start_ticket_price: startTicketPrice,
      vip_priority_order: vipRows[0]?.priority_order ?? null,
      // joined
      images: rawImages,
      ticket_types: rawTickets,
      organizer,
      category_details: categoryDetails,
    };

    return { success: true, event };
  } catch (err) {
    logger.error({
      fn: "getEventById",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}