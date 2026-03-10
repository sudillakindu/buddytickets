// lib/actions/organizer_events-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ActionResult,
  ActionResultWithData,
  PaginatedResult,
  OrganizerEvent,
  OrganizerEventDetail,
  CreateEventInput,
  UpdateEventInput,
  CategoryOption,
  EventStatus,
  OrganizerVerificationStatus,
} from "@/lib/types/organizer_dashboard";

async function requireOrganizer(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session.sub;
}

// ─── Read Queries ────────────────────────────────────────────────────────────

export async function getOrganizerStatus(): Promise<
  ActionResultWithData<{ status: OrganizerVerificationStatus; remarks: string | null }>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organizer_details")
      .select("status, remarks")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.error({ fn: "getOrganizerStatus", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load status." };
    }

    if (!data) {
      return {
        success: true,
        message: "No organizer record found.",
        data: { status: "PENDING" as OrganizerVerificationStatus, remarks: null },
      };
    }

    return {
      success: true,
      message: "Status loaded.",
      data: { status: data.status as OrganizerVerificationStatus, remarks: data.remarks },
    };
  } catch (err) {
    logger.error({ fn: "getOrganizerStatus", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getActiveCategories(): Promise<
  ActionResultWithData<CategoryOption[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("category_id, name")
      .eq("is_active", true)
      .order("name");

    if (error) {
      logger.error({ fn: "getActiveCategories", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load categories." };
    }

    return { success: true, message: "Categories loaded.", data: data ?? [] };
  } catch (err) {
    logger.error({ fn: "getActiveCategories", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getEvents(filters: {
  status?: EventStatus;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResult<OrganizerEvent>> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();
    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("events")
      .select(
        "event_id, name, subtitle, category_id, location, start_at, end_at, status, is_active, is_vip, created_at",
        { count: "exact" },
      )
      .eq("organizer_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    const { data: events, error, count } = await query;

    if (error) {
      logger.error({ fn: "getEvents", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load events." };
    }

    // Get category names
    const catIds = [...new Set((events ?? []).map((e) => e.category_id))];
    const eventIds = (events ?? []).map((e) => e.event_id);

    const [{ data: cats }, { data: ticketData }, { data: revenueData }] = await Promise.all([
      catIds.length > 0
        ? supabase.from("categories").select("category_id, name").in("category_id", catIds)
        : Promise.resolve({ data: [] as { category_id: string; name: string }[] }),
      eventIds.length > 0
        ? supabase.from("ticket_types").select("event_id, qty_sold, capacity").in("event_id", eventIds)
        : Promise.resolve({ data: [] as { event_id: string; qty_sold: number; capacity: number }[] }),
      eventIds.length > 0
        ? supabase.from("orders").select("event_id, final_amount").in("event_id", eventIds).eq("payment_status", "PAID")
        : Promise.resolve({ data: [] as { event_id: string; final_amount: number }[] }),
    ]);

    const catMap = new Map((cats ?? []).map((c) => [c.category_id, c.name]));

    // Aggregate tickets
    const ticketMap = new Map<string, { sold: number; cap: number }>();
    for (const t of ticketData ?? []) {
      const row = t as { event_id: string; qty_sold: number; capacity: number };
      const cur = ticketMap.get(row.event_id) ?? { sold: 0, cap: 0 };
      cur.sold += row.qty_sold ?? 0;
      cur.cap += row.capacity ?? 0;
      ticketMap.set(row.event_id, cur);
    }

    // Aggregate revenue
    const revMap = new Map<string, number>();
    for (const o of revenueData ?? []) {
      const row = o as { event_id: string; final_amount: number };
      revMap.set(row.event_id, (revMap.get(row.event_id) ?? 0) + Number(row.final_amount));
    }

    const result: OrganizerEvent[] = (events ?? []).map((e) => ({
      event_id: e.event_id,
      name: e.name,
      subtitle: e.subtitle,
      category_name: catMap.get(e.category_id) ?? "Unknown",
      location: e.location,
      start_at: e.start_at,
      end_at: e.end_at,
      status: e.status as EventStatus,
      is_active: e.is_active,
      is_vip: e.is_vip,
      tickets_sold: ticketMap.get(e.event_id)?.sold ?? 0,
      total_capacity: ticketMap.get(e.event_id)?.cap ?? 0,
      revenue: revMap.get(e.event_id) ?? 0,
      created_at: e.created_at,
    }));

    return {
      success: true,
      message: "Events loaded.",
      data: result,
      total_count: count ?? 0,
      page,
      per_page: perPage,
    };
  } catch (err) {
    logger.error({ fn: "getEvents", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getEventDetail(
  eventId: string,
): Promise<ActionResultWithData<OrganizerEventDetail>> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("event_id", eventId)
      .eq("organizer_id", userId)
      .maybeSingle();

    if (error) {
      logger.error({ fn: "getEventDetail", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load event." };
    }
    if (!data) {
      return { success: false, message: "Event not found." };
    }

    return { success: true, message: "Event loaded.", data: data as OrganizerEventDetail };
  } catch (err) {
    logger.error({ fn: "getEventDetail", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createEvent(
  input: CreateEventInput,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    // Check organizer is approved
    const admin = getSupabaseAdmin();
    const { data: orgDetails } = await admin
      .from("organizer_details")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle();

    if (!orgDetails || orgDetails.status !== "APPROVED") {
      return {
        success: false,
        message: "Your organizer account must be approved before creating events.",
      };
    }

    // Validate input
    if (!input.name?.trim()) return { success: false, message: "Event name is required." };
    if (!input.subtitle?.trim()) return { success: false, message: "Subtitle is required." };
    if (!input.description?.trim()) return { success: false, message: "Description is required." };
    if (!input.category_id) return { success: false, message: "Category is required." };
    if (!input.location?.trim()) return { success: false, message: "Location is required." };
    if (!input.map_link?.trim()) return { success: false, message: "Map link is required." };
    if (!input.start_at) return { success: false, message: "Start date is required." };
    if (!input.end_at) return { success: false, message: "End date is required." };

    if (new Date(input.end_at) <= new Date(input.start_at)) {
      return { success: false, message: "End date must be after start date." };
    }

    const { error } = await admin.from("events").insert({
      organizer_id: userId,
      category_id: input.category_id,
      name: input.name.trim(),
      subtitle: input.subtitle.trim(),
      description: input.description.trim(),
      requirements: input.requirements?.trim() || null,
      location: input.location.trim(),
      map_link: input.map_link.trim(),
      start_at: input.start_at,
      end_at: input.end_at,
      status: "DRAFT",
      is_active: false,
      allowed_payment_methods: input.allowed_payment_methods?.length
        ? input.allowed_payment_methods
        : null,
    });

    if (error) {
      logger.error({ fn: "createEvent", message: "DB insert error", meta: error.message });
      if (error.code === "23505") {
        return { success: false, message: "An event with this name already exists." };
      }
      return { success: false, message: "Failed to create event." };
    }

    revalidatePath("/dashboard/organizer-events");
    revalidatePath("/dashboard/organizer-overview");
    return { success: true, message: "Event created successfully." };
  } catch (err) {
    logger.error({ fn: "createEvent", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function updateEvent(
  input: UpdateEventInput,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    // Verify ownership and editable status
    const { data: existing } = await admin
      .from("events")
      .select("status, organizer_id")
      .eq("event_id", input.event_id)
      .maybeSingle();

    if (!existing || existing.organizer_id !== userId) {
      return { success: false, message: "Event not found." };
    }

    if (existing.status !== "DRAFT" && existing.status !== "PUBLISHED") {
      return {
        success: false,
        message: "Events can only be edited in DRAFT or PUBLISHED status.",
      };
    }

    // Validate
    if (!input.name?.trim()) return { success: false, message: "Event name is required." };
    if (!input.subtitle?.trim()) return { success: false, message: "Subtitle is required." };
    if (!input.description?.trim()) return { success: false, message: "Description is required." };
    if (!input.category_id) return { success: false, message: "Category is required." };
    if (!input.location?.trim()) return { success: false, message: "Location is required." };
    if (!input.map_link?.trim()) return { success: false, message: "Map link is required." };
    if (new Date(input.end_at) <= new Date(input.start_at)) {
      return { success: false, message: "End date must be after start date." };
    }

    const { error } = await admin
      .from("events")
      .update({
        category_id: input.category_id,
        name: input.name.trim(),
        subtitle: input.subtitle.trim(),
        description: input.description.trim(),
        requirements: input.requirements?.trim() || null,
        location: input.location.trim(),
        map_link: input.map_link.trim(),
        start_at: input.start_at,
        end_at: input.end_at,
        allowed_payment_methods: input.allowed_payment_methods?.length
          ? input.allowed_payment_methods
          : null,
      })
      .eq("event_id", input.event_id)
      .eq("organizer_id", userId);

    if (error) {
      logger.error({ fn: "updateEvent", message: "DB update error", meta: error.message });
      if (error.code === "23505") {
        return { success: false, message: "An event with this name already exists." };
      }
      return { success: false, message: "Failed to update event." };
    }

    revalidatePath("/dashboard/organizer-events");
    revalidatePath("/dashboard/organizer-overview");
    return { success: true, message: "Event updated successfully." };
  } catch (err) {
    logger.error({ fn: "updateEvent", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function publishEvent(eventId: string): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { data: event } = await admin
      .from("events")
      .select("status, organizer_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (!event || event.organizer_id !== userId) {
      return { success: false, message: "Event not found." };
    }

    if (event.status !== "DRAFT") {
      return { success: false, message: "Only DRAFT events can be published." };
    }

    // Must have at least 1 active ticket type
    const { count } = await admin
      .from("ticket_types")
      .select("ticket_type_id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("is_active", true);

    if (!count || count === 0) {
      return {
        success: false,
        message: "Add at least one active ticket type before publishing.",
      };
    }

    const { error } = await admin
      .from("events")
      .update({ status: "PUBLISHED", is_active: true })
      .eq("event_id", eventId)
      .eq("organizer_id", userId);

    if (error) {
      logger.error({ fn: "publishEvent", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to publish event." };
    }

    revalidatePath("/dashboard/organizer-events");
    revalidatePath("/dashboard/organizer-overview");
    return { success: true, message: "Event published." };
  } catch (err) {
    logger.error({ fn: "publishEvent", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function toggleOnSale(eventId: string): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { data: event } = await admin
      .from("events")
      .select("status, organizer_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (!event || event.organizer_id !== userId) {
      return { success: false, message: "Event not found." };
    }

    if (event.status !== "PUBLISHED" && event.status !== "ON_SALE") {
      return {
        success: false,
        message: "Only PUBLISHED or ON_SALE events can be toggled.",
      };
    }

    const newStatus = event.status === "PUBLISHED" ? "ON_SALE" : "PUBLISHED";

    const { error } = await admin
      .from("events")
      .update({ status: newStatus })
      .eq("event_id", eventId)
      .eq("organizer_id", userId);

    if (error) {
      logger.error({ fn: "toggleOnSale", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to update event." };
    }

    revalidatePath("/dashboard/organizer-events");
    revalidatePath("/dashboard/organizer-overview");
    return {
      success: true,
      message: newStatus === "ON_SALE" ? "Ticket sales enabled." : "Ticket sales paused.",
    };
  } catch (err) {
    logger.error({ fn: "toggleOnSale", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function cancelEvent(eventId: string): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { data: event } = await admin
      .from("events")
      .select("status, organizer_id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (!event || event.organizer_id !== userId) {
      return { success: false, message: "Event not found." };
    }

    const cancellable: EventStatus[] = ["DRAFT", "PUBLISHED", "ON_SALE"];
    if (!cancellable.includes(event.status as EventStatus)) {
      return { success: false, message: "This event cannot be cancelled." };
    }

    const { error } = await admin
      .from("events")
      .update({ status: "CANCELLED", is_active: false })
      .eq("event_id", eventId)
      .eq("organizer_id", userId);

    if (error) {
      logger.error({ fn: "cancelEvent", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to cancel event." };
    }

    revalidatePath("/dashboard/organizer-events");
    revalidatePath("/dashboard/organizer-overview");
    return { success: true, message: "Event cancelled." };
  } catch (err) {
    logger.error({ fn: "cancelEvent", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}
