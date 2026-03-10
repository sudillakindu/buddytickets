// lib/types/system.ts
import type { OrganizerStatus, UserRole } from "./organizer";
import type { EventStatus } from "./event";

// ─── Generic Result ──────────────────────────────────────────────────────────

export interface SystemActionResult {
  success: boolean;
  message: string;
}

// ─── Overview ────────────────────────────────────────────────────────────────

export interface OverviewStats {
  totalUsers: number;
  totalApprovedOrganizers: number;
  totalEvents: number;
  platformRevenue: number;
}

export interface RecentVerification {
  user_id: string;
  name: string;
  email: string;
  status: OrganizerStatus;
  verified_at: string | null;
  created_at: string;
}

export interface RecentPayout {
  payout_id: string;
  event_name: string;
  organizer_name: string;
  net_payout_amount: number;
  status: PayoutStatus;
  created_at: string;
}

export interface RecentRefund {
  refund_id: string;
  user_name: string;
  refund_amount: number;
  status: RefundStatus;
  created_at: string;
}

export interface MonthlyRevenue {
  month: string; // e.g. "2026-01"
  revenue: number;
}

export interface OverviewData {
  stats: OverviewStats;
  recentVerifications: RecentVerification[];
  recentPayouts: RecentPayout[];
  recentRefunds: RecentRefund[];
  monthlyRevenue: MonthlyRevenue[];
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface SystemUser {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface GetUsersResult extends SystemActionResult {
  users: SystemUser[];
}

// ─── Organizer Verify ────────────────────────────────────────────────────────

export interface OrganizerVerifyItem {
  user_id: string;
  name: string;
  email: string;
  nic_number: string;
  address: string;
  bank_name: string;
  bank_branch: string;
  account_holder_name: string;
  account_number: string;
  nic_front_image_url: string;
  nic_back_image_url: string;
  status: OrganizerStatus;
  is_submitted: boolean;
  remarks: string | null;
  created_at: string;
}

export interface GetOrganizersResult extends SystemActionResult {
  organizers: OrganizerVerifyItem[];
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface SystemCategory {
  category_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GetCategoriesResult extends SystemActionResult {
  categories: SystemCategory[];
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface SystemEvent {
  event_id: string;
  name: string;
  organizer_name: string;
  status: EventStatus;
  start_at: string;
  is_active: boolean;
  is_vip: boolean;
}

export interface GetEventsResult extends SystemActionResult {
  events: SystemEvent[];
}

// ─── Promotions ──────────────────────────────────────────────────────────────

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface SystemPromotion {
  promotion_id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  is_active: boolean;
  usage_limit_global: number;
  current_global_usage: number;
  start_at: string;
  end_at: string;
  scope_event_id: string | null;
  created_at: string;
}

export interface GetPromotionsResult extends SystemActionResult {
  promotions: SystemPromotion[];
}

// ─── Payouts ─────────────────────────────────────────────────────────────────

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface SystemPayout {
  payout_id: string;
  event_id: string;
  event_name: string;
  organizer_name: string;
  gross_revenue: number;
  platform_fee_amount: number;
  net_payout_amount: number;
  status: PayoutStatus;
  bank_transfer_ref: string | null;
  remarks: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface GetPayoutsResult extends SystemActionResult {
  payouts: SystemPayout[];
}

// ─── Refunds ─────────────────────────────────────────────────────────────────

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

export interface SystemRefund {
  refund_id: string;
  order_id: string;
  user_name: string;
  refund_amount: number;
  reason: string;
  status: RefundStatus;
  admin_note: string | null;
  gateway_refund_ref: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface GetRefundsResult extends SystemActionResult {
  refunds: SystemRefund[];
}
