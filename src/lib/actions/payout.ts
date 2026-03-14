"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type {
  Payout,
  PayoutInsert,
  PayoutResult,
  PayoutListResult,
} from "@/lib/types/payout";

const PAYOUT_SELECT = `
  payout_id, event_id, organizer_id, gross_revenue, platform_fee_amount,
  net_payout_amount, status, bank_transfer_ref, processed_by,
  processed_at, remarks, created_at, updated_at
` as const;

// --- Create a new payout record ---
export async function createPayout(
  input: PayoutInsert,
): Promise<PayoutResult> {
  try {
    if (!input.event_id || !input.organizer_id) {
      return { success: false, message: "Event and organizer IDs are required." };
    }

    if (
      input.gross_revenue < 0 ||
      input.platform_fee_amount < 0 ||
      input.net_payout_amount < 0
    ) {
      return { success: false, message: "Payout amounts must not be negative." };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("payouts")
      .insert({
        event_id: input.event_id,
        organizer_id: input.organizer_id,
        gross_revenue: input.gross_revenue,
        platform_fee_amount: input.platform_fee_amount,
        net_payout_amount: input.net_payout_amount,
        remarks: input.remarks ?? null,
      })
      .select(PAYOUT_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "A payout already exists for this event." };
      }
      throw error;
    }

    return {
      success: true,
      message: "Payout created.",
      payout: data as Payout,
    };
  } catch (err) {
    logger.error({
      fn: "createPayout",
      message: "Error creating payout",
      meta: err,
    });
    return { success: false, message: "Failed to create payout." };
  }
}

// --- Get payouts for an organizer ---
export async function getPayoutsByOrganizer(
  organizerId: string,
): Promise<PayoutListResult> {
  try {
    if (!organizerId) {
      return { success: false, message: "Organizer ID is required." };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("payouts")
      .select(PAYOUT_SELECT)
      .eq("organizer_id", organizerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "Payouts loaded.",
      payouts: (data ?? []) as Payout[],
    };
  } catch (err) {
    logger.error({
      fn: "getPayoutsByOrganizer",
      message: "Error fetching payouts",
      meta: err,
    });
    return { success: false, message: "Failed to load payouts." };
  }
}

// --- Get a single payout by event ---
export async function getPayoutByEvent(
  eventId: string,
): Promise<PayoutResult> {
  try {
    if (!eventId) {
      return { success: false, message: "Event ID is required." };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("payouts")
      .select(PAYOUT_SELECT)
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, message: "No payout found for this event." };

    return {
      success: true,
      message: "Payout loaded.",
      payout: data as Payout,
    };
  } catch (err) {
    logger.error({
      fn: "getPayoutByEvent",
      message: "Error fetching payout",
      meta: err,
    });
    return { success: false, message: "Failed to load payout." };
  }
}
