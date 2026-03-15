import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import {
  verifyPayHereWebhookSignature,
  isPayHereSuccess,
} from "@/lib/utils/payhere";
import {
  generateQRHashesForReservation,
} from "@/lib/utils/qrcode";
import type { Database } from "@/lib/types/supabase";

type ReservationPartial = Pick<
  Database["public"]["Tables"]["ticket_reservations"]["Row"],
  "reservation_id" | "ticket_type_id" | "quantity" | "expires_at" | "status"
>;

type TicketTypeVersionPartial = Pick<
  Database["public"]["Tables"]["ticket_types"]["Row"],
  "ticket_type_id" | "version"
>;

interface PaymentGatewayWebhookPayload {
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

interface TicketQRItem {
  reservation_id: string;
  ticket_type_version: number;
  qr_hashes: string[];
}

const OK = () => NextResponse.json({ received: true }, { status: 200 });
const AMOUNT_TOLERANCE = 0.01;

export async function POST(req: NextRequest): Promise<NextResponse> {
  let orderId: string | undefined;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let payload: PaymentGatewayWebhookPayload;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      payload = Object.fromEntries(params.entries()) as unknown as PaymentGatewayWebhookPayload;
    } else {
      payload = await req.json() as PaymentGatewayWebhookPayload;
    }

    orderId = payload.order_id;
    if (!orderId) {
      logger.error({
        fn: "payhere.webhook",
        message: "Webhook payload missing order_id.",
        meta: payload,
      });
      return OK();
    }

    logger.info({
      fn: "payhere.webhook",
      message: `Received webhook for order ${orderId} — status_code: ${payload.status_code}`,
    });

    const expectedMerchantId = process.env.PAYHERE_MERCHANT_ID;
    if (expectedMerchantId && payload.merchant_id !== expectedMerchantId) {
      logger.error({
        fn: "payhere.webhook",
        message: `MERCHANT_ID_MISMATCH for order ${orderId}. Expected ${expectedMerchantId}, got ${payload.merchant_id}.`,
      });
      return OK();
    }

    if (!verifyPayHereWebhookSignature(payload)) {
      logger.error({
        fn: "payhere.webhook",
        message: `SIGNATURE_MISMATCH for order ${orderId}. Possible fake payment injection.`,
        meta: { merchant_id: payload.merchant_id, order_id: orderId },
      });
      return OK();
    }

    if (!isPayHereSuccess(payload.status_code)) {
      logger.info({
        fn: "payhere.webhook",
        message: `Non-success status ${payload.status_code} for order ${orderId} — skipping.`,
      });
      if (payload.status_code === "-2" || payload.status_code === "-1") {
        await getSupabaseAdmin()
          .from("orders")
          .update({ payment_status: "FAILED" })
          .eq("order_id", orderId)
          .eq("payment_status", "PENDING");
      }
      return OK();
    }

    const { data: existingOrder, error: orderFetchErr } = await getSupabaseAdmin()
      .from("orders")
      .select("order_id, user_id, payment_status, event_id, final_amount")
      .eq("order_id", orderId)
      .maybeSingle();

    if (orderFetchErr) {
      logger.error({
        fn: "payhere.webhook.orderFetch",
        message: orderFetchErr.message,
        meta: { orderId },
      });
      return OK();
    }

    if (!existingOrder) {
      logger.error({
        fn: "payhere.webhook",
        message: `Order ${orderId} not found in DB.`,
      });
      return OK();
    }

    if (existingOrder.payment_status !== "PENDING") {
      logger.info({
        fn: "payhere.webhook",
        message: `Order ${orderId} already processed (status: ${existingOrder.payment_status}). Idempotent skip.`,
      });
      return OK();
    }

    const userId = existingOrder.user_id;

    const paidAmount = Number(payload.payhere_amount);
    const expectedAmount = Number(existingOrder.final_amount);
    if (
      !Number.isFinite(paidAmount) ||
      !Number.isFinite(expectedAmount) ||
      Math.abs(paidAmount - expectedAmount) > AMOUNT_TOLERANCE
    ) {
      logger.error({
        fn: "payhere.webhook",
        message: `AMOUNT_MISMATCH for order ${orderId}. Expected ${expectedAmount}, received ${paidAmount}.`,
        meta: { orderId, expected: expectedAmount, received: paidAmount },
      });
      await getSupabaseAdmin()
        .from("orders")
        .update({ payment_status: "FAILED", remarks: "AMOUNT_MISMATCH" })
        .eq("order_id", orderId)
        .eq("payment_status", "PENDING");
      return OK();
    }

    const { data: reservations, error: resErr } = await getSupabaseAdmin()
      .from("ticket_reservations")
      .select("reservation_id, ticket_type_id, quantity, expires_at, status")
      .eq("order_id", orderId)
      .eq("user_id", userId)
      .eq("status", "PENDING");

    if (resErr) {
      logger.error({
        fn: "payhere.webhook.fetchReservations",
        message: resErr.message,
        meta: { orderId },
      });
      return OK();
    }

    if (!reservations || reservations.length === 0) {
      logger.error({
        fn: "payhere.webhook",
        message: `No PENDING reservations found for order ${orderId}.`,
      });
      await getSupabaseAdmin()
        .from("orders")
        .update({ payment_status: "FAILED", remarks: "RESERVATIONS_EXPIRED" })
        .eq("order_id", orderId);
      return OK();
    }

    const ticketTypeIds = [...new Set(reservations.map((r: ReservationPartial) => r.ticket_type_id))];

    const { data: ticketTypes, error: ttErr } = await getSupabaseAdmin()
      .from("ticket_types")
      .select("ticket_type_id, version")
      .in("ticket_type_id", ticketTypeIds);

    if (ttErr) {
      logger.error({ fn: "payhere.webhook.fetchTT", message: ttErr.message });
      return OK();
    }

    const versionMap = new Map<string, number>(
      (ticketTypes ?? []).map((tt: TicketTypeVersionPartial) => [tt.ticket_type_id, tt.version ?? 1]),
    );

    const ticketQRData: TicketQRItem[] = reservations.map((r: ReservationPartial) => ({
      reservation_id: r.reservation_id,
      ticket_type_version: versionMap.get(r.ticket_type_id) ?? 1,
      qr_hashes: generateQRHashesForReservation(
        orderId!,
        r.reservation_id,
        r.quantity,
      ),
    }));

    const { data: finalizeResult, error: finalizeErr } = await getSupabaseAdmin().rpc(
      "finalize_order_tickets",
      {
        p_order_id: orderId,
        p_user_id: userId,
        p_payment_status: "PAID",
        p_gateway_ref_id: payload.payment_id ?? null,
        p_ticket_qr_data: ticketQRData,
      },
    );

    if (finalizeErr) {
      logger.error({
        fn: "payhere.webhook.finalize",
        message: `finalize_order_tickets failed for order ${orderId}: ${finalizeErr.message}`,
        meta: { orderId, error: finalizeErr },
      });

      if (finalizeErr.message.includes("OCC_CONFLICT_OR_SOLD_OUT")) {
        await getSupabaseAdmin()
          .from("orders")
          .update({ payment_status: "FAILED", remarks: "OCC_CONFLICT_SOLD_OUT" })
          .eq("order_id", orderId);
      }

      if (finalizeErr.message.includes("RESERVATION_EXPIRED")) {
        await getSupabaseAdmin()
          .from("orders")
          .update({ payment_status: "FAILED", remarks: "RESERVATION_EXPIRED_AT_FINALIZE" })
          .eq("order_id", orderId);
      }

      return OK();
    }

    const result = finalizeResult as { order_id: string; ticket_count: number };

    logger.success({
      fn: "payhere.webhook",
      message: `Order ${orderId} finalized. Tickets issued: ${result.ticket_count}. PayHere ref: ${payload.payment_id}`,
    });

    return OK();
  } catch (err) {
    logger.error({
      fn: "payhere.webhook",
      message: `Unhandled error processing webhook for order ${orderId ?? "UNKNOWN"}`,
      meta: err,
    });
    return OK();
  }
}
