import type { EventStatus } from "./event";

export type TicketStatus = "ACTIVE" | "PENDING" | "USED" | "CANCELLED";

export interface Ticket {
  ticket_id: string;
  order_id: string;
  qr_hash: string;
  status: TicketStatus;
  price_purchased: string;
  attendee_name: string | null;
  attendee_nic: string | null;
  attendee_email: string | null;
  attendee_mobile: string | null;
  created_at: string;
  ticket_type: {
    ticket_type_id: string;
    name: string;
    description: string;
  };
  event: {
    event_id: string;
    name: string;
    location: string;
    start_at: string;
    end_at: string;
    status: EventStatus;
    primary_image: string | null;
  };
}
