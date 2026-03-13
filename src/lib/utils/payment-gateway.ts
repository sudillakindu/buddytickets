import {
  buildPayHereFormData,
  verifyPayHereWebhookSignature,
  isPayHereSuccess,
} from "./payhere";
import type {
  PaymentGatewayFormData,
  PaymentGatewayWebhookPayload,
} from "@/lib/types/payment";

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
