"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/types/supabase";

type PaymentSource = Database["public"]["Enums"]["payment_source"];

// --- Row Type Aliases ---
type EventsRow = Database["public"]["Tables"]["events"]["Row"];
type EventImageRow = Database["public"]["Tables"]["event_images"]["Row"];
type TicketTypesRow = Database["public"]["Tables"]["ticket_types"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type VipEventsRow = Database["public"]["Tables"]["vip_events"]["Row"];

// --- Derived Read Types ---
type EventImage = EventImageRow;

// Mapped output type: inclusions filtered to string[], qty_sold/version defaulted to non-null
type TicketType = Omit<TicketTypesRow, "inclusions" | "qty_sold" | "version"> & {
  inclusions: string[];
  qty_sold: number;
  version: number;
};

type Organizer = Pick<UserRow, "user_id" | "name" | "image_url" | "email" | "username">;

type CategoryDetails = Pick<CategoryRow, "category_id" | "name" | "description">;

type Event = Pick<
  EventsRow,
  | "event_id" | "organizer_id" | "category_id" | "name" | "subtitle"
  | "description" | "requirements" | "location" | "map_link" | "start_at"
  | "end_at" | "status" | "is_active" | "is_vip"
  | "allowed_payment_methods" | "created_at" | "updated_at"
> & {
  category: string;
  thumbnail_image: string | null;
  start_ticket_price: number | null;
  vip_priority_order: number | null;
};

interface EventDetails extends Event {
  images: EventImage[];
  banner_image: string | null;
  ticket_types: TicketType[];
  organizer: Organizer;
  category_details: CategoryDetails;
}

interface BaseActionResponse {
  success: boolean;
  message?: string;
}

interface GetFeaturedEventsResult extends BaseActionResponse {
  events?: Event[];
}

interface GetAllEventsResult extends BaseActionResponse {
  events?: Event[];
}

interface GetEventByIdResult extends BaseActionResponse {
  event?: EventDetails;
}

const FEATURED_ACTIVE_LIMIT = 8;
const FEATURED_UPCOMING_LIMIT = 4;

const STATUS_PRIORITY: Record<string, number> = {
  ONGOING: 1,
  ON_SALE: 2,
  PUBLISHED: 3,
  SOLD_OUT: 4,
  COMPLETED: 5,
  CANCELLED: 6,
};

const EVENT_CARD_SELECT = `
  event_id, organizer_id, category_id, name, subtitle, description, requirements,
  location, map_link, start_at, end_at, status, is_active, is_vip,
  allowed_payment_methods, created_at, updated_at,
  categories ( name ),
  event_images ( image_url, priority_order ),
  ticket_types ( price, is_active ),
  vip_events ( priority_order )
` as const;

// Raw shape returned by Supabase for EVENT_CARD_SELECT
type RawEventRow = Pick<
  EventsRow,
  | "event_id" | "organizer_id" | "category_id" | "name" | "subtitle"
  | "description" | "requirements" | "location" | "map_link" | "start_at"
  | "end_at" | "status" | "is_active" | "is_vip"
  | "allowed_payment_methods" | "created_at" | "updated_at"
> & {
  categories: Pick<CategoryRow, "name"> | null;
  event_images: Pick<EventImageRow, "image_url" | "priority_order">[];
  ticket_types: Pick<TicketTypesRow, "price" | "is_active">[];
  vip_events: Pick<VipEventsRow, "priority_order">[];
};

// Map raw Supabase row to standardized Event object
function mapRowToEvent(row: RawEventRow): Event {
  const images = row.event_images ?? [];
  const tickets = row.ticket_types ?? [];
  const vipRows = row.vip_events ?? [];

  const sortedImages = [...images].sort(
    (a, b) => a.priority_order - b.priority_order,
  );
  const thumbnailImage =
    sortedImages.find((i) => i.priority_order === 1)?.image_url ??
    sortedImages[0]?.image_url ??
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
    allowed_payment_methods: row.allowed_payment_methods ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    category: row.categories?.name ?? "General",
    thumbnail_image: thumbnailImage,
    start_ticket_price: startTicketPrice,
    vip_priority_order: vipRows[0]?.priority_order ?? null,
  };
}

function sortEvents(a: Event, b: Event): number {
  if (a.is_vip && b.is_vip)
    return (a.vip_priority_order ?? 9999) - (b.vip_priority_order ?? 9999);
  if (a.is_vip) return -1;
  if (b.is_vip) return 1;

  const dateDiff =
    new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
  if (dateDiff !== 0) return dateDiff;

  return (STATUS_PRIORITY[a.status ?? ""] ?? 7) - (STATUS_PRIORITY[b.status ?? ""] ?? 7);
}

export async function getFeaturedEvents(): Promise<GetFeaturedEventsResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .eq("is_active", true)
      .in("status", ["ONGOING", "ON_SALE", "PUBLISHED"]);

    if (error) throw error;

    const sorted = ((data ?? []) as unknown as RawEventRow[])
      .map(mapRowToEvent)
      .sort(sortEvents);
    const activeEvents = sorted
      .filter((e) => e.status === "ON_SALE" || e.status === "ONGOING")
      .slice(0, FEATURED_ACTIVE_LIMIT);
    const upcomingEvents = sorted
      .filter((e) => e.status === "PUBLISHED")
      .slice(0, FEATURED_UPCOMING_LIMIT);

    return { success: true, events: [...activeEvents, ...upcomingEvents] };
  } catch (err) {
    logger.error({
      fn: "getFeaturedEvents",
      message: "Error fetching featured events",
      meta: err,
    });
    return { success: false, message: "Failed to load featured events." };
  }
}

export async function getAllEvents(): Promise<GetAllEventsResult> {
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
      ]);

    if (error) throw error;

    return {
      success: true,
      events: ((data ?? []) as unknown as RawEventRow[])
        .map(mapRowToEvent)
        .sort(sortEvents),
    };
  } catch (err) {
    logger.error({
      fn: "getAllEvents",
      message: "Error fetching all events",
      meta: err,
    });
    return { success: false, message: "Failed to load events." };
  }
}

export async function getEventById(
  eventId: string,
): Promise<GetEventByIdResult> {
  if (!eventId) return { success: false, message: "Event ID is required." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        event_id, organizer_id, category_id, name, subtitle, description,
        requirements, location, map_link, start_at, end_at, status,
        is_active, is_vip, allowed_payment_methods, created_at, updated_at,
        categories ( category_id, name, description ),
        event_images ( event_id, priority_order, image_url, created_at ),
        ticket_types ( ticket_type_id, event_id, name, description, inclusions, price, capacity, qty_sold, sale_start_at, sale_end_at, is_active, version, created_at, updated_at ),
        users!events_organizer_id_fkey ( user_id, name, image_url, email, username ),
        vip_events ( priority_order )
      `,
      )
      .eq("event_id", eventId)
      .eq("is_active", true)
      .neq("status", "DRAFT")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, message: "Event not found." };

    const sortedImages = ((data.event_images as EventImage[]) ?? []).sort(
      (a, b) => a.priority_order - b.priority_order,
    );
    const thumbnailImage =
      sortedImages.find((i) => i.priority_order === 1)?.image_url ??
      sortedImages[0]?.image_url ??
      null;
    const bannerImage =
      sortedImages.find((i) => i.priority_order === 2)?.image_url ?? null;

    const ticketTypes: TicketType[] = (
      (data.ticket_types as TicketType[]) ?? []
    )
      .filter((t) => t.is_active)
      .map((t) => ({
        ...t,
        price: Number(t.price),
        qty_sold: t.qty_sold ?? 0,
        inclusions: Array.isArray(t.inclusions)
          ? t.inclusions.filter((i): i is string => typeof i === "string")
          : [],
        version: t.version ?? 1,
      }));

    const rawUser = Array.isArray(data.users) ? data.users[0] : data.users;
    const organizer: Organizer = {
      user_id: rawUser?.user_id ?? "",
      name: rawUser?.name ?? "Unknown Organizer",
      image_url: rawUser?.image_url ?? null,
      email: rawUser?.email ?? "",
      username: rawUser?.username ?? "",
    };

    const rawCategory = Array.isArray(data.categories)
      ? data.categories[0]
      : data.categories;
    const categoryDetails: CategoryDetails = {
      category_id: rawCategory?.category_id ?? data.category_id,
      name: rawCategory?.name ?? "General",
      description: rawCategory?.description ?? null,
    };

    const activeTicketPrices = ticketTypes.map((t) => t.price);
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
      allowed_payment_methods:
        (data.allowed_payment_methods as
          | PaymentSource[]
          | null) ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at ?? null,
      category: categoryDetails.name,
      thumbnail_image: thumbnailImage,
      banner_image: bannerImage,
      start_ticket_price: startTicketPrice,
      vip_priority_order: data.vip_events?.[0]?.priority_order ?? null,
      images: sortedImages,
      ticket_types: ticketTypes,
      organizer,
      category_details: categoryDetails,
    };

    return { success: true, event };
  } catch (err) {
    logger.error({
      fn: "getEventById",
      message: "Error fetching event details",
      meta: err,
    });
    return { success: false, message: "Event not found or an error occurred." };
  }
}
