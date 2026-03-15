"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type { ScanLog, ScanResult } from "@/lib/types/scan-log";

interface ScanLogRow {
  scan_id: number;
  ticket_id: string;
  scanned_by_user_id: string;
  result: ScanResult;
  scanned_at: string;
}

// --- Log Ticket Scan ---
export async function logTicketScan(
  ticketId: string,
  result: ScanResult,
): Promise<{ success: boolean; message: string; scan?: ScanLog }> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!ticketId) return { success: false, message: "Ticket ID required." };
  if (!result) return { success: false, message: "Scan result required." };

  try {
    // Validate user has staff role
    if (session.role !== "STAFF" && session.role !== "ADMIN") {
      return { success: false, message: "Staff access required." };
    }

    const { data: scan, error } = await getSupabaseAdmin()
      .from("scan_logs")
      .insert({
        ticket_id: ticketId,
        scanned_by_user_id: session.sub,
        result,
      })
      .select("*")
      .single();

    if (error) throw error;

    return {
      success: true,
      message: "Scan logged.",
      scan: scan as unknown as ScanLog,
    };
  } catch (err) {
    logger.error({ fn: "logTicketScan", message: "Error", meta: err });
    return { success: false, message: "Failed to log scan." };
  }
}

// --- Get Scan Logs For Ticket ---
export async function getScanLogsForTicket(
  ticketId: string,
): Promise<{ success: boolean; message: string; logs?: ScanLog[] }> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!ticketId) return { success: false, message: "Ticket ID required." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("scan_logs")
      .select("scan_id, ticket_id, scanned_by_user_id, result, scanned_at")
      .eq("ticket_id", ticketId)
      .order("scanned_at", { ascending: false });

    if (error) throw error;

    const logs = (data ?? []).map(
      (row) => row as unknown as ScanLogRow,
    ) as ScanLog[];

    return { success: true, message: "Scan logs loaded.", logs };
  } catch (err) {
    logger.error({
      fn: "getScanLogsForTicket",
      message: "Error",
      meta: err,
    });
    return { success: false, message: "Failed to load scan logs." };
  }
}
