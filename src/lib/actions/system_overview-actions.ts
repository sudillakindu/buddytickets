// lib/actions/system_overview-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ActionResultWithData,
  OverviewStats,
  SystemOrder,
  ScanActivityStats,
} from "@/lib/types/system";

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getOverviewStats(): Promise<
  ActionResultWithData<OverviewStats>
> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    const [
      usersResult,
      organizersResult,
      verificationsResult,
      eventsResult,
      activeEventsResult,
      ordersResult,
      revenueResult,
      ticketsSoldResult,
      payoutsResult,
      refundsResult,
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "ORGANIZER"),
      supabase
        .from("organizer_details")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING"),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("final_amount")
        .eq("payment_status", "PAID"),
      supabase.from("ticket_types").select("qty_sold"),
      supabase
        .from("payouts")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING"),
      supabase
        .from("refund_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING"),
    ]);

    const totalRevenue = (revenueResult.data ?? []).reduce(
      (sum: number, row: { final_amount: number }) =>
        sum + (row.final_amount ?? 0),
      0,
    );

    const totalTicketsSold = (ticketsSoldResult.data ?? []).reduce(
      (sum: number, row: { qty_sold: number }) => sum + (row.qty_sold ?? 0),
      0,
    );

    const stats: OverviewStats = {
      total_users: usersResult.count ?? 0,
      total_organizers: organizersResult.count ?? 0,
      pending_verifications: verificationsResult.count ?? 0,
      total_events: eventsResult.count ?? 0,
      active_events: activeEventsResult.count ?? 0,
      total_orders: ordersResult.count ?? 0,
      total_revenue: totalRevenue,
      total_tickets_sold: totalTicketsSold,
      pending_payouts: payoutsResult.count ?? 0,
      pending_refunds: refundsResult.count ?? 0,
    };

    return { success: true, message: "Overview stats loaded.", data: stats };
  } catch (err) {
    logger.error({
      fn: "getOverviewStats",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Failed to load overview stats." };
  }
}

export async function getRecentOrders(): Promise<
  ActionResultWithData<SystemOrder[]>
> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select("*, users:user_id(name), events:event_id(name)")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      logger.error({
        fn: "getRecentOrders",
        message: "DB fetch error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load recent orders." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders: SystemOrder[] = (data ?? []).map((row: any) => ({
      order_id: row.order_id,
      user_id: row.user_id,
      event_id: row.event_id,
      promotion_id: row.promotion_id,
      subtotal: row.subtotal,
      discount_amount: row.discount_amount,
      final_amount: row.final_amount,
      payment_source: row.payment_source,
      payment_status: row.payment_status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: row.users?.name ?? "Unknown",
      event_name: row.events?.name ?? "Unknown",
    }));

    return { success: true, message: "Recent orders loaded.", data: orders };
  } catch (err) {
    logger.error({
      fn: "getRecentOrders",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Failed to load recent orders." };
  }
}

export async function getScanActivity(): Promise<
  ActionResultWithData<ScanActivityStats>
> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("scan_logs")
      .select(
        "*, users:scanned_by_user_id(name), tickets!inner(event_id, events:event_id(name))",
      )
      .gte("scanned_at", twentyFourHoursAgo)
      .order("scanned_at", { ascending: false });

    if (error) {
      logger.error({
        fn: "getScanActivity",
        message: "DB fetch error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load scan activity." };
    }

    const rows = data ?? [];
    const totalScans = rows.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allowed = rows.filter((r: any) => r.result === "ALLOWED").length;
    const denied = totalScans - allowed;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentScans = rows.slice(0, 20).map((r: any) => ({
      scan_id: r.scan_id,
      ticket_id: r.ticket_id,
      scanned_by_user_id: r.scanned_by_user_id,
      result: r.result,
      scanned_at: r.scanned_at,
      scanned_by_name: r.users?.name ?? "Unknown",
      event_name: r.tickets?.events?.name ?? "Unknown",
    }));

    const stats: ScanActivityStats = {
      total_scans: totalScans,
      allowed,
      denied,
      recent_scans: recentScans,
    };

    return { success: true, message: "Scan activity loaded.", data: stats };
  } catch (err) {
    logger.error({
      fn: "getScanActivity",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Failed to load scan activity." };
  }
}
