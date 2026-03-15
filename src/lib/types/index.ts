import type { Tables, Enums } from "./supabase";

// --- Re-export supabase utility types ---
export type { Tables, TablesInsert, TablesUpdate, Enums } from "./supabase";

// --- Enum Type Aliases ---
export type EventStatus = Enums<"event_status">;
export type TicketStatus = Enums<"ticket_status">;
export type ReservationStatus = Enums<"reservation_status">;
export type DiscountType = Enums<"discount_type">;
export type PaymentSource = Enums<"payment_source">;
export type PaymentStatus = Enums<"payment_status">;
export type GatewayType = Enums<"gateway_type">;
export type PaymentMethod = Enums<"payment_source">;
export type OrganizerStatus = Enums<"organizer_status">;
export type UserRole = Enums<"user_role">;

// --- DB Row Type Aliases ---
export type ReservationRow = Tables<"ticket_reservations">;
export type PromotionRow = Tables<"promotions">;
export type OrderRow = Tables<"orders">;
export type EventImageRow = Tables<"event_images">;
export type OrganizerDetailsRow = Tables<"organizer_details">;

// --- Derived Row Types ---

/** User profile — users table without password_hash and updated_at */
export type UserProfile = Omit<Tables<"users">, "password_hash" | "updated_at">;

/**
 * Ticket type row with inclusions narrowed to string[]
 * (DB stores as Json) and nullable fields overridden where the
 * action layer guarantees non-null values via defaults.
 */
export type TicketType = Omit<
  Tables<"ticket_types">,
  "inclusions" | "qty_sold" | "is_active" | "version"
> & {
  inclusions: string[];
  qty_sold: number;
  is_active: boolean;
  version: number;
};

/** Event image from event_images table */
export type EventImage = Tables<"event_images">;

// --- Event View Types ---

/**
 * Enriched event used in UI — extends the events DB row (minus
 * platform-fee columns) with joined/computed fields.
 * Nullable status, is_active, is_vip, and created_at are overridden
 * because the action layer guarantees non-null values.
 */
export type Event = Omit<
  Tables<"events">,
  | "platform_fee_cap"
  | "platform_fee_type"
  | "platform_fee_value"
  | "status"
  | "is_active"
  | "is_vip"
  | "created_at"
> & {
  status: Enums<"event_status">;
  is_active: boolean;
  is_vip: boolean;
  created_at: string;
  category: string;
  thumbnail_image: string | null;
  start_ticket_price: number | null;
  vip_priority_order: number | null;
};

/** Organizer info picked from users table */
export type Organizer = Pick<
  Tables<"users">,
  "user_id" | "name" | "image_url" | "email" | "username"
>;

/** Category details picked from categories table */
export type CategoryDetails = Pick<
  Tables<"categories">,
  "category_id" | "name" | "description"
>;

/** Full event details with joined data */
export interface EventDetails extends Event {
  images: EventImage[];
  banner_image: string | null;
  ticket_types: TicketType[];
  organizer: Organizer;
  category_details: CategoryDetails;
}

// --- Event Result Types ---

export interface BaseActionResponse {
  success: boolean;
  message?: string;
}

export interface GetFeaturedEventsResult extends BaseActionResponse {
  events?: Event[];
}

export interface GetAllEventsResult extends BaseActionResponse {
  events?: Event[];
}

export interface GetEventByIdResult extends BaseActionResponse {
  event?: EventDetails;
}

// --- Ticket View Types ---

/** Composite ticket for UI display (joins tickets, ticket_types, events) */
export interface Ticket {
  ticket_id: string;
  qr_hash: string;
  status: Enums<"ticket_status">;
  price_purchased: number;
  created_at: string;
  ticket_type: Pick<
    Tables<"ticket_types">,
    "ticket_type_id" | "name" | "description"
  >;
  event: Pick<
    Tables<"events">,
    "event_id" | "name" | "location" | "start_at" | "end_at"
  > & {
    status: Enums<"event_status">;
    primary_image: string | null;
  };
}

// --- Auth Result Types ---

export interface AuthResult {
  success: boolean;
  message: string;
  token?: string;
  redirectTo?: string;
  needsVerification?: boolean;
}

export interface VerifyResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
  redirectTo?: string;
  resetToken?: string;
  purpose?: string;
}

export interface ResendResult {
  success: boolean;
  message: string;
  remainingSeconds?: number;
}

export interface OtpStatus {
  email: string;
  purpose: string;
  canResend: boolean;
  remainingSeconds: number;
}

export interface DataFetchResult<T> {
  success: boolean;
  message: string;
  data?: T;
}

// --- Profile Result Types ---

export interface ProfileResult {
  success: boolean;
  message: string;
}

export interface ProfileFetchResult extends ProfileResult {
  profile?: UserProfile;
}

export interface ProfileImageResult extends ProfileResult {
  imageUrl?: string;
}

// --- Checkout Types ---

export interface CartItem {
  ticket_type_id: string;
  quantity: number;
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

// --- Payment Types ---

export const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  "PAYMENT_GATEWAY",
  "BANK_TRANSFER",
  "ONGATE",
];

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: string;
  available: boolean;
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    value: "PAYMENT_GATEWAY",
    label: "Pay Online",
    description: "Credit/Debit card or mobile payment",
    icon: "CreditCard",
    available: true,
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    description: "Direct bank deposit — tickets confirmed after verification",
    icon: "Building2",
    available: true,
  },
  {
    value: "ONGATE",
    label: "Pay at Gate",
    description: "Pay cash at the event entrance",
    icon: "Ticket",
    available: true,
  },
];

export interface PaymentGatewayFormData {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: "LKR";
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
  checkout_url: string;
}

export interface PaymentGatewayWebhookPayload {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  method?: string;
  status_message?: string;
  custom_1?: string;
  custom_2?: string;
}

export interface CreateOrderInput {
  reservation_id: string;
  promotion_id: string | null;
  discount_amount: number;
  subtotal: number;
  final_amount: number;
  payment_method: PaymentMethod;
  remarks: string | null;
}

export interface CreatedOrder {
  order_id: string;
  final_amount: number;
  payment_source: PaymentSource;
}

export interface CreateOrderResult {
  success: boolean;
  message: string;
  order?: CreatedOrder;
  gateway_form?: PaymentGatewayFormData;
  bank_details?: BankTransferDetails;
}

export interface BankTransferDetails {
  order_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  reference: string;
  instructions: string;
}

export interface TicketQRItem {
  reservation_id: string;
  ticket_type_version: number;
  qr_hashes: string[];
}

export interface FinalizeOrderResult {
  success: boolean;
  message: string;
  order_id?: string;
  ticket_count?: number;
}

export interface OrderSuccessData {
  order_id: string;
  event_name: string;
  event_start_at: string;
  event_location: string;
  ticket_count: number;
  final_amount: number;
  payment_status: PaymentStatus;
}

// --- Organizer Types ---

/** Organizer onboarding user picked from users table */
export type OrganizerOnboardingUser = Pick<
  Tables<"users">,
  "user_id" | "name" | "email" | "mobile" | "role" | "is_active"
>;

/** Organizer details — DB row without verified_by (not used in UI) */
export type OrganizerDetails = Omit<Tables<"organizer_details">, "verified_by">;

export interface OrganizerDetailsInput {
  nic_number: string;
  address: string;
  bank_name: string;
  bank_branch: string;
  account_holder_name: string;
  account_number: string;
}

export interface OrganizerDetailsFieldErrors {
  nic_number?: string;
  address?: string;
  bank_name?: string;
  bank_branch?: string;
  account_holder_name?: string;
  account_number?: string;
  nic_front_image?: string;
  nic_back_image?: string;
}

export interface OrganizerValidationResult {
  success: boolean;
  message: string;
  fieldErrors?: OrganizerDetailsFieldErrors;
}

export interface OrganizerBaseResult {
  success: boolean;
  message: string;
}

export interface OrganizerStateResult extends OrganizerBaseResult {
  user: OrganizerOnboardingUser | null;
  organizerDetails: OrganizerDetails | null;
  whatsappNumber: string;
}

export interface SubmitOrganizerDetailsResult extends OrganizerBaseResult {
  fieldErrors?: OrganizerDetailsFieldErrors;
}
