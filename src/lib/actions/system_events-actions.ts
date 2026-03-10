// lib/actions/system_events-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  PaginatedResult,
  ActionResult,
  SystemEvent,
  EventStatus,
} from "@/lib/types/system";

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getEvents(filters: {
  status?: EventStatus;
  organizer_id?: string;
  category_id?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResult<SystemEvent>> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = await createClient();

    let query = supabase
      .from("events")
      .select(
        "*, users:organizer_id(name), categories:category_id(name), ticket_types(qty_sold), event_images(image_url, priority_order)",
        { count: "exact" },
      );

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.organizer_id) {
      query = query.eq("organizer_id", filters.organizer_id);
    }

    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters.search) {
      const term = filters.search.trim();
      if (term) {
        query = query.ilike("name", `%${term}%`);
      }
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getEvents",
        message: "DB fetch error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load events." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: SystemEvent[] = (data ?? []).map((row: any) => {
      const ticketsSold = (row.ticket_types ?? []).reduce(
        (sum: number, tt: { qty_sold: number }) => sum + (tt.qty_sold ?? 0),
        0,
      );

      const sortedImages = [...(row.event_images ?? [])].sort(
        (a: { priority_order: number }, b: { priority_order: number }) =>
          (a.priority_order ?? 0) - (b.priority_order ?? 0),
      );

      return {
        event_id: row.event_id,
        organizer_id: row.organizer_id,
        category_id: row.category_id,
        name: row.name,
        subtitle: row.subtitle,
        location: row.location,
        start_at: row.start_at,
        end_at: row.end_at,
        status: row.status,
        is_active: row.is_active,
        is_vip: row.is_vip,
        platform_fee_type: row.platform_fee_type,
        platform_fee_value: row.platform_fee_value,
        platform_fee_cap: row.platform_fee_cap,
        allowed_payment_methods: row.allowed_payment_methods,
        created_at: row.created_at,
        updated_at: row.updated_at,
        organizer_name: row.users?.name ?? "Unknown",
        category_name: row.categories?.name ?? "Unknown",
        tickets_sold: ticketsSold,
        thumbnail_image: sortedImages[0]?.image_url ?? null,
      };
    });

    return {
      success: true,
      message: "Events loaded.",
      data: events,
      total_count: count ?? 0,
      page,
      per_page: perPage,
    };
  } catch (err) {
    logger.error({
      fn: "getEvents",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function toggleEventActive(
  eventId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { data: event, error: fetchErr } = await admin
      .from("events")
      .select("is_active")
      .eq("event_id", eventId)
      .maybeSingle();

    if (fetchErr || !event) {
      if (fetchErr)
        logger.error({
          fn: "toggleEventActive",
          message: "DB fetch error",
          meta: fetchErr.message,
        });
      return { success: false, message: "Event not found." };
    }

    const { error: updateErr } = await admin
      .from("events")
      .update({ is_active: !event.is_active })
      .eq("event_id", eventId);

    if (updateErr) {
      logger.error({
        fn: "toggleEventActive",
        message: "DB update error",
        meta: updateErr.message,
      });
      return { success: false, message: "Failed to update event status." };
    }

    return {
      success: true,
      message: event.is_active ? "Event deactivated." : "Event activated.",
    };
  } catch (err) {
    logger.error({
      fn: "toggleEventActive",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function toggleEventVip(eventId: string): Promise<ActionResult> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { data: event, error: fetchErr } = await admin
      .from("events")
      .select("is_vip")
      .eq("event_id", eventId)
      .maybeSingle();

    if (fetchErr || !event) {
      if (fetchErr)
        logger.error({
          fn: "toggleEventVip",
          message: "DB fetch error",
          meta: fetchErr.message,
        });
      return { success: false, message: "Event not found." };
    }

    const { error: updateErr } = await admin
      .from("events")
      .update({ is_vip: !event.is_vip })
      .eq("event_id", eventId);

    if (updateErr) {
      logger.error({
        fn: "toggleEventVip",
        message: "DB update error",
        meta: updateErr.message,
      });
      return { success: false, message: "Failed to update VIP status." };
    }

    return {
      success: true,
      message: event.is_vip
        ? "Event removed from VIP."
        : "Event marked as VIP.",
    };
  } catch (err) {
    logger.error({
      fn: "toggleEventVip",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function cancelEvent(eventId: string): Promise<ActionResult> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("events")
      .update({ status: "CANCELLED" })
      .eq("event_id", eventId);

    if (error) {
      logger.error({
        fn: "cancelEvent",
        message: "DB update error",
        meta: error.message,
      });
      return { success: false, message: "Failed to cancel event." };
    }

    return { success: true, message: "Event cancelled." };
  } catch (err) {
    logger.error({
      fn: "cancelEvent",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}
