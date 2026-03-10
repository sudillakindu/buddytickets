// lib/actions/organizer_overview-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ActionResultWithData,
  OrganizerOverviewStats,
  OrganizerRecentOrder,
} from "@/lib/types/organizer_dashboard";

async function requireOrganizer(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session.sub;
}

export async function getOverviewStats(): Promise<
  ActionResultWithData<OrganizerOverviewStats>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId)
      return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    // Event counts by status
    const { data: events, error: evError } = await supabase
      .from("events")
      .select("event_id, status")
      .eq("organizer_id", userId);

    if (evError) {
      logger.error({ fn: "getOverviewStats", message: "Events fetch error", meta: evError.message });
      return { success: false, message: "Failed to load stats." };
    }

    const statusCounts: Record<string, number> = {};
    for (const e of events ?? []) {
      statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1;
    }
    const eventIds = (events ?? []).map((e) => e.event_id);

    // Tickets sold
    let totalTicketsSold = 0;
    if (eventIds.length > 0) {
      const { data: ticketData } = await supabase
        .from("ticket_types")
        .select("qty_sold")
        .in("event_id", eventIds);
      totalTicketsSold = (ticketData ?? []).reduce(
        (sum, t) => sum + (t.qty_sold ?? 0),
        0,
      );
    }

    // Revenue
    let totalGrossRevenue = 0;
    if (eventIds.length > 0) {
      const { data: orderData } = await supabase
        .from("orders")
        .select("final_amount")
        .in("event_id", eventIds)
        .eq("payment_status", "PAID");
      totalGrossRevenue = (orderData ?? []).reduce(
        (sum, o) => sum + Number(o.final_amount ?? 0),
        0,
      );
    }

    // Pending payouts
    let pendingPayoutAmount = 0;
    {
      const { data: payoutData } = await supabase
        .from("payouts")
        .select("net_payout_amount")
        .eq("organizer_id", userId)
        .eq("status", "PENDING");
      pendingPayoutAmount = (payoutData ?? []).reduce(
        (sum, p) => sum + Number(p.net_payout_amount ?? 0),
        0,
      );
    }

    // Upcoming events (within 7 days)
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let upcomingEventsCount = 0;
    if (eventIds.length > 0) {
      const { count } = await supabase
        .from("events")
        .select("event_id", { count: "exact", head: true })
        .eq("organizer_id", userId)
        .in("status", ["ON_SALE", "PUBLISHED"])
        .lte("start_at", sevenDays.toISOString())
        .gte("start_at", now.toISOString());
      upcomingEventsCount = count ?? 0;
    }

    // Staff count
    let staffCount = 0;
    if (eventIds.length > 0) {
      const { data: staffData } = await supabase
        .from("event_community")
        .select("user_id")
        .in("event_id", eventIds);
      const uniqueStaff = new Set((staffData ?? []).map((s) => s.user_id));
      staffCount = uniqueStaff.size;
    }

    // Average rating
    let averageRating: number | null = null;
    if (eventIds.length > 0) {
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("rating")
        .in("event_id", eventIds);
      if (reviewData && reviewData.length > 0) {
        const sum = reviewData.reduce((s, r) => s + r.rating, 0);
        averageRating = Math.round((sum / reviewData.length) * 10) / 10;
      }
    }

    return {
      success: true,
      message: "Stats loaded.",
      data: {
        total_events: events?.length ?? 0,
        draft_events: statusCounts["DRAFT"] ?? 0,
        published_events: statusCounts["PUBLISHED"] ?? 0,
        on_sale_events: statusCounts["ON_SALE"] ?? 0,
        ongoing_events: statusCounts["ONGOING"] ?? 0,
        completed_events: statusCounts["COMPLETED"] ?? 0,
        cancelled_events: statusCounts["CANCELLED"] ?? 0,
        total_tickets_sold: totalTicketsSold,
        total_gross_revenue: totalGrossRevenue,
        pending_payout_amount: pendingPayoutAmount,
        upcoming_events_count: upcomingEventsCount,
        staff_count: staffCount,
        average_rating: averageRating,
      },
    };
  } catch (err) {
    logger.error({ fn: "getOverviewStats", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getRecentOrders(): Promise<
  ActionResultWithData<OrganizerRecentOrder[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId)
      return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    // Get organizer's event IDs
    const { data: events } = await supabase
      .from("events")
      .select("event_id")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No orders.", data: [] };
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "order_id, final_amount, payment_status, created_at, user_id, event_id",
      )
      .in("event_id", eventIds)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      logger.error({ fn: "getRecentOrders", message: "Orders fetch error", meta: error.message });
      return { success: false, message: "Failed to load orders." };
    }

    // Get user names and event names
    const userIds = [...new Set((orders ?? []).map((o) => o.user_id))];
    const orderEventIds = [...new Set((orders ?? []).map((o) => o.event_id))];

    const [{ data: users }, { data: evts }] = await Promise.all([
      userIds.length > 0
        ? supabase.from("users").select("user_id, name").in("user_id", userIds)
        : Promise.resolve({ data: [] as { user_id: string; name: string }[] }),
      orderEventIds.length > 0
        ? supabase.from("events").select("event_id, name").in("event_id", orderEventIds)
        : Promise.resolve({ data: [] as { event_id: string; name: string }[] }),
    ]);

    const userMap = new Map((users ?? []).map((u) => [u.user_id, u.name]));
    const eventMap = new Map((evts ?? []).map((e) => [e.event_id, e.name]));

    const result: OrganizerRecentOrder[] = (orders ?? []).map((o) => ({
      order_id: o.order_id,
      user_name: userMap.get(o.user_id) ?? "Unknown",
      event_name: eventMap.get(o.event_id) ?? "Unknown",
      final_amount: Number(o.final_amount),
      payment_status: o.payment_status as OrganizerRecentOrder["payment_status"],
      created_at: o.created_at,
    }));

    return { success: true, message: "Orders loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getRecentOrders", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}
