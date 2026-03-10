// lib/actions/system-overview.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type { OverviewData } from "@/lib/types/system";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<boolean> {
  const session = await getSession();
  return !!session && session.role === "SYSTEM";
}

// ─── Get Overview Data ───────────────────────────────────────────────────────

export async function getOverviewData(): Promise<{
  success: boolean;
  message: string;
  data: OverviewData | null;
}> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized", data: null };
  }

  try {
    const supabase = await createClient();

    // Parallel fetch all stats
    const [
      usersRes,
      organizersRes,
      eventsRes,
      revenueRes,
      verificationsRes,
      payoutsRes,
      refundsRes,
      monthlyRes,
    ] = await Promise.all([
      // Total users
      supabase.from("users").select("user_id", { count: "exact", head: true }),
      // Approved organizers
      supabase
        .from("organizer_details")
        .select("user_id", { count: "exact", head: true })
        .eq("status", "APPROVED"),
      // Total events
      supabase
        .from("events")
        .select("event_id", { count: "exact", head: true }),
      // Platform revenue (SUM of platform_fee_amount WHERE status=COMPLETED)
      supabase
        .from("payouts")
        .select("platform_fee_amount")
        .eq("status", "COMPLETED"),
      // Recent verifications
      supabase
        .from("organizer_details")
        .select("user_id, status, verified_at, created_at, users!inner ( name, email )")
        .eq("is_submitted", true)
        .order("created_at", { ascending: false })
        .limit(5),
      // Recent payouts
      supabase
        .from("payouts")
        .select(
          "payout_id, net_payout_amount, status, created_at, events!inner ( name ), users!payouts_organizer_id_fkey ( name )",
        )
        .order("created_at", { ascending: false })
        .limit(5),
      // Recent refunds
      supabase
        .from("refund_requests")
        .select(
          "refund_id, refund_amount, status, created_at, users!refund_requests_user_id_fkey ( name )",
        )
        .order("created_at", { ascending: false })
        .limit(5),
      // Monthly revenue (last 12 months) — using completed payouts
      supabase
        .from("payouts")
        .select("platform_fee_amount, created_at")
        .eq("status", "COMPLETED"),
    ]);

    // Calculate platform revenue
    const platformRevenue = (revenueRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.platform_fee_amount),
      0,
    );

    // Process monthly revenue
    const now = new Date();
    const months: { month: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ month: key, revenue: 0 });
    }

    for (const row of monthlyRes.data ?? []) {
      const date = new Date(row.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const entry = months.find((m) => m.month === key);
      if (entry) {
        entry.revenue += Number(row.platform_fee_amount);
      }
    }

    // Map recent verifications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentVerifications = (verificationsRes.data ?? []).map((row: any) => ({
      user_id: row.user_id,
      name: row.users?.name ?? "",
      email: row.users?.email ?? "",
      status: row.status,
      verified_at: row.verified_at,
      created_at: row.created_at,
    }));

    // Map recent payouts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentPayouts = (payoutsRes.data ?? []).map((row: any) => ({
      payout_id: row.payout_id,
      event_name: row.events?.name ?? "",
      organizer_name: row.users?.name ?? "",
      net_payout_amount: Number(row.net_payout_amount),
      status: row.status,
      created_at: row.created_at,
    }));

    // Map recent refunds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentRefunds = (refundsRes.data ?? []).map((row: any) => ({
      refund_id: row.refund_id,
      user_name: row.users?.name ?? "",
      refund_amount: Number(row.refund_amount),
      status: row.status,
      created_at: row.created_at,
    }));

    const data: OverviewData = {
      stats: {
        totalUsers: usersRes.count ?? 0,
        totalApprovedOrganizers: organizersRes.count ?? 0,
        totalEvents: eventsRes.count ?? 0,
        platformRevenue,
      },
      recentVerifications,
      recentPayouts,
      recentRefunds,
      monthlyRevenue: months,
    };

    return { success: true, message: "Overview data fetched", data };
  } catch (err) {
    logger.error({ fn: "getOverviewData", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error", data: null };
  }
}
