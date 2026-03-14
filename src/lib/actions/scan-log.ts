"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ScanResult,
  ScanLog,
  ScanTicketResult,
  ScanLogListResult,
} from "@/lib/types/scan-log";

// --- Row shapes returned by Supabase ---
interface TicketScanRow {
  ticket_id: string;
  status: string;
  event_id: string;
  owner_user_id: string;
}

interface ScanLogRow {
  scan_id: number;
  ticket_id: string;
  scanned_by_user_id: string;
  result: ScanResult;
  scanned_at: string;
}

// --- Scan a ticket QR code at the gate ---
export async function scanTicket(
  eventId: string,
  qrHash: string,
): Promise<ScanTicketResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    // Verify scanner is staff for this event
    const { data: staffRow, error: staffErr } = await getSupabaseAdmin()
      .from("event_community")
      .select("user_id")
      .eq("event_id", eventId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (staffErr) throw staffErr;
    if (!staffRow)
      return {
        success: false,
        message: "You are not authorized to scan tickets for this event.",
      };

    // Look up the ticket by QR hash and event
    const { data: ticket, error: ticketErr } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id, status, event_id, owner_user_id")
      .eq("event_id", eventId)
      .eq("qr_hash", qrHash)
      .maybeSingle<TicketScanRow>();

    if (ticketErr) throw ticketErr;

    // Determine scan result
    let result: ScanResult;

    if (!ticket) {
      result = "DENIED_INVALID";
    } else if (ticket.status === "USED") {
      result = "DENIED_ALREADY_USED";
    } else if (ticket.status === "PENDING") {
      result = "DENIED_UNPAID";
    } else if (ticket.status === "CANCELLED") {
      result = "DENIED_INVALID";
    } else {
      result = "ALLOWED";
    }

    // Record the scan log only when ticket exists (FK constraint requires valid ticket_id)
    let scanId: number | undefined;
    if (ticket) {
      const { data: scanLog, error: scanErr } = await getSupabaseAdmin()
        .from("scan_logs")
        .insert({
          ticket_id: ticket.ticket_id,
          scanned_by_user_id: session.sub,
          result,
        })
        .select("scan_id")
        .single();

      if (scanErr) throw scanErr;
      scanId = scanLog.scan_id;
    }

    // If ALLOWED, mark ticket as USED
    if (result === "ALLOWED" && ticket) {
      const { error: updateErr } = await getSupabaseAdmin()
        .from("tickets")
        .update({ status: "USED" })
        .eq("ticket_id", ticket.ticket_id)
        .eq("status", "ACTIVE");

      if (updateErr) {
        logger.error({
          fn: "scanTicket",
          message: "Failed to update ticket status to USED",
          meta: updateErr,
        });
      }
    }

    const allowed = result === "ALLOWED";
    const messageMap: Record<ScanResult, string> = {
      ALLOWED: "Entry allowed. Ticket validated.",
      DENIED_SOLD_OUT: "Entry denied — sold out conflict.",
      DENIED_ALREADY_USED: "Entry denied — ticket already used.",
      DENIED_UNPAID: "Entry denied — payment pending.",
      DENIED_INVALID: "Entry denied — invalid ticket.",
    };

    return {
      success: allowed,
      message: messageMap[result],
      result,
      scan_id: scanId,
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

// --- Get scan logs for an event ---
export async function getScanLogsByEvent(
  eventId: string,
): Promise<ScanLogListResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };
    if (!eventId) return { success: false, message: "Event ID is required." };

    // Verify user is staff or organizer for this event
    const { data: staffRow, error: staffErr } = await getSupabaseAdmin()
      .from("event_community")
      .select("user_id")
      .eq("event_id", eventId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (staffErr) throw staffErr;

    // Also allow event organizer to view scan logs
    if (!staffRow) {
      const { data: eventRow, error: eventErr } = await getSupabaseAdmin()
        .from("events")
        .select("organizer_id")
        .eq("event_id", eventId)
        .maybeSingle();

      if (eventErr) throw eventErr;
      if (!eventRow || eventRow.organizer_id !== session.sub)
        return { success: false, message: "Not authorized for this event." };
    }

    // Fetch scan logs for tickets belonging to this event
    const { data: tickets, error: ticketErr } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id")
      .eq("event_id", eventId);

    if (ticketErr) throw ticketErr;
    if (!tickets || tickets.length === 0)
      return { success: true, message: "No scan logs found.", logs: [] };

    const ticketIds = tickets.map((t) => t.ticket_id);

    const { data, error } = await getSupabaseAdmin()
      .from("scan_logs")
      .select("scan_id, ticket_id, scanned_by_user_id, result, scanned_at")
      .in("ticket_id", ticketIds)
      .order("scanned_at", { ascending: false });

    if (error) throw error;

    const logs: ScanLog[] = ((data ?? []) as ScanLogRow[]).map((row) => ({
      scan_id: row.scan_id,
      ticket_id: row.ticket_id,
      scanned_by_user_id: row.scanned_by_user_id,
      result: row.result,
      scanned_at: row.scanned_at,
    }));

    return { success: true, message: "Scan logs loaded.", logs };
  } catch (err) {
    logger.error({
      fn: "getScanLogsByEvent",
      message: "Error fetching scan logs",
      meta: err,
    });
    return { success: false, message: "Failed to load scan logs." };
  }
}
