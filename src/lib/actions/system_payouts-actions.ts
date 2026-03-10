// lib/actions/system_payouts-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  PaginatedResult,
  ActionResult,
  SystemPayout,
  PayoutStatus,
} from "@/lib/types/system";

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getPayouts(
  statusFilter?: PayoutStatus,
  page: number = 1,
  perPage: number = 20,
): Promise<PaginatedResult<SystemPayout>> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = await createClient();

    let query = supabase
      .from("payouts")
      .select(
        "*, users:organizer_id(name), events:event_id(name)",
        { count: "exact" },
      );

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getPayouts",
        message: "DB fetch error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load payouts." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payouts: SystemPayout[] = (data ?? []).map((row: any) => ({
      payout_id: row.payout_id,
      event_id: row.event_id,
      organizer_id: row.organizer_id,
      gross_revenue: row.gross_revenue,
      platform_fee_amount: row.platform_fee_amount,
      net_payout_amount: row.net_payout_amount,
      status: row.status,
      bank_transfer_ref: row.bank_transfer_ref,
      processed_by: row.processed_by,
      processed_at: row.processed_at,
      remarks: row.remarks,
      created_at: row.created_at,
      updated_at: row.updated_at,
      organizer_name: row.users?.name ?? "Unknown",
      event_name: row.events?.name ?? "Unknown",
    }));

    return {
      success: true,
      message: "Payouts loaded.",
      data: payouts,
      total_count: count ?? 0,
      page,
      per_page: perPage,
    };
  } catch (err) {
    logger.error({
      fn: "getPayouts",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function markPayoutProcessing(
  payoutId: string,
  bankTransferRef: string,
): Promise<ActionResult> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!bankTransferRef.trim()) {
      return {
        success: false,
        message: "Bank transfer reference is required.",
      };
    }

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("payouts")
      .update({
        status: "PROCESSING",
        bank_transfer_ref: bankTransferRef.trim(),
      })
      .eq("payout_id", payoutId);

    if (error) {
      logger.error({
        fn: "markPayoutProcessing",
        message: "DB update error",
        meta: error.message,
      });
      return { success: false, message: "Failed to update payout status." };
    }

    return { success: true, message: "Payout marked as processing." };
  } catch (err) {
    logger.error({
      fn: "markPayoutProcessing",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function markPayoutCompleted(
  payoutId: string,
): Promise<ActionResult> {
  try {
    const currentUserId = await requireSystem();
    if (!currentUserId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("payouts")
      .update({
        status: "COMPLETED",
        processed_by: currentUserId,
        processed_at: new Date().toISOString(),
      })
      .eq("payout_id", payoutId);

    if (error) {
      logger.error({
        fn: "markPayoutCompleted",
        message: "DB update error",
        meta: error.message,
      });
      return { success: false, message: "Failed to mark payout completed." };
    }

    return { success: true, message: "Payout marked as completed." };
  } catch (err) {
    logger.error({
      fn: "markPayoutCompleted",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function markPayoutFailed(
  payoutId: string,
  remarks: string,
): Promise<ActionResult> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!remarks.trim()) {
      return {
        success: false,
        message: "Remarks are required when marking a payout as failed.",
      };
    }

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("payouts")
      .update({
        status: "FAILED",
        remarks: remarks.trim(),
      })
      .eq("payout_id", payoutId);

    if (error) {
      logger.error({
        fn: "markPayoutFailed",
        message: "DB update error",
        meta: error.message,
      });
      return { success: false, message: "Failed to update payout status." };
    }

    return { success: true, message: "Payout marked as failed." };
  } catch (err) {
    logger.error({
      fn: "markPayoutFailed",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}
