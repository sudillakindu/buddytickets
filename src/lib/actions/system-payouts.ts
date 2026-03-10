// lib/actions/system-payouts.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemPayoutRow,
  SystemActionResult,
  SystemListResult,
  PayoutStatus,
} from "@/lib/types/system";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session?.sub || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getSystemPayouts(
  statusFilter: "ALL" | PayoutStatus = "ALL",
  page: number = 1,
  pageSize: number = 10,
): Promise<SystemListResult<SystemPayoutRow>> {
  try {
    const userId = await requireSystem();
    if (!userId) {
      return { success: false, message: "Unauthorized.", data: [], total: 0 };
    }

    const db = getSupabaseAdmin();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = db
      .from("payouts")
      .select(
        "payout_id, event_id, organizer_id, gross_revenue, platform_fee_amount, net_payout_amount, status, bank_transfer_ref, processed_at, remarks, created_at, organizer:users!payouts_organizer_id_fkey(name, email), event:events!payouts_event_id_fkey(name)",
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
        fn: "getSystemPayouts",
        message: "Failed to fetch payouts",
        meta: error.message,
      });
      return { success: false, message: "Failed to fetch payouts.", data: [], total: 0 };
    }

    const rows: SystemPayoutRow[] = (data ?? []).map((p) => ({
      ...p,
      organizer: Array.isArray(p.organizer) ? p.organizer[0] : p.organizer,
      event: Array.isArray(p.event) ? p.event[0] : p.event,
    }));

    return {
      success: true,
      message: "Payouts loaded.",
      data: rows,
      total: count ?? 0,
    };
  } catch (err) {
    logger.error({
      fn: "getSystemPayouts",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error.", data: [], total: 0 };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function updatePayoutStatus(
  payoutId: string,
  status: PayoutStatus,
  bankTransferRef?: string,
  remarks?: string,
): Promise<SystemActionResult> {
  try {
    const adminId = await requireSystem();
    if (!adminId) {
      return { success: false, message: "Unauthorized." };
    }

    const db = getSupabaseAdmin();
    const updateData: Record<string, unknown> = {
      status,
      processed_by: adminId,
      processed_at: new Date().toISOString(),
    };

    if (bankTransferRef !== undefined) {
      updateData.bank_transfer_ref = bankTransferRef;
    }
    if (remarks !== undefined) {
      updateData.remarks = remarks;
    }

    const { error } = await db
      .from("payouts")
      .update(updateData)
      .eq("payout_id", payoutId);

    if (error) {
      logger.error({
        fn: "updatePayoutStatus",
        message: "Failed to update payout",
        meta: error.message,
      });
      return { success: false, message: "Failed to update payout." };
    }

    return { success: true, message: `Payout marked as ${status}.` };
  } catch (err) {
    logger.error({
      fn: "updatePayoutStatus",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error." };
  }
}
