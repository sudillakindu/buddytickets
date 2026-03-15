export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ON_SALE"
  | "SOLD_OUT"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export type PlatformFeeType = "PERCENTAGE" | "FIXED_AMOUNT";

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
  platform_fee_type: PlatformFeeType;
  platform_fee_value: number;
  platform_fee_cap: number | null;
  allowed_payment_methods: import("./payment").PaymentMethod[] | null;
  created_at: string;
  updated_at: string | null;
  category: string;
  thumbnail_image: string | null;
  start_ticket_price: number | null;
  vip_priority_order: number | null;
}

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

export interface EventDetails extends Event {
  images: EventImage[];
  banner_image: string | null;
  ticket_types: TicketType[];
  organizer: Organizer;
  category_details: CategoryDetails;
}

export interface BaseActionResponse {
  success: boolean;
  message?: string;
}

export interface GetFeaturedEventsResult extends BaseActionResponse {
  events?: Event[];
}

export interface GetAllEventsResult extends BaseActionResponse {
  events?: Event[];
}

export interface GetEventByIdResult extends BaseActionResponse {
  event?: EventDetails;
}
