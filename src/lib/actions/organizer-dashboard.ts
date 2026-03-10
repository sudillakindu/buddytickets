// lib/actions/organizer-dashboard.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  OrganizerDashboardStats,
  OrganizerEventRow,
  OrganizerOrderRow,
  OrganizerStaffRow,
  OrganizerPromotionRow,
  GetOrganizerDashboardResult,
  GetOrganizerEventsResult,
  GetOrganizerOrdersResult,
  GetOrganizerStaffResult,
  GetOrganizerPromotionsResult,
} from "@/lib/types/dashboard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UNAUTHORIZED = { success: false, message: "Unauthorized." } as const;

async function requireOrganizer() {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getOrganizerDashboardStats(): Promise<GetOrganizerDashboardResult> {
  const session = await requireOrganizer();
  if (!session) return UNAUTHORIZED;

  try {
    const supabase = await createClient();
    const organizerId = session.sub;

    // Fetch the organizer's event IDs first
    const { data: eventRows, error: eventIdsErr } = await supabase
      .from("events")
      .select("event_id")
      .eq("organizer_id", organizerId);

    if (eventIdsErr) throw eventIdsErr;

    const eventIds = (eventRows ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => e.event_id as string,
    );

    const [totalEventsRes, activeEventsRes, ticketTypesRes, revenueRes, pendingRes] =
      await Promise.all([
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("organizer_id", organizerId),
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("organizer_id", organizerId)
          .eq("is_active", true)
          .in("status", ["ON_SALE", "ONGOING"]),
        eventIds.length > 0
          ? supabase
              .from("ticket_types")
              .select("qty_sold")
              .in("event_id", eventIds)
          : Promise.resolve({ data: [], error: null }),
        eventIds.length > 0
          ? supabase
              .from("orders")
              .select("final_amount")
              .eq("payment_status", "PAID")
              .in("event_id", eventIds)
          : Promise.resolve({ data: [], error: null }),
        eventIds.length > 0
          ? supabase
              .from("orders")
              .select("*", { count: "exact", head: true })
              .eq("payment_status", "PENDING")
              .in("event_id", eventIds)
          : Promise.resolve({ data: null, error: null, count: 0 }),
      ]);

    if (totalEventsRes.error) throw totalEventsRes.error;
    if (activeEventsRes.error) throw activeEventsRes.error;
    if (ticketTypesRes.error) throw ticketTypesRes.error;
    if (revenueRes.error) throw revenueRes.error;
    if (pendingRes.error) throw pendingRes.error;

    const total_tickets_sold = (ticketTypesRes.data ?? []).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, row: any) => sum + Number(row.qty_sold ?? 0),
      0,
    );

    const total_revenue = (revenueRes.data ?? []).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, row: any) => sum + Number(row.final_amount ?? 0),
      0,
    );

    const stats: OrganizerDashboardStats = {
      total_events: totalEventsRes.count ?? 0,
      active_events: activeEventsRes.count ?? 0,
      total_tickets_sold,
      total_revenue,
      pending_orders: pendingRes.count ?? 0,
    };

    return { success: true, stats };
  } catch (err) {
    logger.error({
      fn: "getOrganizerDashboardStats",
      message: "Error fetching organizer dashboard stats",
      meta: err,
    });
    return { success: false, message: "Failed to load dashboard stats." };
  }
}

export async function getOrganizerEvents(): Promise<GetOrganizerEventsResult> {
  const session = await requireOrganizer();
  if (!session) return UNAUTHORIZED;

  try {
    const supabase = await createClient();
    const organizerId = session.sub;

    // Query 1: events with ticket_types for sold/capacity aggregation
    const { data: eventsData, error: eventsErr } = await supabase
      .from("events")
      .select(
        `
        event_id, name, status, start_at, end_at, location,
        ticket_types ( capacity, qty_sold )
      `,
      )
      .eq("organizer_id", organizerId)
      .order("created_at", { ascending: false });

    if (eventsErr) throw eventsErr;

    const eventIds = (eventsData ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => e.event_id as string,
    );

    // Query 2: paid orders grouped by event_id for revenue per event
    const revenueMap = new Map<string, number>();
    if (eventIds.length > 0) {
      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select("event_id, final_amount")
        .eq("payment_status", "PAID")
        .in("event_id", eventIds);

      if (ordersErr) throw ordersErr;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of (ordersData ?? []) as any[]) {
        const prev = revenueMap.get(row.event_id) ?? 0;
        revenueMap.set(row.event_id, prev + Number(row.final_amount ?? 0));
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: OrganizerEventRow[] = (eventsData ?? []).map((row: any) => {
      const ticketTypes = (row.ticket_types ?? []) as {
        capacity: number;
        qty_sold: number;
      }[];

      return {
        event_id: row.event_id,
        name: row.name,
        status: row.status,
        start_at: row.start_at,
        end_at: row.end_at,
        location: row.location,
        tickets_sold: ticketTypes.reduce(
          (sum, t) => sum + (t.qty_sold ?? 0),
          0,
        ),
        total_capacity: ticketTypes.reduce(
          (sum, t) => sum + (t.capacity ?? 0),
          0,
        ),
        total_revenue: revenueMap.get(row.event_id) ?? 0,
      };
    });

    return { success: true, data: events };
  } catch (err) {
    logger.error({
      fn: "getOrganizerEvents",
      message: "Error fetching organizer events",
      meta: err,
    });
    return { success: false, message: "Failed to load events." };
  }
}

export async function getOrganizerOrders(): Promise<GetOrganizerOrdersResult> {
  const session = await requireOrganizer();
  if (!session) return UNAUTHORIZED;

  try {
    const supabase = await createClient();
    const organizerId = session.sub;

    // Fetch the organizer's event IDs
    const { data: eventRows, error: eventIdsErr } = await supabase
      .from("events")
      .select("event_id")
      .eq("organizer_id", organizerId);

    if (eventIdsErr) throw eventIdsErr;

    const eventIds = (eventRows ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => e.event_id as string,
    );

    if (eventIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        order_id, final_amount, payment_status, payment_source, created_at,
        users!orders_user_id_fkey ( name ),
        events ( name )
      `,
      )
      .in("event_id", eventIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders: OrganizerOrderRow[] = (data ?? []).map((row: any) => {
      const buyer = Array.isArray(row.users) ? row.users[0] : row.users;
      const event = Array.isArray(row.events) ? row.events[0] : row.events;

      return {
        order_id: row.order_id,
        buyer_name: buyer?.name ?? "Unknown",
        event_name: event?.name ?? "Unknown",
        final_amount: Number(row.final_amount ?? 0),
        payment_status: row.payment_status,
        payment_source: row.payment_source,
        created_at: row.created_at,
      };
    });

    return { success: true, data: orders };
  } catch (err) {
    logger.error({
      fn: "getOrganizerOrders",
      message: "Error fetching organizer orders",
      meta: err,
    });
    return { success: false, message: "Failed to load orders." };
  }
}

// Staff are users with role='STAFF', but there is no staff_assignments table
// in the DB yet. Return an empty array until the assignment table is created.
export async function getOrganizerStaff(): Promise<GetOrganizerStaffResult> {
  const session = await requireOrganizer();
  if (!session) return UNAUTHORIZED;

  return { success: true, data: [] as OrganizerStaffRow[] };
}

export async function getOrganizerPromotions(): Promise<GetOrganizerPromotionsResult> {
  const session = await requireOrganizer();
  if (!session) return UNAUTHORIZED;

  try {
    const supabase = await createClient();
    const organizerId = session.sub;

    // Fetch the organizer's event IDs
    const { data: eventRows, error: eventIdsErr } = await supabase
      .from("events")
      .select("event_id")
      .eq("organizer_id", organizerId);

    if (eventIdsErr) throw eventIdsErr;

    const eventIds = (eventRows ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => e.event_id as string,
    );

    if (eventIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from("promotions")
      .select(
        `
        promotion_id, code, discount_type, discount_value,
        current_global_usage, is_active, created_at,
        events ( name )
      `,
      )
      .in("event_id", eventIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promotions: OrganizerPromotionRow[] = (data ?? []).map((row: any) => {
      const event = Array.isArray(row.events) ? row.events[0] : row.events;

      return {
        promotion_id: row.promotion_id,
        event_name: event?.name ?? "Unknown",
        code: row.code,
        discount_type: row.discount_type,
        discount_value: Number(row.discount_value ?? 0),
        current_global_usage: row.current_global_usage ?? 0,
        is_active: row.is_active,
      };
    });

    return { success: true, data: promotions };
  } catch (err) {
    logger.error({
      fn: "getOrganizerPromotions",
      message: "Error fetching organizer promotions",
      meta: err,
    });
    return { success: false, message: "Failed to load promotions." };
  }
}
