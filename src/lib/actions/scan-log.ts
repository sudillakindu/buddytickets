"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  ScanResult,
  ScanLog,
  ScanTicketInput,
  ScanTicketResult,
} from "@/lib/types/scan-log";

// --- Scan a ticket at event entry ---

export async function scanTicket(
  input: ScanTicketInput,
): Promise<ScanTicketResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  const { ticket_id, qr_hash } = input;
  if (!ticket_id || !qr_hash)
    return { success: false, message: "Ticket ID and QR hash are required." };

  try {
    // --- Fetch ticket and verify QR hash match ---
    const { data: ticket, error: ticketErr } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id, qr_hash, status, order_id")
      .eq("ticket_id", ticket_id)
      .eq("qr_hash", qr_hash)
      .maybeSingle();

    if (ticketErr) throw ticketErr;

    if (!ticket) {
      const scanResult: ScanResult = "DENIED_INVALID";
      await insertScanLog(ticket_id, session.sub, scanResult);
      return {
        success: false,
        message: "Ticket not found or QR mismatch.",
        result: scanResult,
      };
    }

    // --- Check ticket status ---
    if (ticket.status === "USED") {
      const scanResult: ScanResult = "DENIED_ALREADY_USED";
      await insertScanLog(ticket_id, session.sub, scanResult);
      return {
        success: false,
        message: "This ticket has already been used.",
        result: scanResult,
      };
    }

    if (ticket.status === "PENDING") {
      const scanResult: ScanResult = "DENIED_UNPAID";
      await insertScanLog(ticket_id, session.sub, scanResult);
      return {
        success: false,
        message: "Payment has not been confirmed for this ticket.",
        result: scanResult,
      };
    }

    if (ticket.status === "CANCELLED") {
      const scanResult: ScanResult = "DENIED_INVALID";
      await insertScanLog(ticket_id, session.sub, scanResult);
      return {
        success: false,
        message: "This ticket has been cancelled.",
        result: scanResult,
      };
    }

    // --- Mark ticket as USED (atomic: WHERE status = 'ACTIVE' prevents race conditions) ---
    const { data: updatedRows, error: updateErr } = await getSupabaseAdmin()
      .from("tickets")
      .update({ status: "USED" })
      .eq("ticket_id", ticket_id)
      .eq("status", "ACTIVE")
      .select("ticket_id");

    if (updateErr) throw updateErr;

    if (!updatedRows || updatedRows.length === 0) {
      const scanResult: ScanResult = "DENIED_ALREADY_USED";
      await insertScanLog(ticket_id, session.sub, scanResult);
      return {
        success: false,
        message: "Ticket was already used by a concurrent scan.",
        result: scanResult,
      };
    }

    const scanResult: ScanResult = "ALLOWED";
    const scanLog = await insertScanLog(ticket_id, session.sub, scanResult);

    return {
      success: true,
      message: "Ticket validated. Entry allowed.",
      result: scanResult,
      scan_log: scanLog ?? undefined,
    };
  } catch (err) {
    logger.error({
      fn: "scanTicket",
      message: "Error scanning ticket",
      meta: err,
    });
    return { success: false, message: "Failed to scan ticket." };
  }
}

// --- Get scan history for a ticket ---

export async function getTicketScanLogs(
  ticketId: string,
): Promise<{ success: boolean; message: string; logs?: ScanLog[] }> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("scan_logs")
      .select("scan_id, ticket_id, scanned_by_user_id, result, scanned_at")
      .eq("ticket_id", ticketId)
      .order("scanned_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "Scan logs loaded.",
      logs: (data ?? []) as ScanLog[],
    };
  } catch (err) {
    logger.error({
      fn: "getTicketScanLogs",
      message: "Error fetching scan logs",
      meta: err,
    });
    return { success: false, message: "Failed to load scan logs." };
  }
}

// --- Helper: Insert scan log entry ---

async function insertScanLog(
  ticketId: string,
  scannedByUserId: string,
  result: ScanResult,
): Promise<ScanLog | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("scan_logs")
      .insert({
        ticket_id: ticketId,
        scanned_by_user_id: scannedByUserId,
        result,
      })
      .select("scan_id, ticket_id, scanned_by_user_id, result, scanned_at")
      .single();

    if (error) {
      logger.error({
        fn: "insertScanLog",
        message: "Failed to insert scan log",
        meta: error.message,
      });
      return null;
    }

    return data as ScanLog;
  } catch {
    return null;
  }
}
