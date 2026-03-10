// lib/types/system.ts
// Types for the System Owner dashboard — mirrors DB schema tables exactly.

import type { EventStatus } from "./event";
import type { PaymentSource, PaymentStatus } from "./payment";

// ─── Platform Analytics ──────────────────────────────────────────────────────

export interface PlatformStats {
  total_events: number;
  total_tickets_sold: number;
  total_revenue: number;
  active_organizers: number;
  active_events: number;
  total_users: number;
  pending_organizers: number;
  pending_refunds: number;
}

// ─── Organizer Management ────────────────────────────────────────────────────

export type OrganizerVerifyStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SystemOrganizerRow {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  is_active: boolean;
  created_at: string;
  organizer_details: {
    nic_number: string;
    address: string;
    bank_name: string;
    bank_branch: string;
    account_holder_name: string;
    account_number: string;
    nic_front_image_url: string;
    nic_back_image_url: string;
    remarks: string | null;
    status: OrganizerVerifyStatus;
    is_submitted: boolean;
    verified_at: string | null;
    created_at: string;
  } | null;
}

export interface OrganizerActionResult {
  success: boolean;
  message: string;
}

// ─── Event Monitoring ────────────────────────────────────────────────────────

export interface SystemEventRow {
  event_id: string;
  name: string;
  subtitle: string;
  location: string;
  start_at: string;
  end_at: string;
  status: EventStatus;
  is_active: boolean;
  created_at: string;
  organizer: {
    user_id: string;
    name: string;
    email: string;
  };
  category: {
    name: string;
  };
}

// ─── User Monitoring ─────────────────────────────────────────────────────────

export type UserRole = "SYSTEM" | "ORGANIZER" | "STAFF" | "USER";

export interface SystemUserRow {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
}

// ─── Payment / Transaction Monitoring ────────────────────────────────────────

export type TransactionStatus = "SUCCESS" | "FAILED";
export type GatewayType = "PAYMENT_GATEWAY" | "BANK_TRANSFER" | "ONGATE";

export interface SystemTransactionRow {
  transaction_id: string;
  order_id: string;
  gateway: GatewayType;
  gateway_ref_id: string | null;
  amount: number;
  status: TransactionStatus;
  created_at: string;
  order: {
    user_id: string;
    event_id: string;
    payment_source: PaymentSource;
    payment_status: PaymentStatus;
    final_amount: number;
  };
}

export interface SystemOrderRow {
  order_id: string;
  user_id: string;
  event_id: string;
  subtotal: number;
  discount_amount: number;
  final_amount: number;
  payment_source: PaymentSource;
  payment_status: PaymentStatus;
  created_at: string;
  user: { name: string; email: string };
  event: { name: string };
}

// ─── Payout Monitoring ───────────────────────────────────────────────────────

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface SystemPayoutRow {
  payout_id: string;
  event_id: string;
  organizer_id: string;
  gross_revenue: number;
  platform_fee_amount: number;
  net_payout_amount: number;
  status: PayoutStatus;
  bank_transfer_ref: string | null;
  processed_at: string | null;
  remarks: string | null;
  created_at: string;
  organizer: { name: string; email: string };
  event: { name: string };
}

// ─── Refund Monitoring ───────────────────────────────────────────────────────

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

export interface SystemRefundRow {
  refund_id: string;
  order_id: string;
  ticket_id: string | null;
  user_id: string;
  reason: string;
  refund_amount: number;
  status: RefundStatus;
  admin_note: string | null;
  gateway_refund_ref: string | null;
  reviewed_at: string | null;
  created_at: string;
  user: { name: string; email: string };
  order: { event_id: string; payment_source: PaymentSource };
}

// ─── Server Action Results ───────────────────────────────────────────────────

export interface SystemActionResult {
  success: boolean;
  message: string;
}

export interface SystemListResult<T> extends SystemActionResult {
  data: T[];
  total: number;
}

export interface SystemStatsResult extends SystemActionResult {
  stats: PlatformStats | null;
}
