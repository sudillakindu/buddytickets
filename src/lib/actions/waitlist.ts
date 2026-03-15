"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  WaitlistEntry,
  WaitlistResult,
  WaitlistPositionResult,
} from "@/lib/types/waitlist";

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

interface MaxPositionRow {
  position_order: number;
}

// --- Join Waitlist ---
export async function joinWaitlist(
  eventId: string,
  notifyEmail: string,
): Promise<WaitlistResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!eventId) return { success: false, message: "Event ID required." };
  if (!notifyEmail) return { success: false, message: "Email required." };

  try {
    const supabase = getSupabaseAdmin();

    // Check if user is already on the waitlist for this event
    const { data: existing, error: existErr } = await supabase
      .from("waitlists")
      .select("waitlist_id")
      .eq("event_id", eventId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (existErr) throw existErr;
    if (existing) {
      return { success: false, message: "Already on the waitlist." };
    }

    // Get max position_order for the event
    const { data: maxRow, error: maxErr } = await supabase
      .from("waitlists")
      .select("position_order")
      .eq("event_id", eventId)
      .order("position_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) throw maxErr;

    const nextPosition =
      ((maxRow as unknown as MaxPositionRow)?.position_order ?? 0) + 1;

    // Insert waitlist entry
    const { data: entry, error: insertErr } = await supabase
      .from("waitlists")
      .insert({
        event_id: eventId,
        user_id: session.sub,
        notify_email: notifyEmail,
        position_order: nextPosition,
        status: "WAITING",
      })
      .select("*")
      .single();

    if (insertErr) throw insertErr;

    return {
      success: true,
      message: `Joined waitlist at position ${nextPosition}.`,
      entry: entry as unknown as WaitlistEntry,
    };
  } catch (err) {
    logger.error({ fn: "joinWaitlist", message: "Error", meta: err });
    return { success: false, message: "Failed to join waitlist." };
  }
}

// --- Get Waitlist Position ---
export async function getWaitlistPosition(
  eventId: string,
): Promise<WaitlistPositionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!eventId) return { success: false, message: "Event ID required." };

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("waitlists")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, message: "Not on the waitlist." };

    const typed = data as unknown as WaitlistRow;

    const { count, error: countErr } = await supabase
      .from("waitlists")
      .select("waitlist_id", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (countErr) throw countErr;

    return {
      success: true,
      message: "Position found.",
      position: typed.position_order,
      total: count ?? 0,
    };
  } catch (err) {
    logger.error({ fn: "getWaitlistPosition", message: "Error", meta: err });
    return { success: false, message: "Failed to get waitlist position." };
  }
}

// --- Get Event Waitlist Count (Public) ---
export async function getEventWaitlistCount(
  eventId: string,
): Promise<{ success: boolean; message: string; count?: number }> {
  if (!eventId) return { success: false, message: "Event ID required." };

  try {
    const { count, error } = await getSupabaseAdmin()
      .from("waitlists")
      .select("waitlist_id", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (error) throw error;

    return {
      success: true,
      message: "Count retrieved.",
      count: count ?? 0,
    };
  } catch (err) {
    logger.error({
      fn: "getEventWaitlistCount",
      message: "Error",
      meta: err,
    });
    return { success: false, message: "Failed to get waitlist count." };
  }
}
