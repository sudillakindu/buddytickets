// lib/actions/system-payouts.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemActionResult,
  SystemPayout,
  GetPayoutsResult,
  PayoutStatus,
} from "@/lib/types/system";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Get Payouts ─────────────────────────────────────────────────────────────

export async function getPayouts(
  statusFilter?: PayoutStatus,
): Promise<GetPayoutsResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized", payouts: [] };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("payouts")
      .select(
        `payout_id, event_id, gross_revenue, platform_fee_amount, net_payout_amount,
         status, bank_transfer_ref, remarks, processed_at, created_at,
         events!inner ( name ), users!payouts_organizer_id_fkey ( name )`,
      )
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ fn: "getPayouts", message: error.message });
      return { success: false, message: "Failed to fetch payouts", payouts: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payouts: SystemPayout[] = (data ?? []).map((row: any) => ({
      payout_id: row.payout_id,
      event_id: row.event_id,
      event_name: row.events?.name ?? "",
      organizer_name: row.users?.name ?? "",
      gross_revenue: row.gross_revenue,
      platform_fee_amount: row.platform_fee_amount,
      net_payout_amount: row.net_payout_amount,
      status: row.status,
      bank_transfer_ref: row.bank_transfer_ref,
      remarks: row.remarks,
      processed_at: row.processed_at,
      created_at: row.created_at,
    }));

    return { success: true, message: "Payouts fetched", payouts };
  } catch (err) {
    logger.error({ fn: "getPayouts", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error", payouts: [] };
  }
}

// ─── Process Payout (PENDING → PROCESSING) ──────────────────────────────────

export async function processPayout(
  payoutId: string,
  bankTransferRef: string,
): Promise<SystemActionResult> {
  const adminUserId = await requireSystem();
  if (!adminUserId) {
    return { success: false, message: "Unauthorized" };
  }

  if (!bankTransferRef.trim()) {
    return { success: false, message: "Bank transfer reference is required" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("payouts")
      .update({
        status: "PROCESSING",
        bank_transfer_ref: bankTransferRef.trim(),
        processed_by: adminUserId,
        processed_at: new Date().toISOString(),
      })
      .eq("payout_id", payoutId)
      .eq("status", "PENDING");

    if (error) {
      logger.error({ fn: "processPayout", message: error.message });
      return { success: false, message: "Failed to process payout" };
    }

    return { success: true, message: "Payout moved to PROCESSING" };
  } catch (err) {
    logger.error({ fn: "processPayout", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Complete Payout (PROCESSING → COMPLETED) ───────────────────────────────

export async function completePayout(
  payoutId: string,
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("payouts")
      .update({ status: "COMPLETED" })
      .eq("payout_id", payoutId)
      .eq("status", "PROCESSING");

    if (error) {
      logger.error({ fn: "completePayout", message: error.message });
      return { success: false, message: "Failed to complete payout" };
    }

    return { success: true, message: "Payout completed" };
  } catch (err) {
    logger.error({ fn: "completePayout", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Fail Payout ─────────────────────────────────────────────────────────────

export async function failPayout(
  payoutId: string,
  remarks: string,
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  if (!remarks.trim()) {
    return { success: false, message: "Remarks are required" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("payouts")
      .update({
        status: "FAILED",
        remarks: remarks.trim(),
      })
      .eq("payout_id", payoutId);

    if (error) {
      logger.error({ fn: "failPayout", message: error.message });
      return { success: false, message: "Failed to update payout" };
    }

    return { success: true, message: "Payout marked as FAILED" };
  } catch (err) {
    logger.error({ fn: "failPayout", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}
