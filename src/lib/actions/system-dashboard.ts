// lib/actions/system-dashboard.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  SystemDashboardStats,
  SystemUserRow,
  SystemOrganizerRow,
  SystemEventRow,
  SystemPayoutRow,
  SystemRefundRow,
  GetSystemDashboardResult,
  GetSystemUsersResult,
  GetSystemOrganizersResult,
  GetSystemEventsResult,
  GetSystemPayoutsResult,
  GetSystemRefundsResult,
} from "@/lib/types/dashboard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UNAUTHORIZED = { success: false, message: "Unauthorized." } as const;

async function requireSystem() {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getSystemDashboardStats(): Promise<GetSystemDashboardResult> {
  if (!(await requireSystem())) return UNAUTHORIZED;

  try {
    const supabase = await createClient();

    const [
      usersRes,
      organizersRes,
      eventsRes,
      revenueRes,
      pendingOrgRes,
      activeEventsRes,
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "ORGANIZER"),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("final_amount")
        .eq("payment_status", "PAID"),
      supabase
        .from("organizer_details")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING"),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)
        .in("status", ["ON_SALE", "ONGOING"]),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (organizersRes.error) throw organizersRes.error;
    if (eventsRes.error) throw eventsRes.error;
    if (revenueRes.error) throw revenueRes.error;
    if (pendingOrgRes.error) throw pendingOrgRes.error;
    if (activeEventsRes.error) throw activeEventsRes.error;

    const total_revenue = (revenueRes.data ?? []).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, row: any) => sum + Number(row.final_amount ?? 0),
      0,
    );

    const stats: SystemDashboardStats = {
      total_users: usersRes.count ?? 0,
      total_organizers: organizersRes.count ?? 0,
      total_events: eventsRes.count ?? 0,
      total_revenue,
      pending_organizers: pendingOrgRes.count ?? 0,
      active_events: activeEventsRes.count ?? 0,
    };

    return { success: true, stats };
  } catch (err) {
    logger.error({
      fn: "getSystemDashboardStats",
      message: "Error fetching system dashboard stats",
      meta: err,
    });
    return { success: false, message: "Failed to load dashboard stats." };
  }
}

export async function getSystemUsers(): Promise<GetSystemUsersResult> {
  if (!(await requireSystem())) return UNAUTHORIZED;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select(
        "user_id, name, email, role, is_active, created_at, last_login_at, image_url",
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users: SystemUserRow[] = (data ?? []).map((row: any) => ({
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      is_active: row.is_active,
      created_at: row.created_at,
      last_login_at: row.last_login_at ?? null,
      image_url: row.image_url ?? null,
    }));

    return { success: true, data: users };
  } catch (err) {
    logger.error({
      fn: "getSystemUsers",
      message: "Error fetching system users",
      meta: err,
    });
    return { success: false, message: "Failed to load users." };
  }
}

export async function getSystemOrganizers(): Promise<GetSystemOrganizersResult> {
  if (!(await requireSystem())) return UNAUTHORIZED;

  try {
    const supabase = await createClient();

    const [usersRes, detailsRes] = await Promise.all([
      supabase
        .from("users")
        .select("user_id, name, email")
        .eq("role", "ORGANIZER"),
      supabase
        .from("organizer_details")
        .select("user_id, status, nic_number, verified_at, created_at")
        .order("created_at", { ascending: false }),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (detailsRes.error) throw detailsRes.error;

    const usersMap = new Map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (usersRes.data ?? []).map((u: any) => [u.user_id, u]),
    );

    const organizers: SystemOrganizerRow[] = (detailsRes.data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((d: any) => usersMap.has(d.user_id))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((d: any) => {
        const user = usersMap.get(d.user_id);
        return {
          user_id: d.user_id,
          name: user?.name ?? "",
          email: user?.email ?? "",
          status: d.status,
          nic_number: d.nic_number,
          created_at: d.created_at,
          verified_at: d.verified_at ?? null,
        };
      });

    return { success: true, data: organizers };
  } catch (err) {
    logger.error({
      fn: "getSystemOrganizers",
      message: "Error fetching system organizers",
      meta: err,
    });
    return { success: false, message: "Failed to load organizers." };
  }
}

export async function getSystemEvents(): Promise<GetSystemEventsResult> {
  if (!(await requireSystem())) return UNAUTHORIZED;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        event_id, name, status, start_at, location,
        users!events_organizer_id_fkey ( name ),
        ticket_types ( capacity, qty_sold )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: SystemEventRow[] = (data ?? []).map((row: any) => {
      const organizer = Array.isArray(row.users) ? row.users[0] : row.users;
      const ticketTypes = (row.ticket_types ?? []) as {
        capacity: number;
        qty_sold: number;
      }[];

      return {
        event_id: row.event_id,
        name: row.name,
        organizer_name: organizer?.name ?? "Unknown",
        status: row.status,
        start_at: row.start_at,
        location: row.location,
        tickets_sold: ticketTypes.reduce(
          (sum, t) => sum + (t.qty_sold ?? 0),
          0,
        ),
        total_capacity: ticketTypes.reduce(
          (sum, t) => sum + (t.capacity ?? 0),
          0,
        ),
      };
    });

    return { success: true, data: events };
  } catch (err) {
    logger.error({
      fn: "getSystemEvents",
      message: "Error fetching system events",
      meta: err,
    });
    return { success: false, message: "Failed to load events." };
  }
}

export async function getSystemPayouts(): Promise<GetSystemPayoutsResult> {
  if (!(await requireSystem())) return UNAUTHORIZED;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payouts")
      .select(
        `
        payout_id, gross_revenue, platform_fee_amount, net_payout_amount,
        status, created_at,
        events ( name ),
        users!payouts_organizer_id_fkey ( name )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payouts: SystemPayoutRow[] = (data ?? []).map((row: any) => {
      const event = Array.isArray(row.events) ? row.events[0] : row.events;
      const organizer = Array.isArray(row.users) ? row.users[0] : row.users;

      return {
        payout_id: row.payout_id,
        event_name: event?.name ?? "Unknown",
        organizer_name: organizer?.name ?? "Unknown",
        gross_revenue: Number(row.gross_revenue ?? 0),
        platform_fee_amount: Number(row.platform_fee_amount ?? 0),
        net_payout_amount: Number(row.net_payout_amount ?? 0),
        status: row.status,
        created_at: row.created_at,
      };
    });

    return { success: true, data: payouts };
  } catch (err) {
    logger.error({
      fn: "getSystemPayouts",
      message: "Error fetching system payouts",
      meta: err,
    });
    return { success: false, message: "Failed to load payouts." };
  }
}

export async function getSystemRefunds(): Promise<GetSystemRefundsResult> {
  if (!(await requireSystem())) return UNAUTHORIZED;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("refund_requests")
      .select(
        `
        refund_id, order_id, refund_amount, reason, status, created_at,
        users!refund_requests_user_id_fkey ( name ),
        orders!refund_requests_order_id_fkey ( events ( name ) )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refunds: SystemRefundRow[] = (data ?? []).map((row: any) => {
      const user = Array.isArray(row.users) ? row.users[0] : row.users;
      const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
      const event = order?.events
        ? Array.isArray(order.events)
          ? order.events[0]
          : order.events
        : null;

      return {
        refund_id: row.refund_id,
        order_id: row.order_id,
        user_name: user?.name ?? "Unknown",
        event_name: event?.name ?? "Unknown",
        refund_amount: Number(row.refund_amount ?? 0),
        reason: row.reason ?? "",
        status: row.status,
        created_at: row.created_at,
      };
    });

    return { success: true, data: refunds };
  } catch (err) {
    logger.error({
      fn: "getSystemRefunds",
      message: "Error fetching system refunds",
      meta: err,
    });
    return { success: false, message: "Failed to load refunds." };
  }
}
