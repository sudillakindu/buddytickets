// lib/actions/organizer_analytics-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type { ActionResultWithData } from "@/lib/types/organizer_dashboard";

async function requireOrganizer(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session.sub;
}

// ─── Revenue Over Time ──────────────────────────────────────────────────────

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export async function getRevenueOverTime(): Promise<
  ActionResultWithData<RevenueDataPoint[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    const { data: events } = await supabase
      .from("events")
      .select("event_id")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No data.", data: [] };
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("final_amount, created_at")
      .in("event_id", eventIds)
      .eq("payment_status", "PAID")
      .order("created_at", { ascending: true });

    if (error) {
      logger.error({ fn: "getRevenueOverTime", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load revenue data." };
    }

    // Group by date
    const grouped = new Map<string, number>();
    for (const o of orders ?? []) {
      const date = new Date(o.created_at).toLocaleDateString("en-CA", {
        timeZone: "Asia/Colombo",
      }); // YYYY-MM-DD format
      grouped.set(date, (grouped.get(date) ?? 0) + Number(o.final_amount));
    }

    const result: RevenueDataPoint[] = [...grouped.entries()].map(
      ([date, revenue]) => ({ date, revenue }),
    );

    return { success: true, message: "Revenue data loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getRevenueOverTime", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Ticket Sales by Type ───────────────────────────────────────────────────

export interface TicketSalesBreakdown {
  name: string;
  event_name: string;
  qty_sold: number;
}

export async function getTicketSalesByType(): Promise<
  ActionResultWithData<TicketSalesBreakdown[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    const { data: events } = await supabase
      .from("events")
      .select("event_id, name")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No data.", data: [] };
    }

    const eventMap = new Map((events ?? []).map((e) => [e.event_id, e.name]));

    const { data: ticketTypes, error } = await supabase
      .from("ticket_types")
      .select("name, event_id, qty_sold")
      .in("event_id", eventIds)
      .gt("qty_sold", 0);

    if (error) {
      logger.error({ fn: "getTicketSalesByType", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load ticket data." };
    }

    const result: TicketSalesBreakdown[] = (ticketTypes ?? []).map((t) => ({
      name: t.name,
      event_name: eventMap.get(t.event_id) ?? "Unknown",
      qty_sold: t.qty_sold,
    }));

    return { success: true, message: "Ticket sales loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getTicketSalesByType", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Payment Method Breakdown ───────────────────────────────────────────────

export interface PaymentMethodBreakdown {
  payment_source: string;
  count: number;
  revenue: number;
}

export async function getPaymentMethodBreakdown(): Promise<
  ActionResultWithData<PaymentMethodBreakdown[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    const { data: events } = await supabase
      .from("events")
      .select("event_id")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No data.", data: [] };
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select("payment_source, final_amount")
      .in("event_id", eventIds)
      .eq("payment_status", "PAID");

    if (error) {
      logger.error({ fn: "getPaymentMethodBreakdown", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load payment data." };
    }

    const grouped = new Map<string, { count: number; revenue: number }>();
    for (const o of orders ?? []) {
      const cur = grouped.get(o.payment_source) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(o.final_amount);
      grouped.set(o.payment_source, cur);
    }

    const result: PaymentMethodBreakdown[] = [...grouped.entries()].map(
      ([payment_source, stats]) => ({
        payment_source,
        count: stats.count,
        revenue: stats.revenue,
      }),
    );

    return { success: true, message: "Payment data loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getPaymentMethodBreakdown", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Scan Activity ──────────────────────────────────────────────────────────

export interface ScanActivityBreakdown {
  event_name: string;
  allowed: number;
  denied: number;
}

export async function getScanActivity(): Promise<
  ActionResultWithData<ScanActivityBreakdown[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    const { data: events } = await supabase
      .from("events")
      .select("event_id, name")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No data.", data: [] };
    }

    const eventMap = new Map((events ?? []).map((e) => [e.event_id, e.name]));

    // Get tickets for these events
    const { data: tickets } = await supabase
      .from("tickets")
      .select("ticket_id, event_id")
      .in("event_id", eventIds);

    const ticketIds = (tickets ?? []).map((t) => t.ticket_id);
    if (ticketIds.length === 0) {
      return { success: true, message: "No scan data.", data: [] };
    }

    const ticketEventMap = new Map(
      (tickets ?? []).map((t) => [t.ticket_id, t.event_id]),
    );

    const { data: logs, error } = await supabase
      .from("scan_logs")
      .select("ticket_id, result")
      .in("ticket_id", ticketIds);

    if (error) {
      logger.error({ fn: "getScanActivity", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load scan data." };
    }

    const grouped = new Map<string, { allowed: number; denied: number }>();
    for (const l of logs ?? []) {
      const eventId = ticketEventMap.get(l.ticket_id);
      if (!eventId) continue;
      const cur = grouped.get(eventId) ?? { allowed: 0, denied: 0 };
      if (l.result === "ALLOWED") {
        cur.allowed += 1;
      } else {
        cur.denied += 1;
      }
      grouped.set(eventId, cur);
    }

    const result: ScanActivityBreakdown[] = [...grouped.entries()].map(
      ([eventId, stats]) => ({
        event_name: eventMap.get(eventId) ?? "Unknown",
        allowed: stats.allowed,
        denied: stats.denied,
      }),
    );

    return { success: true, message: "Scan data loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getScanActivity", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Review Ratings Distribution ────────────────────────────────────────────

export interface RatingDistribution {
  rating: number;
  count: number;
}

export async function getRatingDistribution(): Promise<
  ActionResultWithData<RatingDistribution[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    const { data: events } = await supabase
      .from("events")
      .select("event_id")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No data.", data: [] };
    }

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("rating")
      .in("event_id", eventIds);

    if (error) {
      logger.error({ fn: "getRatingDistribution", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load rating data." };
    }

    const counts = new Map<number, number>();
    for (let i = 1; i <= 5; i++) counts.set(i, 0);
    for (const r of reviews ?? []) {
      counts.set(r.rating, (counts.get(r.rating) ?? 0) + 1);
    }

    const result: RatingDistribution[] = [...counts.entries()].map(
      ([rating, count]) => ({ rating, count }),
    );

    return { success: true, message: "Rating data loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getRatingDistribution", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Top Performing Events ──────────────────────────────────────────────────

export interface TopEvent {
  event_name: string;
  revenue: number;
}

export async function getTopPerformingEvents(): Promise<
  ActionResultWithData<TopEvent[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    const { data: events } = await supabase
      .from("events")
      .select("event_id, name")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No data.", data: [] };
    }

    const eventMap = new Map((events ?? []).map((e) => [e.event_id, e.name]));

    const { data: orders, error } = await supabase
      .from("orders")
      .select("event_id, final_amount")
      .in("event_id", eventIds)
      .eq("payment_status", "PAID");

    if (error) {
      logger.error({ fn: "getTopPerformingEvents", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load event data." };
    }

    const revMap = new Map<string, number>();
    for (const o of orders ?? []) {
      revMap.set(o.event_id, (revMap.get(o.event_id) ?? 0) + Number(o.final_amount));
    }

    const result: TopEvent[] = [...revMap.entries()]
      .map(([eventId, revenue]) => ({
        event_name: eventMap.get(eventId) ?? "Unknown",
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return { success: true, message: "Top events loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getTopPerformingEvents", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}
