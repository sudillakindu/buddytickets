// lib/actions/organizer_ticket-types-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ActionResult,
  ActionResultWithData,
  OrganizerTicketType,
  CreateTicketTypeInput,
  UpdateTicketTypeInput,
} from "@/lib/types/organizer_dashboard";

async function requireOrganizer(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session.sub;
}

/** Verify that an event belongs to this organizer. */
async function verifyEventOwnership(
  eventId: string,
  userId: string,
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("events")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("organizer_id", userId)
    .maybeSingle();
  return !!data;
}

export async function getTicketTypes(
  eventId: string,
): Promise<ActionResultWithData<OrganizerTicketType[]>> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!(await verifyEventOwnership(eventId, userId))) {
      return { success: false, message: "Event not found." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ticket_types")
      .select(
        "ticket_type_id, event_id, name, description, inclusions, price, capacity, qty_sold, sale_start_at, sale_end_at, is_active, created_at",
      )
      .eq("event_id", eventId)
      .order("created_at");

    if (error) {
      logger.error({ fn: "getTicketTypes", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load ticket types." };
    }

    const result: OrganizerTicketType[] = (data ?? []).map((t) => ({
      ticket_type_id: t.ticket_type_id,
      event_id: t.event_id,
      name: t.name,
      description: t.description,
      inclusions: Array.isArray(t.inclusions) ? t.inclusions as string[] : [],
      price: Number(t.price),
      capacity: t.capacity,
      qty_sold: t.qty_sold,
      sale_start_at: t.sale_start_at,
      sale_end_at: t.sale_end_at,
      is_active: t.is_active,
      created_at: t.created_at,
    }));

    return { success: true, message: "Ticket types loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getTicketTypes", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function createTicketType(
  input: CreateTicketTypeInput,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!(await verifyEventOwnership(input.event_id, userId))) {
      return { success: false, message: "Event not found." };
    }

    if (!input.name?.trim()) return { success: false, message: "Name is required." };
    if (!input.description?.trim()) return { success: false, message: "Description is required." };
    if (input.price < 0) return { success: false, message: "Price cannot be negative." };
    if (input.capacity < 1) return { success: false, message: "Capacity must be at least 1." };

    const admin = getSupabaseAdmin();
    const { error } = await admin.from("ticket_types").insert({
      event_id: input.event_id,
      name: input.name.trim(),
      description: input.description.trim(),
      inclusions: JSON.stringify(input.inclusions ?? []),
      price: input.price,
      capacity: input.capacity,
      sale_start_at: input.sale_start_at || null,
      sale_end_at: input.sale_end_at || null,
    });

    if (error) {
      logger.error({ fn: "createTicketType", message: "DB error", meta: error.message });
      if (error.code === "23505") {
        return { success: false, message: "A ticket type with this name already exists for this event." };
      }
      return { success: false, message: "Failed to create ticket type." };
    }

    revalidatePath("/dashboard/organizer-ticket-types");
    revalidatePath("/dashboard/organizer-events");
    return { success: true, message: "Ticket type created." };
  } catch (err) {
    logger.error({ fn: "createTicketType", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function updateTicketType(
  input: UpdateTicketTypeInput,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!(await verifyEventOwnership(input.event_id, userId))) {
      return { success: false, message: "Event not found." };
    }

    if (!input.name?.trim()) return { success: false, message: "Name is required." };
    if (!input.description?.trim()) return { success: false, message: "Description is required." };
    if (input.price < 0) return { success: false, message: "Price cannot be negative." };
    if (input.capacity < 1) return { success: false, message: "Capacity must be at least 1." };

    const admin = getSupabaseAdmin();

    // Check if any tickets sold — restrict changes to price/capacity if so
    const { data: existing } = await admin
      .from("ticket_types")
      .select("qty_sold")
      .eq("ticket_type_id", input.ticket_type_id)
      .maybeSingle();

    if (!existing) {
      return { success: false, message: "Ticket type not found." };
    }

    const updateData: Record<string, unknown> = {
      name: input.name.trim(),
      description: input.description.trim(),
      inclusions: JSON.stringify(input.inclusions ?? []),
      sale_start_at: input.sale_start_at || null,
      sale_end_at: input.sale_end_at || null,
    };

    // Only allow price/capacity change if no tickets sold
    if (existing.qty_sold === 0) {
      updateData.price = input.price;
      updateData.capacity = input.capacity;
    }

    const { error } = await admin
      .from("ticket_types")
      .update(updateData)
      .eq("ticket_type_id", input.ticket_type_id)
      .eq("event_id", input.event_id);

    if (error) {
      logger.error({ fn: "updateTicketType", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to update ticket type." };
    }

    revalidatePath("/dashboard/organizer-ticket-types");
    return { success: true, message: "Ticket type updated." };
  } catch (err) {
    logger.error({ fn: "updateTicketType", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function deactivateTicketType(
  ticketTypeId: string,
  eventId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!(await verifyEventOwnership(eventId, userId))) {
      return { success: false, message: "Event not found." };
    }

    const admin = getSupabaseAdmin();
    const { data: existing } = await admin
      .from("ticket_types")
      .select("is_active")
      .eq("ticket_type_id", ticketTypeId)
      .maybeSingle();

    if (!existing) {
      return { success: false, message: "Ticket type not found." };
    }

    const { error } = await admin
      .from("ticket_types")
      .update({ is_active: !existing.is_active })
      .eq("ticket_type_id", ticketTypeId)
      .eq("event_id", eventId);

    if (error) {
      logger.error({ fn: "deactivateTicketType", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to update ticket type." };
    }

    revalidatePath("/dashboard/organizer-ticket-types");
    return {
      success: true,
      message: existing.is_active ? "Ticket type deactivated." : "Ticket type activated.",
    };
  } catch (err) {
    logger.error({ fn: "deactivateTicketType", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}
