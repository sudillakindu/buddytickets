export interface Review {
  review_id: string;
  event_id: string;
  user_id: string;
  ticket_id: string;
  rating: number;
  review_text: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string | null;
}
