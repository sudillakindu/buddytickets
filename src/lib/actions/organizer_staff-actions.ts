// lib/actions/organizer_staff-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ActionResult,
  ActionResultWithData,
  OrganizerStaffMember,
} from "@/lib/types/organizer_dashboard";

async function requireOrganizer(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session.sub;
}

export async function getStaff(): Promise<
  ActionResultWithData<OrganizerStaffMember[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    // Get organizer's events
    const { data: events } = await supabase
      .from("events")
      .select("event_id, name")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No staff.", data: [] };
    }

    const eventMap = new Map((events ?? []).map((e) => [e.event_id, e.name]));

    // Get community assignments
    const { data: assignments, error } = await supabase
      .from("event_community")
      .select("user_id, event_id, assigned_at")
      .in("event_id", eventIds);

    if (error) {
      logger.error({ fn: "getStaff", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load staff." };
    }

    if (!assignments || assignments.length === 0) {
      return { success: true, message: "No staff assigned.", data: [] };
    }

    // Get user details
    const userIds = [...new Set(assignments.map((a) => a.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("user_id, name, username, email")
      .in("user_id", userIds);

    const userMap = new Map(
      (users ?? []).map((u) => [
        u.user_id,
        { name: u.name, username: u.username, email: u.email },
      ]),
    );

    const result: OrganizerStaffMember[] = assignments.map((a) => {
      const user = userMap.get(a.user_id);
      return {
        user_id: a.user_id,
        event_id: a.event_id,
        event_name: eventMap.get(a.event_id) ?? "Unknown",
        name: user?.name ?? "Unknown",
        username: user?.username ?? "",
        email: user?.email ?? "",
        assigned_at: a.assigned_at,
      };
    });

    return { success: true, message: "Staff loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getStaff", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function addStaffToEvent(
  eventId: string,
  staffIdentifier: string,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!staffIdentifier?.trim()) {
      return { success: false, message: "Staff email or username is required." };
    }

    const admin = getSupabaseAdmin();

    // Verify event ownership
    const { data: event } = await admin
      .from("events")
      .select("event_id")
      .eq("event_id", eventId)
      .eq("organizer_id", userId)
      .maybeSingle();

    if (!event) {
      return { success: false, message: "Event not found." };
    }

    // Find staff user by email or username
    const term = staffIdentifier.trim();
    // Use separate safe queries to avoid filter injection
    let staffUser: { user_id: string; role: string } | null = null;
    const { data: byEmail } = await admin
      .from("users")
      .select("user_id, role")
      .eq("email", term)
      .maybeSingle();

    if (byEmail) {
      staffUser = byEmail;
    } else {
      const { data: byUsername } = await admin
        .from("users")
        .select("user_id, role")
        .eq("username", term)
        .maybeSingle();
      staffUser = byUsername;
    }

    if (!staffUser) {
      return { success: false, message: "User not found." };
    }

    if (staffUser.role !== "STAFF") {
      return { success: false, message: "This user does not have the STAFF role." };
    }

    // Check if already assigned
    const { data: existing } = await admin
      .from("event_community")
      .select("user_id")
      .eq("event_id", eventId)
      .eq("user_id", staffUser.user_id)
      .maybeSingle();

    if (existing) {
      return { success: false, message: "Staff member is already assigned to this event." };
    }

    const { error } = await admin.from("event_community").insert({
      event_id: eventId,
      user_id: staffUser.user_id,
    });

    if (error) {
      logger.error({ fn: "addStaffToEvent", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to add staff." };
    }

    revalidatePath("/dashboard/organizer-staff");
    revalidatePath("/dashboard/organizer-overview");
    return { success: true, message: "Staff member added to event." };
  } catch (err) {
    logger.error({ fn: "addStaffToEvent", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function removeStaffFromEvent(
  eventId: string,
  staffUserId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    // Verify event ownership
    const { data: event } = await admin
      .from("events")
      .select("event_id")
      .eq("event_id", eventId)
      .eq("organizer_id", userId)
      .maybeSingle();

    if (!event) {
      return { success: false, message: "Event not found." };
    }

    const { error } = await admin
      .from("event_community")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", staffUserId);

    if (error) {
      logger.error({ fn: "removeStaffFromEvent", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to remove staff." };
    }

    revalidatePath("/dashboard/organizer-staff");
    return { success: true, message: "Staff member removed." };
  } catch (err) {
    logger.error({ fn: "removeStaffFromEvent", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Staff Scan Activity ─────────────────────────────────────────────────────

export interface StaffScanEntry {
  scan_id: number;
  ticket_id: string;
  result: string;
  scanned_at: string;
  event_name: string;
}

export async function getStaffScanActivity(
  staffUserId: string,
): Promise<ActionResultWithData<StaffScanEntry[]>> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    // Get organizer's events
    const { data: events } = await supabase
      .from("events")
      .select("event_id, name")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No scan activity.", data: [] };
    }

    const eventMap = new Map((events ?? []).map((e) => [e.event_id, e.name]));

    // Get scan logs for this staff member
    const { data: logs, error } = await supabase
      .from("scan_logs")
      .select("scan_id, ticket_id, result, scanned_at")
      .eq("scanned_by_user_id", staffUserId)
      .order("scanned_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error({ fn: "getStaffScanActivity", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load scan activity." };
    }

    // Get ticket → event mapping to filter only this organizer's events
    const ticketIds = [...new Set((logs ?? []).map((l) => l.ticket_id))];
    if (ticketIds.length === 0) {
      return { success: true, message: "No scan activity.", data: [] };
    }

    const { data: tickets } = await supabase
      .from("tickets")
      .select("ticket_id, event_id")
      .in("ticket_id", ticketIds);

    const ticketEventMap = new Map(
      (tickets ?? []).map((t) => [t.ticket_id, t.event_id]),
    );

    // Filter logs to only those for organizer's events
    const result: StaffScanEntry[] = (logs ?? [])
      .filter((l) => {
        const eventId = ticketEventMap.get(l.ticket_id);
        return eventId && eventIds.includes(eventId);
      })
      .map((l) => ({
        scan_id: l.scan_id,
        ticket_id: l.ticket_id,
        result: l.result,
        scanned_at: l.scanned_at,
        event_name: eventMap.get(ticketEventMap.get(l.ticket_id) ?? "") ?? "Unknown",
      }));

    return { success: true, message: "Scan activity loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getStaffScanActivity", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}
