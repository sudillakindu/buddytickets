// lib/types/payment.ts
// All types mirror DB schema: orders, transactions, ticket_reservations

// --- Enums (mirror DB) ---

/** DB enum: payment_source */
export type PaymentSource = "PAYMENT_GATEWAY" | "ONGATE" | "BANK_TRANSFER";

/** DB enum: payment_status */
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

/** DB enum: gateway_type */
export type GatewayType = "PAYMENT_GATEWAY" | "BANK_TRANSFER" | "ONGATE";

/** UI-level payment method selection (maps 1:1 to PaymentSource) */
export type PaymentMethod = "PAYMENT_GATEWAY" | "BANK_TRANSFER" | "ONGATE";

/** Complete set of all payment methods — used as default when event has no config */
export const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  "PAYMENT_GATEWAY",
  "BANK_TRANSFER",
  "ONGATE",
];

// --- Payment Method Display Config ---

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

// --- Payment Gateway ---

/** Fields submitted as a form POST to the payment gateway checkout URL. **/
export interface PaymentGatewayFormData {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;           // Maps to orders.order_id in our DB
  items: string;
  currency: "LKR";
  amount: string;             // e.g. "1500.00"
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;               // MD5 signature (server-generated)
  checkout_url: string;       // Gateway form action URL
}

/** Payment gateway webhook POST body fields.
 *  Currently shaped for PayHere — field names are gateway-specific. */
export interface PaymentGatewayWebhookPayload {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;     // PayHere-specific field name required by gateway API
  payhere_currency: string;   // PayHere-specific field name required by gateway API
  status_code: string;        // "2" = success, "0" = pending, "-1" = cancelled, "-2" = failed, "-3" = chargedback
  md5sig: string;             // Webhook signature
  method?: string;
  status_message?: string;
  custom_1?: string;
  custom_2?: string;
}

// --- Order ---

/** Matches orders table row */
export interface OrderRow {
  order_id: string;
  user_id: string;
  event_id: string;
  promotion_id: string | null;
  remarks: string | null;
  subtotal: number;
  discount_amount: number;
  final_amount: number;
  payment_source: PaymentSource;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string | null;
}

/** Order creation input */
export interface CreateOrderInput {
  reservation_id: string;     // Primary reservation ID (identifies the checkout session)
  promotion_id: string | null;
  discount_amount: number;
  subtotal: number;
  final_amount: number;
  payment_method: PaymentMethod;
  remarks: string | null;
}

/** Returned after order creation */
export interface CreatedOrder {
  order_id: string;
  final_amount: number;
  payment_source: PaymentSource;
}

/** Server action response for creating an order */
export interface CreateOrderResult {
  success: boolean;
  message: string;
  order?: CreatedOrder;
  gateway_form?: PaymentGatewayFormData;  // Present if payment method = PAYMENT_GATEWAY
  bank_details?: BankTransferDetails; // Present if payment method = Bank Transfer
}

// --- Bank Transfer ---

export interface BankTransferDetails {
  order_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  reference: string;           // Unique ref = order_id prefix
  instructions: string;
}

// --- QR Data for finalize_order_tickets RPC ---

/** Structure passed as p_ticket_qr_data to finalize_order_tickets */
export interface TicketQRItem {
  reservation_id: string;
  ticket_type_version: number;
  qr_hashes: string[];
}

// --- Finalize Result ---

export interface FinalizeOrderResult {
  success: boolean;
  message: string;
  order_id?: string;
  ticket_count?: number;
}

// --- Success Page Data ---

export interface OrderSuccessData {
  order_id: string;
  event_name: string;
  event_start_at: string;
  event_location: string;
  ticket_count: number;
  final_amount: number;
  payment_status: PaymentStatus;
}