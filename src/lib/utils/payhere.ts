// lib/utils/payhere.ts
// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT_GATEWAY implementation — PayHere (Sri Lanka)
//
// This file is the current concrete implementation of the PAYMENT_GATEWAY
// payment method. The gateway can be swapped to Stripe, Dialog Pay, HNB Pay,
// FriMi, or any other payment gateway in the future by replacing this file
// and updating only the import in the payment action (src/lib/actions/payment.ts).
// No other files need to change to swap gateways.
// ─────────────────────────────────────────────────────────────────────────────
//
// PayHere Sri Lankan payment gateway integration utilities.
//
// PayHere Checkout Hash Formula:
//   STEP 1: secret_hash = MD5(PAYHERE_MERCHANT_SECRET).toUpperCase()
//   STEP 2: hash = MD5(merchant_id + order_id + amount + currency + secret_hash).toUpperCase()
//
// PayHere Webhook Verification Formula:
//   STEP 1: secret_hash = MD5(PAYHERE_MERCHANT_SECRET).toUpperCase()
//   STEP 2: local_sig = MD5(merchant_id + order_id + amount + currency + status_code + secret_hash).toUpperCase()
//   STEP 3: Compare local_sig with md5sig from webhook body

import crypto from "crypto";
import type { PaymentGatewayFormData, PaymentGatewayWebhookPayload } from "@/lib/types/payment";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYHERE_SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
const PAYHERE_LIVE_URL = "https://www.payhere.lk/pay/checkout";

// ─── Env validation ───────────────────────────────────────────────────────────

function getPayHereConfig(): {
  merchantId: string;
  merchantSecret: string;
  isSandbox: boolean;
  checkoutUrl: string;
} {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

  if (!merchantId || !merchantSecret) {
    throw new Error("Missing PAYHERE_MERCHANT_ID or PAYHERE_MERCHANT_SECRET.");
  }

  const isSandbox = process.env.PAYHERE_SANDBOX === "true";
  return {
    merchantId,
    merchantSecret,
    isSandbox,
    checkoutUrl: isSandbox ? PAYHERE_SANDBOX_URL : PAYHERE_LIVE_URL,
  };
}

// ─── Hash Utilities ───────────────────────────────────────────────────────────

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

/**
 * Generate the PayHere checkout form hash (STEP 2 of PayHere formula).
 * Called server-side when building the payment form.
 */
export function generatePayHereCheckoutHash(
  orderId: string,
  amount: string,
  currency: string = "LKR",
): string {
  const { merchantId, merchantSecret } = getPayHereConfig();
  const secretHash = md5(merchantSecret).toUpperCase();
  const hashInput = `${merchantId}${orderId}${amount}${currency}${secretHash}`;
  return md5(hashInput).toUpperCase();
}

/**
 * Verify a PayHere webhook notification signature.
 * Returns true if the webhook is authentic.
 *
 * Called in /api/webhooks/payhere route handler BEFORE processing any payment.
 * NEVER skip this verification — it prevents fake payment injections.
 */
export function verifyPayHereWebhookSignature(
  payload: PaymentGatewayWebhookPayload,
): boolean {
  try {
    const { merchantId, merchantSecret } = getPayHereConfig();
    const secretHash = md5(merchantSecret).toUpperCase();
    const localSig = md5(
      `${merchantId}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${secretHash}`,
    ).toUpperCase();
    return localSig === payload.md5sig;
  } catch {
    return false;
  }
}

/**
 * Format a numeric amount to the 2-decimal-place string PayHere requires.
 * e.g. 1500 → "1500.00", 1500.5 → "1500.50"
 */
export function formatPayHereAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Build the complete PayHere form data object.
 * Called server-side when user clicks "Pay with PayHere".
 * The client auto-submits this as a POST form to checkout_url.
 */
export function buildPayHereFormData(params: {
  orderId: string;
  amount: number;
  itemDescription: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
}): PaymentGatewayFormData {
  const { merchantId, checkoutUrl } = getPayHereConfig();
  const siteUrl = process.env.PUBLIC_SITE_URL ?? "http://localhost:3000";
  const amountStr = formatPayHereAmount(params.amount);

  return {
    merchant_id: merchantId,
    return_url: `${siteUrl}/checkout/success?order_id=${params.orderId}`,
    cancel_url: `${siteUrl}/checkout/cancel?order_id=${params.orderId}`,
    notify_url: `${siteUrl}/api/webhooks/payhere`,
    order_id: params.orderId,
    items: params.itemDescription,
    currency: "LKR",
    amount: amountStr,
    first_name: params.userFirstName,
    last_name: params.userLastName,
    email: params.userEmail,
    phone: params.userPhone,
    address: "N/A",
    city: "Colombo",
    country: "Sri Lanka",
    hash: generatePayHereCheckoutHash(params.orderId, amountStr, "LKR"),
    checkout_url: checkoutUrl,
  };
}

/**
 * PayHere status_code meanings:
 *   2  = Success (payment confirmed)
 *   0  = Pending
 *  -1  = Cancelled
 *  -2  = Failed
 *  -3  = Chargedback
 */
export function isPayHereSuccess(statusCode: string): boolean {
  return statusCode === "2";
}

export function isPayHerePending(statusCode: string): boolean {
  return statusCode === "0";
}