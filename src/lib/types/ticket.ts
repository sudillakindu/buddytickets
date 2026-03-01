// lib/types/ticket.ts
import { type EventStatus } from './event';

export type TicketStatus =
  | 'ACTIVE'
  | 'ONGATE_PENDING'
  | 'USED'
  | 'CANCELLED';

export interface Ticket {
  ticket_id: string;
  qr_hash: string;
  status: TicketStatus;
  price_purchased: string;
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