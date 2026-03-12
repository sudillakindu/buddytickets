// lib/utils/ticket.ts
// Ticket enrichment logic used by the buy-tickets page.
import type { TicketType } from "@/lib/types/event";
import type { BuyTicketItem } from "@/lib/types/checkout";
import { isBookableStatus } from "@/lib/constants/event-status";
import type { EventStatus } from "@/lib/types/event";

export function enrichTicketType(
  ticket: TicketType,
  eventStatus: EventStatus,
): BuyTicketItem {
  const now = new Date();
  const available = Math.max(0, ticket.capacity - ticket.qty_sold);
  const is_sold_out = available <= 0;
  const sale_not_started = ticket.sale_start_at
    ? new Date(ticket.sale_start_at) > now
    : false;
  const sale_ended = ticket.sale_end_at
    ? new Date(ticket.sale_end_at) < now
    : false;
  const can_purchase =
    !is_sold_out &&
    !sale_not_started &&
    !sale_ended &&
    isBookableStatus(eventStatus);

  return {
    ...ticket,
    available,
    is_sold_out,
    sale_not_started,
    sale_ended,
    can_purchase,
  };
}
