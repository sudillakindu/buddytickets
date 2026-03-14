"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  Waitlist,
  WaitlistInsert,
  WaitlistResult,
  WaitlistListResult,
} from "@/lib/types/waitlist";

const WAITLIST_SELECT = `
  waitlist_id, event_id, ticket_type_id, user_id, notify_email,
  position_order, status, notified_at, converted_order_id,
  created_at, updated_at
` as const;

// --- Join the waitlist for an event ---
export async function joinWaitlist(
  input: WaitlistInsert,
): Promise<WaitlistResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    if (!input.event_id) {
      return { success: false, message: "Event ID is required." };
    }

    if (!input.notify_email || input.notify_email.trim().length === 0) {
      return { success: false, message: "Notification email is required." };
    }

    // Calculate next position in waitlist queue
    const { data: maxRow, error: maxErr } = await getSupabaseAdmin()
      .from("waitlists")
      .select("position_order")
      .eq("event_id", input.event_id)
      .is("ticket_type_id", input.ticket_type_id ?? null)
      .order("position_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) throw maxErr;

    const nextPosition = (maxRow?.position_order ?? 0) + 1;

    const { data, error } = await getSupabaseAdmin()
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

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "You are already on the waitlist for this event." };
      }
      throw error;
    }

    return {
      success: true,
      message: "You have been added to the waitlist.",
      waitlist: data as Waitlist,
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

// --- Get waitlist entries for the current user ---
export async function getUserWaitlists(): Promise<WaitlistListResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await getSupabaseAdmin()
      .from("waitlists")
      .select(WAITLIST_SELECT)
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "Waitlist entries loaded.",
      waitlists: (data ?? []) as Waitlist[],
    };
  } catch (err) {
    logger.error({
      fn: "getUserWaitlists",
      message: "Error fetching waitlist entries",
      meta: err,
    });
    return { success: false, message: "Failed to load waitlist entries." };
  }
}

// --- Get waitlist entries for an event ---
export async function getWaitlistByEvent(
  eventId: string,
): Promise<WaitlistListResult> {
  try {
    if (!eventId) {
      return { success: false, message: "Event ID is required." };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("waitlists")
      .select(WAITLIST_SELECT)
      .eq("event_id", eventId)
      .eq("status", "WAITING")
      .order("position_order", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      message: "Waitlist loaded.",
      waitlists: (data ?? []) as Waitlist[],
    };
  } catch (err) {
    logger.error({
      fn: "getWaitlistByEvent",
      message: "Error fetching event waitlist",
      meta: err,
    });
    return { success: false, message: "Failed to load event waitlist." };
  }
}
