import {
  buildPayHereFormData,
  verifyPayHereWebhookSignature,
  isPayHereSuccess,
  type PaymentGatewayWebhookPayload,
} from "./payhere";

interface PaymentGatewayFormData {
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

export interface GatewayInitiateParams {
  orderId: string;
  amount: number;
  currency: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  itemName: string;
}

export interface GatewayWebhookPayload {
  orderId: string;
  paymentId: string;
  status: "success" | "failed" | "pending";
  amount: number;
  rawPayload: Record<string, string>;
}

export function initiatePaymentGateway(
  params: GatewayInitiateParams,
): PaymentGatewayFormData {
  return buildPayHereFormData({
    orderId: params.orderId,
    amount: params.amount,
    itemDescription: params.itemName,
    userFirstName: params.customerFirstName,
    userLastName: params.customerLastName,
    userEmail: params.customerEmail,
    userPhone: params.customerPhone,
  });
}

export function verifyGatewayWebhookSignature(
  payload: PaymentGatewayWebhookPayload,
): boolean {
  return verifyPayHereWebhookSignature(payload);
}

export function isGatewayPaymentSuccess(statusCode: string): boolean {
  return isPayHereSuccess(statusCode);
}
