"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type { Ticket, UpdateAttendeeInput, UpdateAttendeeResult } from "@/lib/types/ticket";

export interface TicketsResult {
  success: boolean;
  message: string;
  tickets?: Ticket[];
}

interface TicketTypeJoin {
  ticket_type_id: string;
  name: string;
  description: string;
}

interface EventJoin {
  event_id: string;
  name: string;
  location: string;
  start_at: string;
  end_at: string;
  status: string;
  event_images?: { priority_order: number; image_url: string }[];
}

interface TicketRow {
  ticket_id: string;
  qr_hash: string;
  status: Ticket["status"];
  price_purchased: string;
  attendee_name: string | null;
  attendee_nic: string | null;
  attendee_email: string | null;
  attendee_mobile: string | null;
  created_at: string;
  ticket_types?: TicketTypeJoin | TicketTypeJoin[] | null;
  events?: EventJoin | EventJoin[] | null;
}

// Map raw Supabase row to standardized Ticket object
function mapToTicket(row: TicketRow): Ticket {
  const ticketType: TicketTypeJoin | null = Array.isArray(row.ticket_types)
    ? (row.ticket_types[0] ?? null)
    : (row.ticket_types ?? null);

  const event: EventJoin | null = Array.isArray(row.events)
    ? (row.events[0] ?? null)
    : (row.events ?? null);

  const images = event?.event_images ?? [];
  images.sort((a, b) => a.priority_order - b.priority_order);

  return {
    ticket_id: row.ticket_id,
    qr_hash: row.qr_hash,
    status: row.status,
    price_purchased: row.price_purchased,
    attendee_name: row.attendee_name ?? null,
    attendee_nic: row.attendee_nic ?? null,
    attendee_email: row.attendee_email ?? null,
    attendee_mobile: row.attendee_mobile ?? null,
    created_at: row.created_at,
    ticket_type: {
      ticket_type_id: ticketType?.ticket_type_id ?? "",
      name: ticketType?.name ?? "—",
      description: ticketType?.description ?? "",
    },
    event: {
      event_id: event?.event_id ?? "",
      name: event?.name ?? "—",
      location: event?.location ?? "—",
      start_at: event?.start_at ?? "",
      end_at: event?.end_at ?? "",
      status: (event?.status as Ticket["event"]["status"]) ?? "COMPLETED",
      primary_image: images[0]?.image_url ?? null,
    },
  };
}

export async function getUserTickets(): Promise<TicketsResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .select(
        `ticket_id, qr_hash, status, price_purchased,
        attendee_name, attendee_nic, attendee_email, attendee_mobile,
        created_at,
        ticket_types ( ticket_type_id, name, description ),
        events ( event_id, name, location, start_at, end_at, status, event_images ( priority_order, image_url ) )`,
      )
      .eq("owner_user_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({
        fn: "getUserTickets",
        message: "DB error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load tickets." };
    }

    const tickets = (data ?? []).map(mapToTicket);
    return { success: true, message: "Tickets loaded.", tickets };
  } catch (err) {
    logger.error({
      fn: "getUserTickets",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getTicketById(
  ticketId: string,
): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await getSupabaseAdmin()
      .from("tickets")
      .select(
        `ticket_id, qr_hash, status, price_purchased,
        attendee_name, attendee_nic, attendee_email, attendee_mobile,
        created_at,
        ticket_types ( ticket_type_id, name, description ),
        events ( event_id, name, location, start_at, end_at, status, event_images ( priority_order, image_url ) )`,
      )
      .eq("ticket_id", ticketId)
      .eq("owner_user_id", session.sub)
      .maybeSingle();

    if (error) {
      logger.error({
        fn: "getTicketById",
        message: "DB error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load ticket." };
    }

    if (!data) return { success: false, message: "Ticket not found." };

    return {
      success: true,
      message: "Ticket loaded.",
      ticket: mapToTicket(data),
    };
  } catch (err) {
    logger.error({
      fn: "getTicketById",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// --- Update Attendee Info ---

export async function updateTicketAttendee(
  input: UpdateAttendeeInput,
): Promise<UpdateAttendeeResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    if (!input.ticket_id || !input.attendee_name?.trim()) {
      return { success: false, message: "Ticket ID and attendee name are required." };
    }

    const { data: ticket, error: fetchErr } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id, status")
      .eq("ticket_id", input.ticket_id)
      .eq("owner_user_id", session.sub)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!ticket) return { success: false, message: "Ticket not found." };
    if (ticket.status === "USED" || ticket.status === "CANCELLED") {
      return { success: false, message: "Cannot update attendee info for this ticket." };
    }

    const { error: updateErr } = await getSupabaseAdmin()
      .from("tickets")
      .update({
        attendee_name: input.attendee_name.trim(),
        attendee_nic: input.attendee_nic?.trim() ?? null,
        attendee_email: input.attendee_email?.trim() ?? null,
        attendee_mobile: input.attendee_mobile?.trim() ?? null,
      })
      .eq("ticket_id", input.ticket_id)
      .eq("owner_user_id", session.sub);

    if (updateErr) throw updateErr;

    return { success: true, message: "Attendee information updated." };
  } catch (err) {
    logger.error({
      fn: "updateTicketAttendee",
      message: "Error updating attendee info",
      meta: err,
    });
    return { success: false, message: "Failed to update attendee information." };
  }
}
