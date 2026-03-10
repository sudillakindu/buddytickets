// lib/actions/system-refunds.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemRefundRow,
  SystemActionResult,
  SystemListResult,
  RefundStatus,
} from "@/lib/types/system";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session?.sub || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getSystemRefunds(
  statusFilter: "ALL" | RefundStatus = "ALL",
  page: number = 1,
  pageSize: number = 10,
): Promise<SystemListResult<SystemRefundRow>> {
  try {
    const userId = await requireSystem();
    if (!userId) {
      return { success: false, message: "Unauthorized.", data: [], total: 0 };
    }

    const db = getSupabaseAdmin();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = db
      .from("refund_requests")
      .select(
        "refund_id, order_id, ticket_id, user_id, reason, refund_amount, status, admin_note, gateway_refund_ref, reviewed_at, created_at, user:users!refund_requests_user_id_fkey(name, email), order:orders!refund_requests_order_id_fkey(event_id, payment_source)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (statusFilter !== "ALL") {
      query = query.eq("status", statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getSystemRefunds",
        message: "Failed to fetch refunds",
        meta: error.message,
      });
      return { success: false, message: "Failed to fetch refunds.", data: [], total: 0 };
    }

    const rows: SystemRefundRow[] = (data ?? []).map((r) => ({
      ...r,
      user: Array.isArray(r.user) ? r.user[0] : r.user,
      order: Array.isArray(r.order) ? r.order[0] : r.order,
    }));

    return {
      success: true,
      message: "Refunds loaded.",
      data: rows,
      total: count ?? 0,
    };
  } catch (err) {
    logger.error({
      fn: "getSystemRefunds",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error.", data: [], total: 0 };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function reviewRefund(
  refundId: string,
  action: "APPROVED" | "REJECTED",
  adminNote: string,
): Promise<SystemActionResult> {
  try {
    const adminId = await requireSystem();
    if (!adminId) {
      return { success: false, message: "Unauthorized." };
    }

    if (!adminNote.trim()) {
      return { success: false, message: "Admin note is required." };
    }

    const db = getSupabaseAdmin();
    const { error } = await db
      .from("refund_requests")
      .update({
        status: action,
        admin_note: adminNote.trim(),
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("refund_id", refundId)
      .eq("status", "PENDING");

    if (error) {
      logger.error({
        fn: "reviewRefund",
        message: "Failed to review refund",
        meta: error.message,
      });
      return { success: false, message: "Failed to review refund." };
    }

    return {
      success: true,
      message: action === "APPROVED" ? "Refund approved." : "Refund rejected.",
    };
  } catch (err) {
    logger.error({
      fn: "reviewRefund",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error." };
  }
}
