"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  WaitlistEntry,
  JoinWaitlistInput,
  WaitlistActionResult,
  WaitlistListResult,
} from "@/lib/types/waitlist";

// --- Row shape returned by Supabase ---
interface WaitlistRow {
  waitlist_id: string;
  event_id: string;
  ticket_type_id: string | null;
  user_id: string;
  notify_email: string;
  position_order: number;
  status: WaitlistEntry["status"];
  notified_at: string | null;
  converted_order_id: string | null;
  created_at: string;
  updated_at: string | null;
}

function mapRowToWaitlist(row: WaitlistRow): WaitlistEntry {
  return {
    waitlist_id: row.waitlist_id,
    event_id: row.event_id,
    ticket_type_id: row.ticket_type_id,
    user_id: row.user_id,
    notify_email: row.notify_email,
    position_order: row.position_order,
    status: row.status,
    notified_at: row.notified_at,
    converted_order_id: row.converted_order_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const WAITLIST_SELECT =
  "waitlist_id, event_id, ticket_type_id, user_id, notify_email, position_order, status, notified_at, converted_order_id, created_at, updated_at";

// --- Join the waitlist for a sold-out event ---
export async function joinWaitlist(
  input: JoinWaitlistInput,
): Promise<WaitlistActionResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    if (!input.event_id)
      return { success: false, message: "Event ID is required." };
    if (!input.notify_email.trim())
      return { success: false, message: "Notification email is required." };

    // Verify event exists and is sold out
    const { data: event, error: eventErr } = await getSupabaseAdmin()
      .from("events")
      .select("event_id, status")
      .eq("event_id", input.event_id)
      .maybeSingle();

    if (eventErr) throw eventErr;
    if (!event) return { success: false, message: "Event not found." };
    if (event.status !== "SOLD_OUT")
      return {
        success: false,
        message: "Waitlist is only available for sold-out events.",
      };

    // Calculate next position in queue
    const { data: maxPos, error: posErr } = await getSupabaseAdmin()
      .from("waitlists")
      .select("position_order")
      .eq("event_id", input.event_id)
      .eq("status", "WAITING")
      .order("position_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (posErr) throw posErr;

    const nextPosition = (maxPos?.position_order ?? 0) + 1;

    const { data: entry, error: insertErr } = await getSupabaseAdmin()
      .from("waitlists")
      .insert({
        event_id: input.event_id,
        ticket_type_id: input.ticket_type_id ?? null,
        user_id: session.sub,
        notify_email: input.notify_email.trim(),
        position_order: nextPosition,
        status: "WAITING",
      })
      .select(WAITLIST_SELECT)
      .single();

    if (insertErr) {
      // Handle unique constraint violation (user already on waitlist)
      if (insertErr.code === "23505")
        return {
          success: false,
          message: "You are already on the waitlist for this event.",
        };
      throw insertErr;
    }

    return {
      success: true,
      message: `You are #${nextPosition} on the waitlist. We'll notify you when tickets become available.`,
      entry: mapRowToWaitlist(entry as WaitlistRow),
    };
  } catch (err) {
    logger.error({
      fn: "joinWaitlist",
      message: "Error joining waitlist",
      meta: err,
    });
    return { success: false, message: "Failed to join waitlist." };
  }
}

// --- Get user's waitlist entries ---
export async function getUserWaitlistEntries(): Promise<WaitlistListResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await getSupabaseAdmin()
      .from("waitlists")
      .select(WAITLIST_SELECT)
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const entries = ((data ?? []) as WaitlistRow[]).map(mapRowToWaitlist);
    return { success: true, message: "Waitlist entries loaded.", entries };
  } catch (err) {
    logger.error({
      fn: "getUserWaitlistEntries",
      message: "Error fetching waitlist entries",
      meta: err,
    });
    return { success: false, message: "Failed to load waitlist entries." };
  }
}

// --- Get waitlist entries for an event (organizer view) ---
export async function getEventWaitlist(
  eventId: string,
): Promise<WaitlistListResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };
    if (!eventId) return { success: false, message: "Event ID is required." };

    // Verify user is organizer for this event
    const { data: event, error: eventErr } = await getSupabaseAdmin()
      .from("events")
      .select("organizer_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (eventErr) throw eventErr;
    if (!event || event.organizer_id !== session.sub)
      return { success: false, message: "Not authorized for this event." };

    const { data, error } = await getSupabaseAdmin()
      .from("waitlists")
      .select(WAITLIST_SELECT)
      .eq("event_id", eventId)
      .order("position_order", { ascending: true });

    if (error) throw error;

    const entries = ((data ?? []) as WaitlistRow[]).map(mapRowToWaitlist);
    return { success: true, message: "Waitlist loaded.", entries };
  } catch (err) {
    logger.error({
      fn: "getEventWaitlist",
      message: "Error fetching event waitlist",
      meta: err,
    });
    return { success: false, message: "Failed to load event waitlist." };
  }
}
