"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  Payout,
  CalculatePayoutInput,
  CalculatePayoutResult,
  ProcessPayoutInput,
  ProcessPayoutResult,
  GetPayoutsResult,
} from "@/lib/types/payout";

// --- Calculate and create payout for a completed event ---

export async function calculatePayout(
  input: CalculatePayoutInput,
): Promise<CalculatePayoutResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  const { event_id } = input;
  if (!event_id)
    return { success: false, message: "Event ID is required." };

  try {
    // --- Fetch event details with platform fee config ---
    const { data: event, error: eventErr } = await getSupabaseAdmin()
      .from("events")
      .select(
        "event_id, organizer_id, status, platform_fee_type, platform_fee_value, platform_fee_cap",
      )
      .eq("event_id", event_id)
      .maybeSingle();

    if (eventErr) throw eventErr;
    if (!event)
      return { success: false, message: "Event not found." };
    if (event.status !== "COMPLETED")
      return { success: false, message: "Payout can only be calculated for completed events." };

    // --- Check for existing payout (one per event) ---
    const { data: existing, error: existErr } = await getSupabaseAdmin()
      .from("payouts")
      .select("payout_id")
      .eq("event_id", event_id)
      .maybeSingle();

    if (existErr) throw existErr;
    if (existing)
      return { success: false, message: "A payout record already exists for this event." };

    // --- Calculate gross revenue from paid orders ---
    const { data: orders, error: ordersErr } = await getSupabaseAdmin()
      .from("orders")
      .select("final_amount")
      .eq("event_id", event_id)
      .eq("payment_status", "PAID");

    if (ordersErr) throw ordersErr;

    const grossRevenue = (orders ?? []).reduce(
      (sum, order) => sum + Number(order.final_amount),
      0,
    );

    // --- Calculate platform fee based on event config ---
    let platformFeeAmount: number;
    const feeType = event.platform_fee_type;
    const feeValue = Number(event.platform_fee_value);
    const feeCap = event.platform_fee_cap !== null ? Number(event.platform_fee_cap) : null;

    if (feeType === "PERCENTAGE") {
      platformFeeAmount = grossRevenue * (feeValue / 100);
      if (feeCap !== null) {
        platformFeeAmount = Math.min(platformFeeAmount, feeCap);
      }
    } else if (feeType === "FIXED_AMOUNT") {
      platformFeeAmount = Math.min(feeValue, grossRevenue);
    } else {
      platformFeeAmount = 0;
    }
    platformFeeAmount = Math.round(platformFeeAmount * 100) / 100;

    const netPayoutAmount = Math.round((grossRevenue - platformFeeAmount) * 100) / 100;

    // --- Insert payout record ---
    const { data: payout, error: insertErr } = await getSupabaseAdmin()
      .from("payouts")
      .insert({
        event_id,
        organizer_id: event.organizer_id,
        gross_revenue: grossRevenue,
        platform_fee_amount: platformFeeAmount,
        net_payout_amount: netPayoutAmount,
        status: "PENDING",
      })
      .select(
        "payout_id, event_id, organizer_id, gross_revenue, platform_fee_amount, net_payout_amount, status, bank_transfer_ref, processed_by, processed_at, remarks, created_at, updated_at",
      )
      .single();

    if (insertErr) throw insertErr;

    return {
      success: true,
      message: "Payout calculated successfully.",
      payout: payout as Payout,
    };
  } catch (err) {
    logger.error({
      fn: "calculatePayout",
      message: "Error calculating payout",
      meta: err,
    });
    return { success: false, message: "Failed to calculate payout." };
  }
}

// --- Process (mark as completed) a pending payout ---

export async function processPayout(
  input: ProcessPayoutInput,
): Promise<ProcessPayoutResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  const { payout_id, bank_transfer_ref, remarks } = input;
  if (!payout_id || !bank_transfer_ref?.trim())
    return { success: false, message: "Payout ID and bank transfer reference are required." };

  try {
    const { data: payout, error: fetchErr } = await getSupabaseAdmin()
      .from("payouts")
      .select("payout_id, status")
      .eq("payout_id", payout_id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!payout)
      return { success: false, message: "Payout not found." };
    if (payout.status !== "PENDING" && payout.status !== "PROCESSING")
      return { success: false, message: "This payout has already been processed." };

    const { error: updateErr } = await getSupabaseAdmin()
      .from("payouts")
      .update({
        status: "COMPLETED",
        bank_transfer_ref: bank_transfer_ref.trim(),
        processed_by: session.sub,
        processed_at: new Date().toISOString(),
        remarks: remarks?.trim() ?? null,
      })
      .eq("payout_id", payout_id);

    if (updateErr) throw updateErr;

    return { success: true, message: "Payout processed successfully." };
  } catch (err) {
    logger.error({
      fn: "processPayout",
      message: "Error processing payout",
      meta: err,
    });
    return { success: false, message: "Failed to process payout." };
  }
}

// --- Get payouts for the current organizer ---

export async function getOrganizerPayouts(): Promise<GetPayoutsResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("payouts")
      .select(
        "payout_id, event_id, organizer_id, gross_revenue, platform_fee_amount, net_payout_amount, status, bank_transfer_ref, processed_by, processed_at, remarks, created_at, updated_at",
      )
      .eq("organizer_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "Payouts loaded.",
      payouts: (data ?? []) as Payout[],
    };
  } catch (err) {
    logger.error({
      fn: "getOrganizerPayouts",
      message: "Error fetching payouts",
      meta: err,
    });
    return { success: false, message: "Failed to load payouts." };
  }
}
