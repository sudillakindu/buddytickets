import crypto from "crypto";

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

const PAYHERE_SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
const PAYHERE_LIVE_URL = "https://www.payhere.lk/pay/checkout";

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

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

// Generate the PayHere checkout form hash (MD5 formula step 2)
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

// Authenticates incoming webhooks to prevent fake payment injections
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

// Format numeric amount to the 2-decimal-place string required by PayHere
export function formatPayHereAmount(amount: number): string {
  return amount.toFixed(2);
}

// Builds the form object mapped to PayHere API endpoints
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

export function isPayHereSuccess(statusCode: string): boolean {
  return statusCode === "2";
}

export function isPayHerePending(statusCode: string): boolean {
  return statusCode === "0";
}
