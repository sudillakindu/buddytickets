"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  Payout,
  PayoutResult,
  PayoutListResult,
} from "@/lib/types/payout";

interface PayoutWithEventRow {
  payout_id: string;
  event_id: string;
  organizer_id: string;
  gross_revenue: number;
  platform_fee_amount: number;
  net_payout_amount: number;
  status: Payout["status"];
  bank_transfer_ref: string | null;
  processed_at: string | null;
  remarks: string | null;
  created_at: string;
  events: { name: string } | null;
}

// --- Get Organizer Payouts ---
export async function getOrganizerPayouts(): Promise<PayoutListResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("payouts")
      .select(
        `payout_id, event_id, organizer_id, gross_revenue, platform_fee_amount, net_payout_amount, status, bank_transfer_ref, processed_by, processed_at, remarks, created_at, updated_at,
        events ( name )`,
      )
      .eq("organizer_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const payouts = (data ?? []).map((row) => {
      const typed = row as unknown as PayoutWithEventRow & {
        processed_by: string | null;
        updated_at: string | null;
      };
      return {
        payout_id: typed.payout_id,
        event_id: typed.event_id,
        organizer_id: typed.organizer_id,
        gross_revenue: Number(typed.gross_revenue),
        platform_fee_amount: Number(typed.platform_fee_amount),
        net_payout_amount: Number(typed.net_payout_amount),
        status: typed.status,
        bank_transfer_ref: typed.bank_transfer_ref,
        processed_by: typed.processed_by,
        processed_at: typed.processed_at,
        remarks: typed.remarks,
        created_at: typed.created_at,
        updated_at: typed.updated_at,
      } satisfies Payout;
    });

    return { success: true, message: "Payouts loaded.", payouts };
  } catch (err) {
    logger.error({ fn: "getOrganizerPayouts", message: "Error", meta: err });
    return { success: false, message: "Failed to load payouts." };
  }
}

// --- Get Payout By ID ---
export async function getPayoutById(
  payoutId: string,
): Promise<PayoutResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!payoutId) return { success: false, message: "Payout ID required." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("payouts")
      .select(
        `payout_id, event_id, organizer_id, gross_revenue, platform_fee_amount, net_payout_amount, status, bank_transfer_ref, processed_by, processed_at, remarks, created_at, updated_at,
        events ( name )`,
      )
      .eq("payout_id", payoutId)
      .eq("organizer_id", session.sub)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, message: "Payout not found." };

    const typed = data as unknown as PayoutWithEventRow & {
      processed_by: string | null;
      updated_at: string | null;
    };

    return {
      success: true,
      message: "Payout loaded.",
      payout: {
        payout_id: typed.payout_id,
        event_id: typed.event_id,
        organizer_id: typed.organizer_id,
        gross_revenue: Number(typed.gross_revenue),
        platform_fee_amount: Number(typed.platform_fee_amount),
        net_payout_amount: Number(typed.net_payout_amount),
        status: typed.status,
        bank_transfer_ref: typed.bank_transfer_ref,
        processed_by: typed.processed_by,
        processed_at: typed.processed_at,
        remarks: typed.remarks,
        created_at: typed.created_at,
        updated_at: typed.updated_at,
      },
    };
  } catch (err) {
    logger.error({ fn: "getPayoutById", message: "Error", meta: err });
    return { success: false, message: "Failed to load payout." };
  }
}
