// lib/actions/system-dashboard.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type { SystemStatsResult } from "@/lib/types/system";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session?.sub || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Platform Analytics ──────────────────────────────────────────────────────

export async function getPlatformStats(): Promise<SystemStatsResult> {
  try {
    const userId = await requireSystem();
    if (!userId) {
      return { success: false, message: "Unauthorized.", stats: null };
    }

    const db = getSupabaseAdmin();

    const [
      eventsRes,
      ticketsRes,
      revenueRes,
      organizersRes,
      activeEventsRes,
      usersRes,
      pendingOrgRes,
      pendingRefundsRes,
    ] = await Promise.all([
      // Total events (all statuses)
      db.from("events").select("event_id", { count: "exact", head: true }),
      // Total tickets sold (ACTIVE or USED)
      db
        .from("tickets")
        .select("ticket_id", { count: "exact", head: true })
        .in("status", ["ACTIVE", "USED"]),
      // Total revenue from paid orders
      db
        .from("orders")
        .select("final_amount")
        .eq("payment_status", "PAID"),
      // Active organizers (role=ORGANIZER, is_active=true)
      db
        .from("users")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "ORGANIZER")
        .eq("is_active", true),
      // Active events (ON_SALE or ONGOING)
      db
        .from("events")
        .select("event_id", { count: "exact", head: true })
        .in("status", ["ON_SALE", "ONGOING"]),
      // Total users
      db.from("users").select("user_id", { count: "exact", head: true }),
      // Pending organizer verifications
      db
        .from("organizer_details")
        .select("user_id", { count: "exact", head: true })
        .eq("status", "PENDING")
        .eq("is_submitted", true),
      // Pending refund requests
      db
        .from("refund_requests")
        .select("refund_id", { count: "exact", head: true })
        .eq("status", "PENDING"),
    ]);

    const totalRevenue = (revenueRes.data ?? []).reduce(
      (sum: number, row: { final_amount: number }) => sum + Number(row.final_amount),
      0,
    );

    return {
      success: true,
      message: "Platform stats loaded.",
      stats: {
        total_events: eventsRes.count ?? 0,
        total_tickets_sold: ticketsRes.count ?? 0,
        total_revenue: totalRevenue,
        active_organizers: organizersRes.count ?? 0,
        active_events: activeEventsRes.count ?? 0,
        total_users: usersRes.count ?? 0,
        pending_organizers: pendingOrgRes.count ?? 0,
        pending_refunds: pendingRefundsRes.count ?? 0,
      },
    };
  } catch (err) {
    logger.error({
      fn: "getPlatformStats",
      message: "Failed to load platform stats",
      meta: err,
    });
    return { success: false, message: "Failed to load platform stats.", stats: null };
  }
}
