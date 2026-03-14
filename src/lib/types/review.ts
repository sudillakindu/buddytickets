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

export interface ReviewInsert {
  event_id: string;
  ticket_id: string;
  rating: number;
  review_text?: string | null;
}

export interface ReviewResult {
  success: boolean;
  message: string;
  review?: Review;
}

export interface ReviewListResult {
  success: boolean;
  message: string;
  reviews?: Review[];
}
