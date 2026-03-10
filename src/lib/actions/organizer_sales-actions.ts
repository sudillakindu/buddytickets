// lib/actions/organizer_sales-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ActionResultWithData,
  PaginatedResult,
  OrganizerOrder,
  OrganizerSalesSummary,
  PaymentStatus,
  PaymentSource,
} from "@/lib/types/organizer_dashboard";

async function requireOrganizer(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session.sub;
}

export async function getSalesSummary(): Promise<
  ActionResultWithData<OrganizerSalesSummary>
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
      return {
        success: true,
        message: "No sales data.",
        data: { total_orders: 0, total_revenue: 0, total_discount_given: 0 },
      };
    }

    const { data: orders } = await supabase
      .from("orders")
      .select("final_amount, discount_amount, payment_status")
      .in("event_id", eventIds)
      .eq("payment_status", "PAID");

    const totalOrders = orders?.length ?? 0;
    const totalRevenue = (orders ?? []).reduce(
      (s, o) => s + Number(o.final_amount ?? 0),
      0,
    );
    const totalDiscount = (orders ?? []).reduce(
      (s, o) => s + Number(o.discount_amount ?? 0),
      0,
    );

    return {
      success: true,
      message: "Summary loaded.",
      data: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        total_discount_given: totalDiscount,
      },
    };
  } catch (err) {
    logger.error({ fn: "getSalesSummary", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getOrders(filters: {
  event_id?: string;
  payment_status?: PaymentStatus;
  payment_source?: PaymentSource;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResult<OrganizerOrder>> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    // Get organizer's events
    const { data: events } = await supabase
      .from("events")
      .select("event_id, name")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No orders.", data: [], total_count: 0 };
    }

    const eventMap = new Map((events ?? []).map((e) => [e.event_id, e.name]));
    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("orders")
      .select(
        "order_id, user_id, event_id, subtotal, discount_amount, final_amount, payment_source, payment_status, created_at",
        { count: "exact" },
      )
      .in("event_id", eventIds)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters.event_id) query = query.eq("event_id", filters.event_id);
    if (filters.payment_status) query = query.eq("payment_status", filters.payment_status);
    if (filters.payment_source) query = query.eq("payment_source", filters.payment_source);

    const { data: orders, error, count } = await query;

    if (error) {
      logger.error({ fn: "getOrders", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load orders." };
    }

    // Get user details
    const userIds = [...new Set((orders ?? []).map((o) => o.user_id))];
    let userMap = new Map<string, { name: string; email: string }>();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("user_id, name, email")
        .in("user_id", userIds);
      userMap = new Map(
        (users ?? []).map((u) => [u.user_id, { name: u.name, email: u.email }]),
      );
    }

    // Get ticket counts per order
    const orderIds = (orders ?? []).map((o) => o.order_id);
    const ticketCountMap = new Map<string, number>();
    if (orderIds.length > 0) {
      const { data: tickets } = await supabase
        .from("tickets")
        .select("order_id")
        .in("order_id", orderIds);
      for (const t of tickets ?? []) {
        ticketCountMap.set(t.order_id, (ticketCountMap.get(t.order_id) ?? 0) + 1);
      }
    }

    const result: OrganizerOrder[] = (orders ?? []).map((o) => {
      const user = userMap.get(o.user_id);
      return {
        order_id: o.order_id,
        user_name: user?.name ?? "Unknown",
        user_email: user?.email ?? "",
        event_name: eventMap.get(o.event_id) ?? "Unknown",
        event_id: o.event_id,
        ticket_count: ticketCountMap.get(o.order_id) ?? 0,
        subtotal: Number(o.subtotal),
        discount_amount: Number(o.discount_amount ?? 0),
        final_amount: Number(o.final_amount),
        payment_source: o.payment_source as PaymentSource,
        payment_status: o.payment_status as PaymentStatus,
        created_at: o.created_at,
      };
    });

    return {
      success: true,
      message: "Orders loaded.",
      data: result,
      total_count: count ?? 0,
      page,
      per_page: perPage,
    };
  } catch (err) {
    logger.error({ fn: "getOrders", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}
