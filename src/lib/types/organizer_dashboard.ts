// lib/types/organizer_dashboard.ts
// Type definitions for the ORGANIZER dashboard.
// All data is scoped to the current organizer's own events.

// ─── Enums ───────────────────────────────────────────────────────────────────

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ON_SALE"
  | "SOLD_OUT"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type PaymentSource = "PAYMENT_GATEWAY" | "BANK_TRANSFER" | "ONGATE";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type ScanResult =
  | "ALLOWED"
  | "DENIED_SOLD_OUT"
  | "DENIED_ALREADY_USED"
  | "DENIED_UNPAID"
  | "DENIED_INVALID";

export type OrganizerVerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | "NO_RECORD";

// ─── Overview ────────────────────────────────────────────────────────────────

export interface OrganizerOverviewStats {
  total_events: number;
  draft_events: number;
  published_events: number;
  on_sale_events: number;
  ongoing_events: number;
  completed_events: number;
  cancelled_events: number;
  total_tickets_sold: number;
  total_gross_revenue: number;
  pending_payout_amount: number;
  upcoming_events_count: number;
  staff_count: number;
  average_rating: number | null;
}

export interface OrganizerRecentOrder {
  order_id: string;
  user_name: string;
  event_name: string;
  final_amount: number;
  payment_status: PaymentStatus;
  created_at: string;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface OrganizerEvent {
  event_id: string;
  name: string;
  subtitle: string;
  category_name: string;
  location: string;
  start_at: string;
  end_at: string;
  status: EventStatus;
  is_active: boolean;
  is_vip: boolean;
  tickets_sold: number;
  total_capacity: number;
  revenue: number;
  created_at: string;
}

export interface OrganizerEventDetail {
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
  platform_fee_type: DiscountType;
  platform_fee_value: number;
  platform_fee_cap: number | null;
  allowed_payment_methods: PaymentSource[] | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateEventInput {
  name: string;
  subtitle: string;
  description: string;
  requirements?: string;
  category_id: string;
  location: string;
  map_link: string;
  start_at: string;
  end_at: string;
  allowed_payment_methods?: PaymentSource[];
}

export interface UpdateEventInput extends CreateEventInput {
  event_id: string;
}

// ─── Categories (for dropdown) ───────────────────────────────────────────────

export interface CategoryOption {
  category_id: string;
  name: string;
}

// ─── Ticket Types ────────────────────────────────────────────────────────────

export interface OrganizerTicketType {
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
  created_at: string;
}

export interface CreateTicketTypeInput {
  event_id: string;
  name: string;
  description: string;
  inclusions: string[];
  price: number;
  capacity: number;
  sale_start_at?: string;
  sale_end_at?: string;
}

export interface UpdateTicketTypeInput extends CreateTicketTypeInput {
  ticket_type_id: string;
}

// ─── Staff ───────────────────────────────────────────────────────────────────

export interface OrganizerStaffMember {
  user_id: string;
  event_id: string;
  event_name: string;
  name: string;
  username: string;
  email: string;
  assigned_at: string;
}

// ─── Promotions ──────────────────────────────────────────────────────────────

export interface OrganizerPromotion {
  promotion_id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_cap: number | null;
  min_order_amount: number;
  start_at: string;
  end_at: string;
  is_active: boolean;
  usage_limit_global: number;
  usage_limit_per_user: number;
  current_global_usage: number;
  scope_event_id: string | null;
  scope_event_name: string | null;
  created_at: string;
}

export interface CreatePromotionInput {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_cap?: number;
  min_order_amount?: number;
  start_at: string;
  end_at: string;
  usage_limit_global?: number;
  usage_limit_per_user?: number;
  scope_event_id: string;
  scope_ticket_type_id?: string;
}

// ─── Sales / Orders ──────────────────────────────────────────────────────────

export interface OrganizerOrder {
  order_id: string;
  user_name: string;
  user_email: string;
  event_name: string;
  event_id: string;
  ticket_count: number;
  subtotal: number;
  discount_amount: number;
  final_amount: number;
  payment_source: PaymentSource;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface OrganizerSalesSummary {
  total_orders: number;
  total_revenue: number;
  total_discount_given: number;
}

// ─── Payouts ─────────────────────────────────────────────────────────────────

export interface OrganizerPayout {
  payout_id: string;
  event_id: string;
  event_name: string;
  gross_revenue: number;
  platform_fee_amount: number;
  net_payout_amount: number;
  status: PayoutStatus;
  bank_transfer_ref: string | null;
  processed_at: string | null;
  remarks: string | null;
  created_at: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface OrganizerReview {
  review_id: string;
  event_id: string;
  event_name: string;
  user_name: string;
  rating: number;
  review_text: string | null;
  is_visible: boolean;
  created_at: string;
}

// ─── Action Results ──────────────────────────────────────────────────────────

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface ActionResultWithData<T> extends ActionResult {
  data?: T;
}

export interface PaginatedResult<T> extends ActionResult {
  data?: T[];
  total_count?: number;
  page?: number;
  per_page?: number;
}
