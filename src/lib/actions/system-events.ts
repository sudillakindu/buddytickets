// lib/actions/system-events.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemEventRow,
  SystemActionResult,
  SystemListResult,
} from "@/lib/types/system";
import type { EventStatus } from "@/lib/types/event";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session?.sub || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getSystemEvents(
  statusFilter: "ALL" | EventStatus = "ALL",
  search: string = "",
  page: number = 1,
  pageSize: number = 10,
): Promise<SystemListResult<SystemEventRow>> {
  try {
    const userId = await requireSystem();
    if (!userId) {
      return { success: false, message: "Unauthorized.", data: [], total: 0 };
    }

    const db = getSupabaseAdmin();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = db
      .from("events")
      .select(
        "event_id, name, subtitle, location, start_at, end_at, status, is_active, created_at, organizer:users!events_organizer_id_fkey(user_id, name, email), category:categories!events_category_id_fkey(name)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (statusFilter !== "ALL") {
      query = query.eq("status", statusFilter);
    }

    if (search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getSystemEvents",
        message: "Failed to fetch events",
        meta: error.message,
      });
      return { success: false, message: "Failed to fetch events.", data: [], total: 0 };
    }

    // Normalize joined relations (Supabase returns single-row FK as object or array)
    const rows: SystemEventRow[] = (data ?? []).map((e) => ({
      ...e,
      organizer: Array.isArray(e.organizer) ? e.organizer[0] : e.organizer,
      category: Array.isArray(e.category) ? e.category[0] : e.category,
    }));

    return {
      success: true,
      message: "Events loaded.",
      data: rows,
      total: count ?? 0,
    };
  } catch (err) {
    logger.error({
      fn: "getSystemEvents",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error.", data: [], total: 0 };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function toggleEventActive(
  eventId: string,
  isActive: boolean,
): Promise<SystemActionResult> {
  try {
    const adminId = await requireSystem();
    if (!adminId) {
      return { success: false, message: "Unauthorized." };
    }

    const db = getSupabaseAdmin();
    const { error } = await db
      .from("events")
      .update({ is_active: isActive })
      .eq("event_id", eventId);

    if (error) {
      logger.error({
        fn: "toggleEventActive",
        message: "Failed to update event",
        meta: error.message,
      });
      return { success: false, message: "Failed to update event." };
    }

    return {
      success: true,
      message: isActive ? "Event enabled." : "Event disabled.",
    };
  } catch (err) {
    logger.error({
      fn: "toggleEventActive",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error." };
  }
}
