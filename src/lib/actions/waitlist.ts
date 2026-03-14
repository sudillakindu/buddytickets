"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  WaitlistEntry,
  JoinWaitlistInput,
  JoinWaitlistResult,
  GetWaitlistResult,
  NotifyWaitlistResult,
} from "@/lib/types/waitlist";

// --- Join a waitlist for a sold-out event ---

export async function joinWaitlist(
  input: JoinWaitlistInput,
): Promise<JoinWaitlistResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Please sign in to join the waitlist." };

  const { event_id, ticket_type_id, notify_email } = input;
  if (!event_id || !notify_email?.trim())
    return { success: false, message: "Event ID and email are required." };

  try {
    // --- Check if user is already on the waitlist ---
    let existingQuery = getSupabaseAdmin()
      .from("waitlists")
      .select("waitlist_id")
      .eq("event_id", event_id)
      .eq("user_id", session.sub)
      .in("status", ["WAITING", "NOTIFIED"]);

    existingQuery = ticket_type_id
      ? existingQuery.eq("ticket_type_id", ticket_type_id)
      : existingQuery.is("ticket_type_id", null);

    const { data: existing, error: existErr } = await existingQuery.maybeSingle();

    if (existErr) throw existErr;
    if (existing)
      return { success: false, message: "You are already on the waitlist." };

    // --- Calculate next position in queue ---
    let posQuery = getSupabaseAdmin()
      .from("waitlists")
      .select("position_order")
      .eq("event_id", event_id)
      .order("position_order", { ascending: false })
      .limit(1);

    posQuery = ticket_type_id
      ? posQuery.eq("ticket_type_id", ticket_type_id)
      : posQuery.is("ticket_type_id", null);

    const { data: lastPosition, error: posErr } = await posQuery.maybeSingle();
    if (posErr) throw posErr;

    const nextPosition = (lastPosition?.position_order ?? 0) + 1;

    // --- Insert waitlist entry ---
    const { data: entry, error: insertErr } = await getSupabaseAdmin()
      .from("waitlists")
      .insert({
        event_id,
        ticket_type_id: ticket_type_id ?? null,
        user_id: session.sub,
        notify_email: notify_email.trim(),
        position_order: nextPosition,
        status: "WAITING",
      })
      .select(
        "waitlist_id, event_id, ticket_type_id, user_id, notify_email, position_order, status, notified_at, converted_order_id, created_at, updated_at",
      )
      .single();

    if (insertErr) throw insertErr;

    return {
      success: true,
      message: `You've been added to the waitlist at position ${nextPosition}.`,
      entry: entry as WaitlistEntry,
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

export async function getUserWaitlistEntries(): Promise<GetWaitlistResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("waitlists")
      .select(
        "waitlist_id, event_id, ticket_type_id, user_id, notify_email, position_order, status, notified_at, converted_order_id, created_at, updated_at",
      )
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "Waitlist entries loaded.",
      entries: (data ?? []) as WaitlistEntry[],
    };
  } catch (err) {
    logger.error({
      fn: "getUserWaitlistEntries",
      message: "Error fetching waitlist entries",
      meta: err,
    });
    return { success: false, message: "Failed to load waitlist entries." };
  }
}

// --- Notify waitlisted users when tickets become available ---

export async function notifyWaitlistUsers(
  eventId: string,
  ticketTypeId?: string,
): Promise<NotifyWaitlistResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  if (!eventId)
    return { success: false, message: "Event ID is required." };

  try {
    // --- Find WAITING entries in position order ---
    let query = getSupabaseAdmin()
      .from("waitlists")
      .select(
        "waitlist_id, user_id, notify_email, position_order",
      )
      .eq("event_id", eventId)
      .eq("status", "WAITING")
      .order("position_order", { ascending: true });

    if (ticketTypeId) {
      query = query.eq("ticket_type_id", ticketTypeId);
    }

    const { data: entries, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;

    if (!entries || entries.length === 0) {
      return { success: true, message: "No users on the waitlist.", notified_count: 0 };
    }

    // --- Mark entries as NOTIFIED ---
    const waitlistIds = entries.map((e) => e.waitlist_id);
    const { error: updateErr } = await getSupabaseAdmin()
      .from("waitlists")
      .update({
        status: "NOTIFIED",
        notified_at: new Date().toISOString(),
      })
      .in("waitlist_id", waitlistIds);

    if (updateErr) throw updateErr;

    return {
      success: true,
      message: `${entries.length} user(s) notified.`,
      notified_count: entries.length,
    };
  } catch (err) {
    logger.error({
      fn: "notifyWaitlistUsers",
      message: "Error notifying waitlist users",
      meta: err,
    });
    return { success: false, message: "Failed to notify waitlist users." };
  }
}

// --- Convert a waitlist entry when a user purchases tickets ---

export async function convertWaitlistEntry(
  waitlistId: string,
  orderId: string,
): Promise<{ success: boolean; message: string }> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };

  if (!waitlistId || !orderId)
    return { success: false, message: "Waitlist ID and order ID are required." };

  try {
    const { error } = await getSupabaseAdmin()
      .from("waitlists")
      .update({
        status: "CONVERTED",
        converted_order_id: orderId,
      })
      .eq("waitlist_id", waitlistId)
      .eq("user_id", session.sub)
      .in("status", ["WAITING", "NOTIFIED"]);

    if (error) throw error;

    return { success: true, message: "Waitlist entry converted." };
  } catch (err) {
    logger.error({
      fn: "convertWaitlistEntry",
      message: "Error converting waitlist entry",
      meta: err,
    });
    return { success: false, message: "Failed to convert waitlist entry." };
  }
}
