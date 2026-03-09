// lib/utils/payment-gateway.ts
// Gateway abstraction layer.
// This is the ONLY place that imports gateway-specific implementation code.
// To swap gateway: change the imports and function bodies here — nothing else changes.

import { buildPayHereFormData, verifyPayHereWebhookSignature, isPayHereSuccess } from "./payhere";
import type { PaymentGatewayFormData, PaymentGatewayWebhookPayload } from "@/lib/types/payment";

// ─── Generic Gateway Interfaces ──────────────────────────────────────────────

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

// ─── Gateway Functions (swap these to change gateways) ───────────────────────

/**
 * Build payment form data for the current gateway.
 * Currently delegates to PayHere. To swap gateway, change this function only.
 */
export function initiatePaymentGateway(params: GatewayInitiateParams): PaymentGatewayFormData {
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

/**
 * Verify a gateway webhook signature.
 * Currently delegates to PayHere verification.
 */
export function verifyGatewayWebhookSignature(payload: PaymentGatewayWebhookPayload): boolean {
  return verifyPayHereWebhookSignature(payload);
}

/**
 * Check if the gateway reports a successful payment.
 * Currently delegates to PayHere status check.
 */
export function isGatewayPaymentSuccess(statusCode: string): boolean {
  return isPayHereSuccess(statusCode);
}
