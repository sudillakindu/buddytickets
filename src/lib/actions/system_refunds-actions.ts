// lib/actions/system_refunds-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  PaginatedResult,
  ActionResult,
  SystemRefund,
  RefundStatus,
} from "@/lib/types/system";

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getRefunds(
  statusFilter?: RefundStatus,
  page: number = 1,
  perPage: number = 20,
): Promise<PaginatedResult<SystemRefund>> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = await createClient();

    let query = supabase
      .from("refund_requests")
      .select(
        "*, users:user_id(name), orders:order_id(payment_source, final_amount, events:event_id(name))",
        { count: "exact" },
      );

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getRefunds",
        message: "DB fetch error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load refund requests." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refunds: SystemRefund[] = (data ?? []).map((row: any) => ({
      refund_id: row.refund_id,
      order_id: row.order_id,
      ticket_id: row.ticket_id,
      user_id: row.user_id,
      reason: row.reason,
      refund_amount: row.refund_amount,
      status: row.status,
      admin_note: row.admin_note,
      gateway_refund_ref: row.gateway_refund_ref,
      reviewed_by: row.reviewed_by,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: row.users?.name ?? "Unknown",
      event_name: row.orders?.events?.name ?? "Unknown",
      order_payment_source: row.orders?.payment_source ?? "PAYMENT_GATEWAY",
      order_final_amount: row.orders?.final_amount ?? 0,
    }));

    return {
      success: true,
      message: "Refund requests loaded.",
      data: refunds,
      total_count: count ?? 0,
      page,
      per_page: perPage,
    };
  } catch (err) {
    logger.error({
      fn: "getRefunds",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function approveRefund(
  refundId: string,
  gatewayRefundRef?: string,
): Promise<ActionResult> {
  try {
    const currentUserId = await requireSystem();
    if (!currentUserId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("refund_requests")
      .update({
        status: "APPROVED",
        reviewed_by: currentUserId,
        reviewed_at: new Date().toISOString(),
        gateway_refund_ref: gatewayRefundRef?.trim() || null,
      })
      .eq("refund_id", refundId);

    if (error) {
      logger.error({
        fn: "approveRefund",
        message: "DB update error",
        meta: error.message,
      });
      return { success: false, message: "Failed to approve refund." };
    }

    return { success: true, message: "Refund approved." };
  } catch (err) {
    logger.error({
      fn: "approveRefund",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function rejectRefund(
  refundId: string,
  adminNote: string,
): Promise<ActionResult> {
  try {
    const currentUserId = await requireSystem();
    if (!currentUserId) return { success: false, message: "Unauthorized." };

    if (!adminNote.trim()) {
      return {
        success: false,
        message: "Admin note is required when rejecting a refund.",
      };
    }

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("refund_requests")
      .update({
        status: "REJECTED",
        admin_note: adminNote.trim(),
        reviewed_by: currentUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("refund_id", refundId);

    if (error) {
      logger.error({
        fn: "rejectRefund",
        message: "DB update error",
        meta: error.message,
      });
      return { success: false, message: "Failed to reject refund." };
    }

    return { success: true, message: "Refund rejected." };
  } catch (err) {
    logger.error({
      fn: "rejectRefund",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}
