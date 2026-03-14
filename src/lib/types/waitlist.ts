export type WaitlistStatus = "WAITING" | "NOTIFIED" | "CONVERTED" | "EXPIRED";

export interface WaitlistEntry {
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

export interface JoinWaitlistInput {
  event_id: string;
  ticket_type_id?: string;
  notify_email: string;
}

export interface JoinWaitlistResult {
  success: boolean;
  message: string;
  entry?: WaitlistEntry;
}

export interface GetWaitlistResult {
  success: boolean;
  message: string;
  entries?: WaitlistEntry[];
}

export interface NotifyWaitlistResult {
  success: boolean;
  message: string;
  notified_count?: number;
}
