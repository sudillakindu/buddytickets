// Mirrors the event_status ENUM in the database
export type EventStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ON_SALE'
  | 'SOLD_OUT'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

// Flat representation used by UI cards — assembled from DB joins
export interface Event {
  event_id: string;
  name: string;
  subtitle: string;
  location: string;
  start_at: string;
  end_at: string;
  status: EventStatus;
  is_vip: boolean;
  // Derived from event_images (priority_order = 1)
  primary_image: string | null;
  // Derived from categories join
  category: string;
  // Derived from MIN(ticket_types.price) — null means no tickets yet
  start_ticket_price: number | null;
}

// Full detail shape used on a single event page
export interface EventDetail extends Event {
  event_id: string;
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