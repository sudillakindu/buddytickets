// lib/actions/ticket.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type { Ticket } from "@/lib/types/ticket";

export interface TicketsResult {
  success: boolean;
  message: string;
  tickets?: Ticket[];
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

interface TicketRow {
  ticket_id: string;
  qr_hash: string;
  status: Ticket["status"];
  price_purchased: string;
  created_at: string;
  ticket_types?:
    | { ticket_type_id: string; name: string; description: string }[]
    | null;
  events?:
    | {
        event_id: string;
        name: string;
        location: string;
        start_at: string;
        end_at: string;
        status: string;
        event_images?: { priority_order: number; image_url: string }[];
      }[]
    | null;
}

function mapToTicket(row: TicketRow): Ticket {
  const ticketType = row.ticket_types?.[0] ?? null;
  const event = row.events?.[0] ?? null;
  const images: { priority_order: number; image_url: string }[] =
    event?.event_images ?? [];
  images.sort((a, b) => a.priority_order - b.priority_order);

  return {
    ticket_id: row.ticket_id,
    qr_hash: row.qr_hash,
    status: row.status,
    price_purchased: row.price_purchased,
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

// ─── Queries (GET) ───────────────────────────────────────────────────────────

export async function getUserTickets(): Promise<TicketsResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await supabaseAdmin
      .from("tickets")
      .select(
        `
        ticket_id, qr_hash, status, price_purchased, created_at,
        ticket_types ( ticket_type_id, name, description ),
        events (
          event_id, name, location, start_at, end_at, status,
          event_images ( priority_order, image_url )
        )
      `,
      )
      .eq("owner_user_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({ fn: "getUserTickets", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load tickets." };
    }

    const tickets = (data ?? []).map(mapToTicket);
    return { success: true, message: "Tickets loaded.", tickets };
  } catch (err) {
    logger.error({ fn: "getUserTickets", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function getTicketById(ticketId: string): Promise<{
  success: boolean;
  message: string;
  ticket?: Ticket;
}> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await supabaseAdmin
      .from("tickets")
      .select(
        `
        ticket_id, qr_hash, status, price_purchased, created_at,
        ticket_types ( ticket_type_id, name, description ),
        events (
          event_id, name, location, start_at, end_at, status,
          event_images ( priority_order, image_url )
        )
      `,
      )
      .eq("ticket_id", ticketId)
      .eq("owner_user_id", session.sub)
      .maybeSingle();

    if (error) {
      logger.error({ fn: "getTicketById", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load ticket." };
    }
    if (!data) return { success: false, message: "Ticket not found." };

    return {
      success: true,
      message: "Ticket loaded.",
      ticket: mapToTicket(data),
    };
  } catch (err) {
    logger.error({ fn: "getTicketById", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}
