export type WaitlistStatus = "WAITING" | "NOTIFIED" | "CONVERTED" | "EXPIRED";

export interface WaitlistRow {
  waitlist_id: string;
  event_id: string;
  ticket_type_id: string | null;
  user_id: string;
  notify_email: string;
  position_order: number;
  status: WaitlistStatus;
  notified_at: string | null;
  converted_order_id: string | null;
  created_at: string;
  updated_at: string | null;
}
