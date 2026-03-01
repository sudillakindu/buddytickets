import { type EventStatus } from './event';

// Mirrors the ticket_status ENUM in the database
export type TicketStatus =
  |'ACTIVE'
  | 'ONGATE_PENDING'
  | 'USED'
  | 'CANCELLED';

// Shape returned by getUserTickets — assembled from DB joins
export interface Ticket {
  ticket_id: string;
  qr_hash: string;
  status: TicketStatus;
  // Stored as NUMERIC in DB, returned as string by Supabase — parse before arithmetic
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
    // First image from event_images
    primary_image: string | null;
  };
}