// lib/types/event.ts
export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ON_SALE"
  | "SOLD_OUT"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export interface Event {
  event_id: string;
  name: string;
  subtitle: string;
  location: string;
  start_at: string;
  end_at: string;
  status: EventStatus;
  is_vip: boolean;
  primary_image: string | null;
  category: string;
  start_ticket_price: number | null;
}

export interface EventDetail extends Event {
  organizer_id: string;
  category_id: string;
  description: string;
  requirements: string | null;
  map_link: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  images: { priority_order: number; image_url: string }[];
  ticket_types: {
    ticket_type_id: string;
    name: string;
    description: string;
    inclusions: string[];
    price: number;
    capacity: number;
    qty_sold: number;
    sale_start_at: string | null;
    sale_end_at: string | null;
    is_active: boolean;
  }[];
}
