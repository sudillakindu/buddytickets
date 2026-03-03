// lib/types/event.ts

// ─── Enums ────────────────────────────────────────────────────────────────────

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ON_SALE"
  | "SOLD_OUT"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

// ─── Card-level Event ─────────────────────────────────────────────────────────
// Used in event listings (FeaturedEvents, /events page, event cards).
// Computed fields are derived during data mapping in server actions.

export interface Event {
  event_id: string;
  organizer_id: string;
  category_id: string;
  name: string;
  subtitle: string;
  description: string;
  requirements: string | null;
  location: string;
  map_link: string;
  start_at: string;
  end_at: string;
  status: EventStatus;
  is_active: boolean;
  is_vip: boolean;
  created_at: string;
  updated_at: string | null;
  // ── Computed / joined ──────────────────────────────────────────────────────
  category: string;
  /** priority_order = 1 image → used as card thumbnail */
  thumbnail_image: string | null;
  /** Lowest active ticket price */
  start_ticket_price: number | null;
  vip_priority_order: number | null;
}

// ─── Sub-types ────────────────────────────────────────────────────────────────

export interface EventImage {
  event_id: string;
  priority_order: number;
  image_url: string;
  created_at: string;
}

export interface TicketType {
  ticket_type_id: string;
  event_id: string;
  name: string;
  description: string;
  inclusions: string[];
  price: number;
  capacity: number;
  qty_sold: number;
  sale_start_at: string | null;
  sale_end_at: string | null;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string | null;
}

export interface Organizer {
  user_id: string;
  name: string;
  image_url: string | null;
  email: string;
  username: string;
}

export interface CategoryDetails {
  category_id: string;
  name: string;
  description: string | null;
}

// ─── Full Event Details ───────────────────────────────────────────────────────
// Used on /events/[eventId] page. Extends Event with all joined relations.

export interface EventDetails extends Event {
  /** All images sorted by priority_order ASC */
  images: EventImage[];
  /** priority_order = 1 → thumbnail / main card image */
  thumbnail_image: string | null;
  /** priority_order = 2 → banner / hero image */
  banner_image: string | null;
  /** Only is_active = TRUE ticket types */
  ticket_types: TicketType[];
  organizer: Organizer;
  category_details: CategoryDetails;
}

// ─── Server Action Response Types ────────────────────────────────────────────

export interface GetFeaturedEventsResult {
  success: boolean;
  events?: Event[];
  message?: string;
}

export interface GetAllEventsResult {
  success: boolean;
  events?: Event[];
  message?: string;
}

export interface GetEventByIdResult {
  success: boolean;
  event?: EventDetails;
  message?: string;
}