// lib/actions/organizer_payouts-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ActionResultWithData,
  OrganizerPayout,
} from "@/lib/types/organizer_dashboard";

async function requireOrganizer(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session.sub;
}

export async function getPayouts(): Promise<
  ActionResultWithData<OrganizerPayout[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("payouts")
      .select(
        "payout_id, event_id, gross_revenue, platform_fee_amount, net_payout_amount, status, bank_transfer_ref, processed_at, remarks, created_at",
      )
      .eq("organizer_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({ fn: "getPayouts", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load payouts." };
    }

    // Get event names
    const eventIds = [...new Set((data ?? []).map((p) => p.event_id))];
    let eventMap = new Map<string, string>();
    if (eventIds.length > 0) {
      const { data: events } = await supabase
        .from("events")
        .select("event_id, name")
        .in("event_id", eventIds);
      eventMap = new Map((events ?? []).map((e) => [e.event_id, e.name]));
    }

    const result: OrganizerPayout[] = (data ?? []).map((p) => ({
      payout_id: p.payout_id,
      event_id: p.event_id,
      event_name: eventMap.get(p.event_id) ?? "Unknown",
      gross_revenue: Number(p.gross_revenue),
      platform_fee_amount: Number(p.platform_fee_amount),
      net_payout_amount: Number(p.net_payout_amount),
      status: p.status,
      bank_transfer_ref: p.bank_transfer_ref,
      processed_at: p.processed_at,
      remarks: p.remarks,
      created_at: p.created_at,
    }));

    return { success: true, message: "Payouts loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getPayouts", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}
