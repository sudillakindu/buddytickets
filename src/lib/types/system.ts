// lib/types/system.ts
// Type definitions for the SYSTEM (admin) dashboard.
// Mirrors DB schema — snake_case column names are preserved.

// ─── Enums (mirror DB) ──────────────────────────────────────────────────────

export type UserRole = "SYSTEM" | "ORGANIZER" | "STAFF" | "USER";

export type OrganizerStatus = "PENDING" | "APPROVED" | "REJECTED";

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

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

export type ScanResult =
  | "ALLOWED"
  | "DENIED_SOLD_OUT"
  | "DENIED_ALREADY_USED"
  | "DENIED_UNPAID"
  | "DENIED_INVALID";

// ─── Users ──────────────────────────────────────────────────────────────────

/** System-level user row — NEVER includes password_hash. */
export interface SystemUser {
  user_id: string;
  name: string;
  image_url: string | null;
  email: string;
  is_email_verified: boolean;
  mobile: string;
  is_mobile_verified: boolean;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  last_login_at: string | null;
}

// ─── Organizer Verification ─────────────────────────────────────────────────

/** Organizer verification request — joined with user name & email. */
export interface SystemOrganizerVerification {
  user_id: string;
  nic_number: string;
  address: string;
  bank_name: string;
  bank_branch: string;
  account_holder_name: string;
  account_number: string;
  nic_front_image_url: string;
  nic_back_image_url: string;
  remarks: string | null;
  status: OrganizerStatus;
  is_submitted: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string | null;
  // Joined from users
  user_name: string;
  user_email: string;
  user_image_url: string | null;
}

// ─── Categories ─────────────────────────────────────────────────────────────

export interface SystemCategory {
  category_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  // Derived
  events_count: number;
}

// ─── Events ─────────────────────────────────────────────────────────────────

/** Event row for the system dashboard — includes joined organizer/category info. */
export interface SystemEvent {
  event_id: string;
  organizer_id: string;
  category_id: string;
  name: string;
  subtitle: string;
  location: string;
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
  // Joined / derived
  organizer_name: string;
  category_name: string;
  tickets_sold: number;
  thumbnail_image: string | null;
}

// ─── Promotions ─────────────────────────────────────────────────────────────

export interface SystemPromotion {
  promotion_id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_cap: number | null;
  min_order_amount: number | null;
  start_at: string;
  end_at: string;
  is_active: boolean;
  usage_limit_global: number | null;
  usage_limit_per_user: number | null;
  current_global_usage: number;
  scope_event_id: string | null;
  scope_ticket_type_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  version: number;
  // Joined / derived
  usage_count: number;
  scope_event_name: string | null;
}

// ─── Orders ─────────────────────────────────────────────────────────────────

/** Recent order row for the system dashboard. */
export interface SystemOrder {
  order_id: string;
  user_id: string;
  event_id: string;
  promotion_id: string | null;
  subtotal: number;
  discount_amount: number;
  final_amount: number;
  payment_source: PaymentSource;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string | null;
  // Joined
  user_name: string;
  event_name: string;
}

// ─── Payouts ────────────────────────────────────────────────────────────────

export interface SystemPayout {
  payout_id: string;
  event_id: string;
  organizer_id: string;
  gross_revenue: number;
  platform_fee_amount: number;
  net_payout_amount: number;
  status: PayoutStatus;
  bank_transfer_ref: string | null;
  processed_by: string | null;
  processed_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string | null;
  // Joined
  organizer_name: string;
  event_name: string;
}

// ─── Refund Requests ────────────────────────────────────────────────────────

export interface SystemRefund {
  refund_id: string;
  order_id: string;
  ticket_id: string;
  user_id: string;
  reason: string;
  refund_amount: number;
  status: RefundStatus;
  admin_note: string | null;
  gateway_refund_ref: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string | null;
  // Joined
  user_name: string;
  event_name: string;
  order_payment_source: PaymentSource;
  order_final_amount: number;
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export interface SystemReview {
  review_id: string;
  event_id: string;
  user_id: string;
  ticket_id: string;
  rating: number;
  review_text: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string | null;
  // Joined
  user_name: string;
  event_name: string;
}

// ─── Scan Activity ──────────────────────────────────────────────────────────

export interface ScanActivityStats {
  total_scans: number;
  allowed: number;
  denied: number;
  recent_scans: {
    scan_id: number;
    ticket_id: string;
    scanned_by_user_id: string;
    result: ScanResult;
    scanned_at: string;
    // Joined
    scanned_by_name: string;
    event_name: string;
  }[];
}

// ─── Overview Stats ─────────────────────────────────────────────────────────

/** Counters displayed on the system overview / dashboard home page. */
export interface OverviewStats {
  total_users: number;
  total_organizers: number;
  pending_verifications: number;
  total_events: number;
  active_events: number;
  total_orders: number;
  total_revenue: number;
  total_tickets_sold: number;
  pending_payouts: number;
  pending_refunds: number;
}

// ─── Action Results ─────────────────────────────────────────────────────────

/** Generic mutation result used across system actions. */
export interface ActionResult {
  success: boolean;
  message: string;
}

/** Action result that returns a single entity. */
export interface ActionResultWithData<T> extends ActionResult {
  data?: T;
}

/** Paginated list response. */
export interface PaginatedResult<T> extends ActionResult {
  data?: T[];
  total_count?: number;
  page?: number;
  per_page?: number;
}
