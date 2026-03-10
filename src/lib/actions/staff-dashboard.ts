// lib/actions/staff-dashboard.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  StaffDashboardStats,
  StaffEventRow,
  StaffScanLogRow,
  GetStaffDashboardResult,
  GetStaffEventsResult,
  GetStaffScanLogsResult,
} from "@/lib/types/dashboard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UNAUTHORIZED = { success: false, message: "Unauthorized." } as const;

async function requireStaff() {
  const session = await getSession();
  if (!session || session.role !== "STAFF") return null;
  return session;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getStaffDashboardStats(): Promise<GetStaffDashboardResult> {
  const session = await requireStaff();
  if (!session) return UNAUTHORIZED;

  try {
    const supabase = await createClient();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    const [distinctEventsRes, totalScansRes, successfulScansRes, deniedScansRes] =
      await Promise.all([
        supabase
          .from("scan_logs")
          .select("event_id")
          .eq("staff_id", session.sub),
        supabase
          .from("scan_logs")
          .select("*", { count: "exact", head: true })
          .eq("staff_id", session.sub)
          .gte("scanned_at", todayStartISO),
        supabase
          .from("scan_logs")
          .select("*", { count: "exact", head: true })
          .eq("staff_id", session.sub)
          .eq("result", "ALLOWED")
          .gte("scanned_at", todayStartISO),
        supabase
          .from("scan_logs")
          .select("*", { count: "exact", head: true })
          .eq("staff_id", session.sub)
          .neq("result", "ALLOWED")
          .gte("scanned_at", todayStartISO),
      ]);

    if (distinctEventsRes.error) throw distinctEventsRes.error;
    if (totalScansRes.error) throw totalScansRes.error;
    if (successfulScansRes.error) throw successfulScansRes.error;
    if (deniedScansRes.error) throw deniedScansRes.error;

    const distinctEventIds = new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (distinctEventsRes.data ?? []).map((r: any) => r.event_id),
    );

    const stats: StaffDashboardStats = {
      assigned_events: distinctEventIds.size,
      total_scans_today: totalScansRes.count ?? 0,
      successful_scans_today: successfulScansRes.count ?? 0,
      denied_scans_today: deniedScansRes.count ?? 0,
    };

    return { success: true, stats };
  } catch (err) {
    logger.error({
      fn: "getStaffDashboardStats",
      message: "Error fetching staff dashboard stats",
      meta: err,
    });
    return { success: false, message: "Failed to load dashboard stats." };
  }
}

export async function getStaffEvents(): Promise<GetStaffEventsResult> {
  const session = await requireStaff();
  if (!session) return UNAUTHORIZED;

  try {
    const supabase = await createClient();

    // Get distinct event_ids from staff's scan_logs
    const scanLogsRes = await supabase
      .from("scan_logs")
      .select("event_id")
      .eq("staff_id", session.sub);

    if (scanLogsRes.error) throw scanLogsRes.error;

    const eventIds = [
      ...new Set(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (scanLogsRes.data ?? []).map((r: any) => r.event_id as string),
      ),
    ];

    if (eventIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from("events")
      .select(
        `
        event_id, name, status, start_at, end_at, location,
        users!events_organizer_id_fkey ( name )
      `,
      )
      .in("event_id", eventIds)
      .order("start_at", { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: StaffEventRow[] = (data ?? []).map((row: any) => {
      const organizer = Array.isArray(row.users) ? row.users[0] : row.users;

      return {
        event_id: row.event_id,
        name: row.name,
        status: row.status,
        start_at: row.start_at,
        end_at: row.end_at,
        location: row.location,
        organizer_name: organizer?.name ?? "Unknown",
      };
    });

    return { success: true, data: events };
  } catch (err) {
    logger.error({
      fn: "getStaffEvents",
      message: "Error fetching staff events",
      meta: err,
    });
    return { success: false, message: "Failed to load events." };
  }
}

export async function getStaffScanLogs(): Promise<GetStaffScanLogsResult> {
  const session = await requireStaff();
  if (!session) return UNAUTHORIZED;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("scan_logs")
      .select(
        `
        scan_log_id, ticket_id, result, scanned_at,
        events ( name )
      `,
      )
      .eq("staff_id", session.sub)
      .order("scanned_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs: StaffScanLogRow[] = (data ?? []).map((row: any) => {
      const event = Array.isArray(row.events) ? row.events[0] : row.events;

      return {
        scan_log_id: row.scan_log_id,
        ticket_id: row.ticket_id,
        event_name: event?.name ?? "Unknown",
        result: row.result,
        scanned_at: row.scanned_at,
      };
    });

    return { success: true, data: logs };
  } catch (err) {
    logger.error({
      fn: "getStaffScanLogs",
      message: "Error fetching staff scan logs",
      meta: err,
    });
    return { success: false, message: "Failed to load scan logs." };
  }
}
