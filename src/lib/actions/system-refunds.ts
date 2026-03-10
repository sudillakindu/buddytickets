// lib/actions/system-refunds.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemActionResult,
  SystemRefund,
  GetRefundsResult,
  RefundStatus,
} from "@/lib/types/system";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Get Refunds ─────────────────────────────────────────────────────────────

export async function getRefunds(
  statusFilter?: RefundStatus,
): Promise<GetRefundsResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized", refunds: [] };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("refund_requests")
      .select(
        `refund_id, order_id, refund_amount, reason, status, admin_note,
         gateway_refund_ref, reviewed_at, created_at,
         users!refund_requests_user_id_fkey ( name )`,
      )
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ fn: "getRefunds", message: error.message });
      return { success: false, message: "Failed to fetch refunds", refunds: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refunds: SystemRefund[] = (data ?? []).map((row: any) => ({
      refund_id: row.refund_id,
      order_id: row.order_id,
      user_name: row.users?.name ?? "",
      refund_amount: row.refund_amount,
      reason: row.reason,
      status: row.status,
      admin_note: row.admin_note,
      gateway_refund_ref: row.gateway_refund_ref,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
    }));

    return { success: true, message: "Refunds fetched", refunds };
  } catch (err) {
    logger.error({ fn: "getRefunds", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error", refunds: [] };
  }
}

// ─── Approve Refund ──────────────────────────────────────────────────────────

export async function approveRefund(
  refundId: string,
): Promise<SystemActionResult> {
  const adminUserId = await requireSystem();
  if (!adminUserId) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("refund_requests")
      .update({
        status: "APPROVED",
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("refund_id", refundId)
      .eq("status", "PENDING");

    if (error) {
      logger.error({ fn: "approveRefund", message: error.message });
      return { success: false, message: "Failed to approve refund" };
    }

    return { success: true, message: "Refund approved" };
  } catch (err) {
    logger.error({ fn: "approveRefund", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Reject Refund ───────────────────────────────────────────────────────────

export async function rejectRefund(
  refundId: string,
  adminNote: string,
): Promise<SystemActionResult> {
  const adminUserId = await requireSystem();
  if (!adminUserId) {
    return { success: false, message: "Unauthorized" };
  }

  if (!adminNote.trim()) {
    return { success: false, message: "Admin note is required for rejection" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("refund_requests")
      .update({
        status: "REJECTED",
        admin_note: adminNote.trim(),
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("refund_id", refundId)
      .eq("status", "PENDING");

    if (error) {
      logger.error({ fn: "rejectRefund", message: error.message });
      return { success: false, message: "Failed to reject refund" };
    }

    return { success: true, message: "Refund rejected" };
  } catch (err) {
    logger.error({ fn: "rejectRefund", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Mark Refunded ───────────────────────────────────────────────────────────

export async function markRefunded(
  refundId: string,
  gatewayRefundRef: string,
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  if (!gatewayRefundRef.trim()) {
    return { success: false, message: "Gateway refund reference is required" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("refund_requests")
      .update({
        status: "REFUNDED",
        gateway_refund_ref: gatewayRefundRef.trim(),
      })
      .eq("refund_id", refundId)
      .eq("status", "APPROVED");

    if (error) {
      logger.error({ fn: "markRefunded", message: error.message });
      return { success: false, message: "Failed to mark as refunded" };
    }

    return { success: true, message: "Refund marked as completed" };
  } catch (err) {
    logger.error({ fn: "markRefunded", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}
