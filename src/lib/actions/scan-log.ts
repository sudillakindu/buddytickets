"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type {
  ScanLog,
  ScanLogInsert,
  ScanLogResult,
  ScanLogListResult,
} from "@/lib/types/scan-log";

// --- Insert a scan log entry ---
export async function insertScanLog(
  input: ScanLogInsert,
): Promise<ScanLogResult> {
  try {
    if (!input.ticket_id || !input.scanned_by_user_id || !input.result) {
      return { success: false, message: "Missing required scan log fields." };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("scan_logs")
      .insert({
        ticket_id: input.ticket_id,
        scanned_by_user_id: input.scanned_by_user_id,
        result: input.result,
      })
      .select("scan_id, ticket_id, scanned_by_user_id, result, scanned_at")
      .single();

    if (error) throw error;

    return {
      success: true,
      message: "Scan log recorded.",
      scan_log: data as ScanLog,
    };
  } catch (err) {
    logger.error({
      fn: "insertScanLog",
      message: "Error inserting scan log",
      meta: err,
    });
    return { success: false, message: "Failed to record scan log." };
  }
}

// --- Get scan logs for a ticket ---
export async function getScanLogsByTicket(
  ticketId: string,
): Promise<ScanLogListResult> {
  try {
    if (!ticketId) {
      return { success: false, message: "Ticket ID is required." };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("scan_logs")
      .select("scan_id, ticket_id, scanned_by_user_id, result, scanned_at")
      .eq("ticket_id", ticketId)
      .order("scanned_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "Scan logs loaded.",
      scan_logs: (data ?? []) as ScanLog[],
    };
  } catch (err) {
    logger.error({
      fn: "getScanLogsByTicket",
      message: "Error fetching scan logs",
      meta: err,
    });
    return { success: false, message: "Failed to load scan logs." };
  }
}
