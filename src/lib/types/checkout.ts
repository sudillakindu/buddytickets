import type { TicketType } from "./event";
import type { PaymentMethod } from "./payment";

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "EXPIRED"
  | "CANCELLED";
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface CartItem {
  ticket_type_id: string;
  quantity: number;
}

export interface ReservationRow {
  reservation_id: string;
  user_id: string;
  event_id: string;
  ticket_type_id: string;
  quantity: number;
  reserved_at: string;
  expires_at: string;
  status: ReservationStatus;
  order_id: string | null;
}

export interface ReservationLineItem {
  reservation_id: string;
  ticket_type_id: string;
  ticket_type_name: string;
  description: string;
  price_each: number;
  quantity: number;
  line_total: number;
  version: number;
  capacity: number;
  qty_sold: number;
  is_active: boolean;
  sale_end_at: string | null;
}

export interface CheckoutData {
  primary_reservation_id: string;
  event_id: string;
  event_name: string;
  event_start_at: string;
  event_location: string;
  event_status: string;
  expires_at: string;
  line_items: ReservationLineItem[];
  subtotal: number;
  allowed_payment_methods: PaymentMethod[];
}

export interface ReserveTicketsResult {
  reservation_ids: string[];
  primary_id: string;
  expires_at: string;
}

export interface PromotionRow {
  promotion_id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_cap: number | null;
  min_order_amount: number;
  start_at: string;
  end_at: string;
  is_active: boolean;
  usage_limit_global: number;
  usage_limit_per_user: number;
  current_global_usage: number;
  scope_event_id: string | null;
  scope_ticket_type_id: string | null;
  extra_rules_json: Record<string, unknown> | null;
  created_by: string;
  version: number;
}

export interface ValidatedPromotion {
  promotion_id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_cap: number | null;
  discount_amount: number;
  final_total: number;
}

export interface PromoValidationResult {
  success: boolean;
  message: string;
  promo?: ValidatedPromotion;
}

export interface PricingBreakdown {
  subtotal: number;
  discount_amount: number;
  final_total: number;
  applied_promo: ValidatedPromotion | null;
}

export interface CreateReservationResult {
  success: boolean;
  message: string;
  primary_id?: string;
  expires_at?: string;
}

export interface GetCheckoutDataResult {
  success: boolean;
  message: string;
  data?: CheckoutData;
}

export interface BuyTicketItem extends TicketType {
  available: number;
  is_sold_out: boolean;
  sale_not_started: boolean;
  sale_ended: boolean;
  can_purchase: boolean;
}
