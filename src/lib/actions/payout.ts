"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  Payout,
  PayoutListResult,
  PayoutActionResult,
} from "@/lib/types/payout";
import type { DiscountType } from "@/lib/types/checkout";

// --- Row shapes returned by Supabase ---
interface PayoutRow {
  payout_id: string;
  event_id: string;
  organizer_id: string;
  gross_revenue: number;
  platform_fee_amount: number;
  net_payout_amount: number;
  status: Payout["status"];
  bank_transfer_ref: string | null;
  processed_by: string | null;
  processed_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string | null;
}

interface EventFeeRow {
  event_id: string;
  organizer_id: string;
  platform_fee_type: DiscountType;
  platform_fee_value: number;
  platform_fee_cap: number | null;
}

function mapRowToPayout(row: PayoutRow): Payout {
  return {
    payout_id: row.payout_id,
    event_id: row.event_id,
    organizer_id: row.organizer_id,
    gross_revenue: Number(row.gross_revenue),
    platform_fee_amount: Number(row.platform_fee_amount),
    net_payout_amount: Number(row.net_payout_amount),
    status: row.status,
    bank_transfer_ref: row.bank_transfer_ref,
    processed_by: row.processed_by,
    processed_at: row.processed_at,
    remarks: row.remarks,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// --- Get payouts for the authenticated organizer ---
export async function getOrganizerPayouts(): Promise<PayoutListResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await getSupabaseAdmin()
      .from("payouts")
      .select(
        "payout_id, event_id, organizer_id, gross_revenue, platform_fee_amount, net_payout_amount, status, bank_transfer_ref, processed_by, processed_at, remarks, created_at, updated_at",
      )
      .eq("organizer_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const payouts = ((data ?? []) as PayoutRow[]).map(mapRowToPayout);
    return { success: true, message: "Payouts loaded.", payouts };
  } catch (err) {
    logger.error({
      fn: "getOrganizerPayouts",
      message: "Error fetching payouts",
      meta: err,
    });
    return { success: false, message: "Failed to load payouts." };
  }
}

// --- Calculate and create a payout for a completed event ---
export async function createEventPayout(
  eventId: string,
): Promise<PayoutActionResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };
    if (!eventId) return { success: false, message: "Event ID is required." };

    // Fetch event with platform fee config
    const { data: event, error: eventErr } = await getSupabaseAdmin()
      .from("events")
      .select(
        "event_id, organizer_id, platform_fee_type, platform_fee_value, platform_fee_cap",
      )
      .eq("event_id", eventId)
      .maybeSingle<EventFeeRow>();

    if (eventErr) throw eventErr;
    if (!event) return { success: false, message: "Event not found." };

    // Only organizer or system can trigger payout
    if (session.role !== "SYSTEM" && event.organizer_id !== session.sub)
      return { success: false, message: "Not authorized for this event." };

    // Check if payout already exists (uq_payout_event constraint)
    const { data: existing, error: existErr } = await getSupabaseAdmin()
      .from("payouts")
      .select("payout_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existErr) throw existErr;
    if (existing)
      return { success: false, message: "Payout already exists for this event." };

    // Calculate gross revenue from PAID orders
    const { data: orders, error: ordersErr } = await getSupabaseAdmin()
      .from("orders")
      .select("final_amount")
      .eq("event_id", eventId)
      .eq("payment_status", "PAID");

    if (ordersErr) throw ordersErr;

    const grossRevenue = (orders ?? []).reduce(
      (sum, o) => sum + Number(o.final_amount),
      0,
    );

    // Calculate platform fee based on event fee configuration
    let platformFeeAmount: number;
    if (event.platform_fee_type === "PERCENTAGE") {
      platformFeeAmount =
        grossRevenue * (Number(event.platform_fee_value) / 100);
      if (event.platform_fee_cap !== null)
        platformFeeAmount = Math.min(
          platformFeeAmount,
          Number(event.platform_fee_cap),
        );
    } else {
      platformFeeAmount = Number(event.platform_fee_value);
    }
    platformFeeAmount = Math.round(platformFeeAmount * 100) / 100;

    const netPayoutAmount =
      Math.round((grossRevenue - platformFeeAmount) * 100) / 100;

    // Insert payout record
    const { data: payout, error: insertErr } = await getSupabaseAdmin()
      .from("payouts")
      .insert({
        event_id: eventId,
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
      message: "Payout created successfully.",
      payout: mapRowToPayout(payout as PayoutRow),
    };
  } catch (err) {
    logger.error({
      fn: "createEventPayout",
      message: "Error creating payout",
      meta: err,
    });
    return { success: false, message: "Failed to create payout." };
  }
}
