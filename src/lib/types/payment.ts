export type PaymentSource = "PAYMENT_GATEWAY" | "ONGATE" | "BANK_TRANSFER";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "PAYMENT_GATEWAY" | "BANK_TRANSFER" | "ONGATE";

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
