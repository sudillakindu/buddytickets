// lib/actions/event.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import type { Event, EventDetail } from "@/lib/types/event";

export interface EventsResult {
  success: boolean;
  message: string;
  events?: Event[];
}

export interface EventDetailResult {
  success: boolean;
  message: string;
  event?: EventDetail;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

interface EventRow {
  event_id: string;
  name: string;
  subtitle: string;
  location: string;
  start_at: string;
  end_at: string;
  status: Event["status"];
  is_vip: boolean;
  organizer_id?: string;
  category_id?: string;
  description?: string;
  requirements?: string | null;
  map_link?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string | null;
  categories?: { name: string }[] | null;
  event_images?: { priority_order: number; image_url: string }[];
  ticket_types?: {
    ticket_type_id?: string;
    name?: string;
    description?: string;
    inclusions?: string[];
    price: number;
    capacity?: number;
    qty_sold?: number;
    sale_start_at?: string | null;
    sale_end_at?: string | null;
    is_active: boolean;
  }[];
}

function mapToEvent(row: EventRow): Event {
  const images: { priority_order: number; image_url: string }[] =
    row.event_images ?? [];
  images.sort((a, b) => a.priority_order - b.priority_order);
  const primaryImage = images[0]?.image_url ?? null;

  const ticketTypes: { price: number; is_active: boolean }[] =
    row.ticket_types ?? [];
  const activePrices = ticketTypes
    .filter((t) => t.is_active)
    .map((t) => Number(t.price));
  const startPrice = activePrices.length > 0 ? Math.min(...activePrices) : null;

  return {
    event_id: row.event_id,
    name: row.name,
    subtitle: row.subtitle,
    location: row.location,
    start_at: row.start_at,
    end_at: row.end_at,
    status: row.status,
    is_vip: row.is_vip,
    primary_image: primaryImage,
    category: row.categories?.[0]?.name ?? "—",
    start_ticket_price: startPrice,
  };
}

// ─── Queries (GET) ───────────────────────────────────────────────────────────

export async function getEvents(): Promise<EventsResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select(
        `
        event_id, name, subtitle, location, start_at, end_at,
        status, is_vip,
        categories ( name ),
        event_images ( priority_order, image_url ),
        ticket_types ( price, is_active )
      `,
      )
      .eq("is_active", true)
      .not("status", "in", '("DRAFT")')
      .order("start_at", { ascending: true });

    if (error) {
      console.error("[getEvents] DB error:", error.message);
      return { success: false, message: "Failed to load events." };
    }

    const events = (data ?? []).map(mapToEvent);
    return { success: true, message: "Events loaded.", events };
  } catch (err) {
    console.error("[getEvents]", err);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getEventById(
  eventId: string,
): Promise<EventDetailResult> {
  try {
    if (!eventId) return { success: false, message: "Event ID is required." };

    const { data, error } = await supabaseAdmin
      .from("events")
      .select(
        `
        event_id, organizer_id, category_id, name, subtitle, description,
        requirements, location, map_link, start_at, end_at, status,
        is_active, is_vip, created_at, updated_at,
        categories ( name ),
        event_images ( priority_order, image_url ),
        ticket_types (
          ticket_type_id, name, description, inclusions,
          price, capacity, qty_sold, sale_start_at, sale_end_at, is_active
        )
      `,
      )
      .eq("event_id", eventId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[getEventById] DB error:", error.message);
      return { success: false, message: "Failed to load event." };
    }
    if (!data) return { success: false, message: "Event not found." };

    const images = (data.event_images ?? []).sort(
      (a, b) => a.priority_order - b.priority_order,
    );

    const event: EventDetail = {
      ...mapToEvent(data),
      organizer_id: data.organizer_id,
      category_id: data.category_id,
      description: data.description,
      requirements: data.requirements,
      map_link: data.map_link,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      images,
      ticket_types: data.ticket_types ?? [],
    };

    return { success: true, message: "Event loaded.", event };
  } catch (err) {
    console.error("[getEventById]", err);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getFeaturedEvents(): Promise<EventsResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select(
        `
        event_id, name, subtitle, location, start_at, end_at,
        status, is_vip,
        categories ( name ),
        event_images ( priority_order, image_url ),
        ticket_types ( price, is_active )
      `,
      )
      .eq("is_active", true)
      .in("status", ["ON_SALE", "PUBLISHED", "ONGOING"])
      .order("is_vip", { ascending: false })
      .order("start_at", { ascending: true })
      .limit(8);

    if (error) {
      console.error("[getFeaturedEvents] DB error:", error.message);
      return { success: false, message: "Failed to load featured events." };
    }

    const events = (data ?? []).map(mapToEvent);
    return { success: true, message: "Featured events loaded.", events };
  } catch (err) {
    console.error("[getFeaturedEvents]", err);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getMyEvents(): Promise<EventsResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await supabaseAdmin
      .from("events")
      .select(
        `
        event_id, name, subtitle, location, start_at, end_at,
        status, is_vip,
        categories ( name ),
        event_images ( priority_order, image_url ),
        ticket_types ( price, is_active )
      `,
      )
      .eq("organizer_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getMyEvents] DB error:", error.message);
      return { success: false, message: "Failed to load your events." };
    }

    const events = (data ?? []).map(mapToEvent);
    return { success: true, message: "Events loaded.", events };
  } catch (err) {
    console.error("[getMyEvents]", err);
    return { success: false, message: "An unexpected error occurred." };
  }
}
