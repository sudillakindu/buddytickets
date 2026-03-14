"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type { WaitlistStatus } from "@/lib/types/waitlist";

// --- Result Types ---

interface JoinWaitlistResult {
  success: boolean;
  message: string;
}

interface WaitlistEntry {
  waitlist_id: string;
  position_order: number;
  status: WaitlistStatus;
  created_at: string;
}

interface GetWaitlistPositionResult {
  success: boolean;
  message: string;
  entry?: WaitlistEntry | null;
}

// --- Join Waitlist ---

export async function joinWaitlist(
  eventId: string,
  notifyEmail: string,
  ticketTypeId?: string,
): Promise<JoinWaitlistResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "UNAUTHENTICATED" };

  if (!eventId) return { success: false, message: "Event ID is required." };
  if (!notifyEmail.trim())
    return { success: false, message: "Email address is required." };

  try {
    const { data: event, error: evErr } = await getSupabaseAdmin()
      .from("events")
      .select("event_id, status")
      .eq("event_id", eventId)
      .maybeSingle();

    if (evErr) throw evErr;
    if (!event) return { success: false, message: "Event not found." };
    if (event.status !== "SOLD_OUT")
      return {
        success: false,
        message: "Waitlist is only available for sold-out events.",
      };

    const existingQuery = getSupabaseAdmin()
      .from("waitlists")
      .select("waitlist_id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("user_id", session.sub);

    if (ticketTypeId) {
      existingQuery.eq("ticket_type_id", ticketTypeId);
    } else {
      existingQuery.is("ticket_type_id", null);
    }

    const { count, error: existErr } = await existingQuery;
    if (existErr) throw existErr;
    if ((count ?? 0) > 0)
      return {
        success: false,
        message: "You are already on the waitlist for this event.",
      };

    const { data: maxPos, error: maxErr } = await getSupabaseAdmin()
      .from("waitlists")
      .select("position_order")
      .eq("event_id", eventId)
      .order("position_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) throw maxErr;
    const nextPosition = (maxPos?.position_order ?? 0) + 1;

    const { error: insertErr } = await getSupabaseAdmin()
      .from("waitlists")
      .insert({
        event_id: eventId,
        ticket_type_id: ticketTypeId ?? null,
        user_id: session.sub,
        notify_email: notifyEmail.trim(),
        position_order: nextPosition,
        status: "WAITING",
      });

    if (insertErr) throw insertErr;

    return {
      success: true,
      message: `You're #${nextPosition} on the waitlist! We'll notify you at ${notifyEmail.trim()}.`,
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

// --- Get Waitlist Position ---

export async function getWaitlistPosition(
  eventId: string,
): Promise<GetWaitlistPositionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "UNAUTHENTICATED" };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("waitlists")
      .select("waitlist_id, position_order, status, created_at")
      .eq("event_id", eventId)
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return {
      success: true,
      message: "OK",
      entry: data
        ? {
            waitlist_id: data.waitlist_id,
            position_order: data.position_order,
            status: data.status as WaitlistStatus,
            created_at: data.created_at,
          }
        : null,
    };
  } catch (err) {
    logger.error({
      fn: "getWaitlistPosition",
      message: "Error fetching waitlist position",
      meta: err,
    });
    return { success: false, message: "Failed to check waitlist status." };
  }
}
