// lib/types/dashboard.ts
// All types derived strictly from DB schema in 01_tables_schema.sql
// Mirrors: users, events, organizer_details, tickets, orders, scan_logs,
//          ticket_types, payouts, refund_requests, promotions

import type { EventStatus } from "./event";
import type { OrganizerStatus } from "./organizer";
import type { PaymentStatus, PaymentSource } from "./payment";
import type { DiscountType } from "./checkout";

// ─── Shared Enums (mirror DB) ────────────────────────────────────────────────

/** DB enum: scan_result */
export type ScanResult =
  | "ALLOWED"
  | "DENIED_SOLD_OUT"
  | "DENIED_ALREADY_USED"
  | "DENIED_UNPAID"
  | "DENIED_INVALID";

/** DB enum: payout_status */
export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

/** DB enum: refund_status */
export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

// ═════════════════════════════════════════════════════════════════════════════
//  SYSTEM DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface SystemDashboardStats {
  total_users: number;
  total_organizers: number;
  total_events: number;
  total_revenue: number;
  pending_organizers: number;
  active_events: number;
}

// ─── Row Types ───────────────────────────────────────────────────────────────

export interface SystemUserRow {
  user_id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  image_url: string | null;
}

export interface SystemOrganizerRow {
  user_id: string;
  name: string;
  email: string;
  status: OrganizerStatus;
  nic_number: string;
  created_at: string;
  verified_at: string | null;
}

export interface SystemEventRow {
  event_id: string;
  name: string;
  organizer_name: string;
  status: EventStatus;
  start_at: string;
  location: string;
  tickets_sold: number;
  total_capacity: number;
}

export interface SystemPayoutRow {
  payout_id: string;
  event_name: string;
  organizer_name: string;
  gross_revenue: number;
  platform_fee_amount: number;
  net_payout_amount: number;
  status: PayoutStatus;
  created_at: string;
}

export interface SystemRefundRow {
  refund_id: string;
  order_id: string;
  user_name: string;
  event_name: string;
  refund_amount: number;
  reason: string;
  status: RefundStatus;
  created_at: string;
}

// ─── Result Types ────────────────────────────────────────────────────────────

export interface GetSystemDashboardResult {
  success: boolean;
  message?: string;
  stats?: SystemDashboardStats;
}

export interface GetSystemUsersResult {
  success: boolean;
  message?: string;
  data?: SystemUserRow[];
}

export interface GetSystemOrganizersResult {
  success: boolean;
  message?: string;
  data?: SystemOrganizerRow[];
}

export interface GetSystemEventsResult {
  success: boolean;
  message?: string;
  data?: SystemEventRow[];
}

export interface GetSystemPayoutsResult {
  success: boolean;
  message?: string;
  data?: SystemPayoutRow[];
}

export interface GetSystemRefundsResult {
  success: boolean;
  message?: string;
  data?: SystemRefundRow[];
}

// ═════════════════════════════════════════════════════════════════════════════
//  ORGANIZER DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface OrganizerDashboardStats {
  total_events: number;
  active_events: number;
  total_tickets_sold: number;
  total_revenue: number;
  pending_orders: number;
}

// ─── Row Types ───────────────────────────────────────────────────────────────

export interface OrganizerEventRow {
  event_id: string;
  name: string;
  status: EventStatus;
  start_at: string;
  end_at: string;
  location: string;
  tickets_sold: number;
  total_capacity: number;
  total_revenue: number;
}

export interface OrganizerOrderRow {
  order_id: string;
  buyer_name: string;
  event_name: string;
  final_amount: number;
  payment_status: PaymentStatus;
  payment_source: PaymentSource;
  created_at: string;
}

export interface OrganizerStaffRow {
  user_id: string;
  name: string;
  email: string;
  assigned_events_count: number;
}

export interface OrganizerPromotionRow {
  promotion_id: string;
  event_name: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  current_global_usage: number;
  is_active: boolean;
}

// ─── Result Types ────────────────────────────────────────────────────────────

export interface GetOrganizerDashboardResult {
  success: boolean;
  message?: string;
  stats?: OrganizerDashboardStats;
}

export interface GetOrganizerEventsResult {
  success: boolean;
  message?: string;
  data?: OrganizerEventRow[];
}

export interface GetOrganizerOrdersResult {
  success: boolean;
  message?: string;
  data?: OrganizerOrderRow[];
}

export interface GetOrganizerStaffResult {
  success: boolean;
  message?: string;
  data?: OrganizerStaffRow[];
}

export interface GetOrganizerPromotionsResult {
  success: boolean;
  message?: string;
  data?: OrganizerPromotionRow[];
}

// ═════════════════════════════════════════════════════════════════════════════
//  STAFF DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface StaffDashboardStats {
  assigned_events: number;
  total_scans_today: number;
  successful_scans_today: number;
  denied_scans_today: number;
}

// ─── Row Types ───────────────────────────────────────────────────────────────

export interface StaffEventRow {
  event_id: string;
  name: string;
  status: EventStatus;
  start_at: string;
  end_at: string;
  location: string;
  organizer_name: string;
}

export interface StaffScanLogRow {
  scan_log_id: string;
  ticket_id: string;
  event_name: string;
  result: ScanResult;
  scanned_at: string;
}

// ─── Result Types ────────────────────────────────────────────────────────────

export interface GetStaffDashboardResult {
  success: boolean;
  message?: string;
  stats?: StaffDashboardStats;
}

export interface GetStaffEventsResult {
  success: boolean;
  message?: string;
  data?: StaffEventRow[];
}

export interface GetStaffScanLogsResult {
  success: boolean;
  message?: string;
  data?: StaffScanLogRow[];
}
