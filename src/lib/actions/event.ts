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

/** Max cards shown in the "Latest" (ONGOING/ON_SALE) section of FeaturedEvents */
const FEATURED_ACTIVE_LIMIT = 8;
/** Max cards shown in the "Upcoming" (PUBLISHED) section of FeaturedEvents */
const FEATURED_UPCOMING_LIMIT = 4;

/**
 * Status priority for sorting on the /events listing page.
 * Lower number = shown first.
 */
const STATUS_PRIORITY: Record<string, number> = {
  ONGOING: 1,
  ON_SALE: 2,
  PUBLISHED: 3,
  SOLD_OUT: 4,
  COMPLETED: 5,
  CANCELLED: 6,
};

// ─── Shared Supabase select fragment (card-level) ─────────────────────────────
// NOTE: DRAFT events are intentionally excluded by all queries via .neq("status","DRAFT").
// organizer join is intentionally omitted here — organizer status must NOT affect visibility.

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

  // priority_order = 1 → thumbnail (card image)
  const sortedImages = images.slice().sort((a, b) => a.priority_order - b.priority_order);
  const thumbnailImage = sortedImages.find((i) => i.priority_order === 1)?.image_url
    ?? sortedImages[0]?.image_url
    ?? null;

  // Only active ticket types count toward the min price displayed on the card
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
    // joined / computed
    category: (row.categories as { name: string } | null)?.name ?? "General",
    thumbnail_image: thumbnailImage,
    start_ticket_price: startTicketPrice,
    vip_priority_order: vipRows[0]?.priority_order ?? null,
  };
}

/**
 * Sort comparator implementing the exact hierarchy:
 * 1. VIP events first, sorted by vip_priority_order ASC
 * 2. Then non-VIP, sorted by start_at ASC
 * 3. Tiebreak: status priority
 */
function sortEvents(a: Event, b: Event): number {
  const aVip = a.is_vip;
  const bVip = b.is_vip;

  if (aVip && bVip) {
    // Both VIP — sort by priority_order
    const pa = a.vip_priority_order ?? 9999;
    const pb = b.vip_priority_order ?? 9999;
    if (pa !== pb) return pa - pb;
  } else if (aVip && !bVip) {
    return -1; // VIP always before non-VIP
  } else if (!aVip && bVip) {
    return 1;
  }

  // Same VIP tier — sort by start_at
  const dateDiff =
    new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
  if (dateDiff !== 0) return dateDiff;

  // Tiebreak — status priority
  const sa = STATUS_PRIORITY[a.status] ?? 7;
  const sb = STATUS_PRIORITY[b.status] ?? 7;
  return sa - sb;
}

// ─── getFeaturedEvents ────────────────────────────────────────────────────────
/**
 * Business rules:
 * - Only ONGOING, ON_SALE, PUBLISHED statuses
 * - is_active = TRUE only
 * - DRAFT completely excluded
 * - Organizer status does NOT affect visibility
 * - Max 8 active (ONGOING/ON_SALE) + max 4 upcoming (PUBLISHED)
 * - Sorted: VIP priority_order → start_at → status
 */
export async function getFeaturedEvents(): Promise<GetFeaturedEventsResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .eq("is_active", true)
      .in("status", ["ONGOING", "ON_SALE", "PUBLISHED"])
      .neq("status", "DRAFT");

    if (error) {
      logger.error({
        fn: "getFeaturedEvents",
        message: "Supabase query failed",
        meta: error,
      });
      return { success: false, message: "Failed to load featured events." };
    }

    const rows = (data ?? []).map(mapRowToEvent).sort(sortEvents);

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
 * Business rules:
 * - All public statuses: ONGOING → ON_SALE → PUBLISHED → SOLD_OUT → COMPLETED → CANCELLED
 * - is_active = TRUE only
 * - DRAFT completely excluded
 * - Organizer status does NOT affect visibility
 * - Sorted: VIP priority_order → start_at → status
 */
export async function getAllEvents(): Promise<GetAllEventsResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .eq("is_active", true)
      .in("status", ["ONGOING", "ON_SALE", "PUBLISHED", "SOLD_OUT", "COMPLETED", "CANCELLED"])
      .neq("status", "DRAFT");

    if (error) {
      logger.error({
        fn: "getAllEvents",
        message: "Supabase query failed",
        meta: error,
      });
      return { success: false, message: "Failed to load events." };
    }

    const rows = (data ?? []).map(mapRowToEvent).sort(sortEvents);

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
 * Business rules:
 * - is_active = TRUE only
 * - DRAFT completely excluded
 * - Only is_active ticket_types are returned (inactive ones are hidden)
 * - Organizer status does NOT affect visibility
 * - priority_order=1 → thumbnail, priority_order=2 → banner
 */
export async function getEventById(eventId: string): Promise<GetEventByIdResult> {
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

    // ── Images: sort by priority_order ────────────────────────────────────────
    const rawImages: EventImage[] = (
      (data.event_images as EventImage[] | null) ?? []
    )
      .slice()
      .sort((a, b) => a.priority_order - b.priority_order);

    // priority_order = 1 → thumbnail / main gallery image
    const thumbnailImage =
      rawImages.find((i) => i.priority_order === 1)?.image_url ??
      rawImages[0]?.image_url ??
      null;

    // priority_order = 2 → banner / hero image
    const bannerImage =
      rawImages.find((i) => i.priority_order === 2)?.image_url ?? null;

    // ── Ticket types: only is_active = TRUE are returned ─────────────────────
    type RawTicketTypeRow = {
      ticket_type_id: string;
      event_id: string;
      name: string;
      description: string | null;
      inclusions: unknown;
      price: number | string;
      capacity: number;
      qty_sold: number | null;
      sale_start_at: string | null;
      sale_end_at: string | null;
      is_active: boolean;
      version: number | null;
      created_at: string;
      updated_at: string | null;
    };

    const rawTickets: TicketType[] = (
      (data.ticket_types as RawTicketTypeRow[] | null) ?? []
    )
      .filter((t) => t.is_active === true) // hide inactive ticket types
      .map((t) => ({
        ticket_type_id: t.ticket_type_id,
        event_id: t.event_id,
        name: t.name,
        description: t.description ?? "",
        inclusions: Array.isArray(t.inclusions)
          ? t.inclusions.filter((item): item is string => typeof item === "string")
          : [],
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

    // ── Organizer ─────────────────────────────────────────────────────────────
    // NOTE: organizer's account status is intentionally NOT checked here.
    // Event visibility is determined solely by event-level fields.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawUser = data.users as any;
    const organizer: Organizer = {
      user_id: rawUser?.user_id ?? "",
      name: rawUser?.name ?? "Unknown Organizer",
      image_url: rawUser?.image_url ?? null,
      email: rawUser?.email ?? "",
      username: rawUser?.username ?? "",
    };

    // ── Category ──────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawCat = data.categories as any;
    const categoryDetails: CategoryDetails = {
      category_id: rawCat?.category_id ?? data.category_id,
      name: rawCat?.name ?? "General",
      description: rawCat?.description ?? null,
    };

    const vipRows: { priority_order: number }[] =
      (data.vip_events as { priority_order: number }[] | null) ?? [];

    // Min price from active tickets only
    const activeTicketPrices = rawTickets.map((t) => t.price);
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
      category: categoryDetails.name,
      thumbnail_image: thumbnailImage,
      banner_image: bannerImage,
      start_ticket_price: startTicketPrice,
      vip_priority_order: vipRows[0]?.priority_order ?? null,
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