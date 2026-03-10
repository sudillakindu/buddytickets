// lib/actions/system-events.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemActionResult,
  SystemEvent,
  GetEventsResult,
} from "@/lib/types/system";
import type { EventStatus } from "@/lib/types/event";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Get Events ──────────────────────────────────────────────────────────────

export async function getSystemEvents(filters?: {
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
}): Promise<GetEventsResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized", events: [] };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("events")
      .select(
        "event_id, name, status, start_at, is_active, is_vip, users!inner ( name )",
      )
      .order("start_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.startDate) {
      query = query.gte("start_at", filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte("start_at", filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ fn: "getSystemEvents", message: error.message });
      return { success: false, message: "Failed to fetch events", events: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: SystemEvent[] = (data ?? []).map((row: any) => ({
      event_id: row.event_id,
      name: row.name,
      organizer_name: row.users?.name ?? "",
      status: row.status,
      start_at: row.start_at,
      is_active: row.is_active,
      is_vip: row.is_vip,
    }));

    return { success: true, message: "Events fetched", events };
  } catch (err) {
    logger.error({ fn: "getSystemEvents", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error", events: [] };
  }
}

// ─── Toggle Event Active ─────────────────────────────────────────────────────

export async function toggleEventActive(
  eventId: string,
  isActive: boolean,
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("events")
      .update({ is_active: isActive })
      .eq("event_id", eventId);

    if (error) {
      logger.error({ fn: "toggleEventActive", message: error.message });
      return { success: false, message: "Failed to update event" };
    }

    return {
      success: true,
      message: `Event ${isActive ? "activated" : "deactivated"}`,
    };
  } catch (err) {
    logger.error({ fn: "toggleEventActive", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Toggle VIP ──────────────────────────────────────────────────────────────

export async function toggleEventVip(
  eventId: string,
  isVip: boolean,
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const admin = getSupabaseAdmin();
    // The DB trigger `trigger_vip_status_change` handles vip_events table
    const { error } = await admin
      .from("events")
      .update({ is_vip: isVip })
      .eq("event_id", eventId);

    if (error) {
      logger.error({ fn: "toggleEventVip", message: error.message });
      return { success: false, message: "Failed to update VIP status" };
    }

    return {
      success: true,
      message: `Event ${isVip ? "marked as VIP" : "removed from VIP"}`,
    };
  } catch (err) {
    logger.error({ fn: "toggleEventVip", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}
