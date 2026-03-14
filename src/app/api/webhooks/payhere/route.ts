// app/api/webhooks/payhere/route.ts
// PayHere payment gateway webhook handler.
//
// PayHere sends a POST with application/x-www-form-urlencoded body.
// This handler:
//  1. Verifies the MD5 signature — REJECT if mismatch (fake payment injection)
//  2. Validates status_code = "2" (success only)
//  3. Checks for duplicate processing (idempotency)
//  4. Generates QR hashes for all tickets in the order
//  5. Calls finalize_order_tickets RPC (atomic: inventory + tickets + order)
//  6. Returns HTTP 200 (PayHere retries on non-200)
//
// CRITICAL: Always return 200 to PayHere even on processing errors,
//           to prevent infinite retry loops. Log all failures.

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
import type { PaymentGatewayWebhookPayload } from "@/lib/types/payment";
import type { TicketQRItem } from "@/lib/types/payment";

// PayHere retries on non-200 — always return 200 for processed/known states
const OK = () => NextResponse.json({ received: true }, { status: 200 });
const AMOUNT_TOLERANCE = 0.01; // Tolerance for floating-point rounding in amount comparison

export async function POST(req: NextRequest): Promise<NextResponse> {
  let orderId: string | undefined;

  try {
    // ── 1. Parse form body ────────────────────────────────────────────────
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

    // ── 2. Merchant ID validation — reject webhooks from unknown merchants ──
    const expectedMerchantId = process.env.PAYHERE_MERCHANT_ID;
    if (expectedMerchantId && payload.merchant_id !== expectedMerchantId) {
      logger.error({
        fn: "payhere.webhook",
        message: `MERCHANT_ID_MISMATCH for order ${orderId}. Expected ${expectedMerchantId}, got ${payload.merchant_id}.`,
      });
      return OK();
    }

    // ── 3. Signature verification — CRITICAL security check ───────────────
    if (!verifyPayHereWebhookSignature(payload)) {
      logger.error({
        fn: "payhere.webhook",
        message: `SIGNATURE_MISMATCH for order ${orderId}. Possible fake payment injection.`,
        meta: { merchant_id: payload.merchant_id, order_id: orderId },
      });
      // Return 200 to stop retries, but do NOT process
      return OK();
    }

    // ── 3. Only process successful payments ────────────────────────────────
    if (!isPayHereSuccess(payload.status_code)) {
      logger.info({
        fn: "payhere.webhook",
        message: `Non-success status ${payload.status_code} for order ${orderId} — skipping.`,
      });
      // Update order status to FAILED if status = -2
      if (payload.status_code === "-2" || payload.status_code === "-1") {
        await getSupabaseAdmin()
          .from("orders")
          .update({ payment_status: "FAILED" })
          .eq("order_id", orderId)
          .eq("payment_status", "PENDING");
      }
      return OK();
    }

    // ── 4. Idempotency check — prevent duplicate processing ────────────────
    // finalize_order_tickets also guards against this (order status PENDING check),
    // but an early check avoids unnecessary work.
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
      return OK(); // Return OK — don't let PayHere retry indefinitely
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

    // ── Amount validation — verify paid amount matches order total ──────────
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

    // ── 6. Fetch PENDING reservations linked to this order ─────────────────
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
      // Mark order as failed — reservations expired
      await getSupabaseAdmin()
        .from("orders")
        .update({ payment_status: "FAILED", remarks: "RESERVATIONS_EXPIRED" })
        .eq("order_id", orderId);
      return OK();
    }

    // ── 6. Fetch ticket type versions for OCC ─────────────────────────────
    const ticketTypeIds = [...new Set(reservations.map((r: Record<string, unknown>) => r.ticket_type_id as string))];

    const { data: ticketTypes, error: ttErr } = await getSupabaseAdmin()
      .from("ticket_types")
      .select("ticket_type_id, version")
      .in("ticket_type_id", ticketTypeIds);

    if (ttErr) {
      logger.error({ fn: "payhere.webhook.fetchTT", message: ttErr.message });
      return OK();
    }

    const versionMap = new Map(
      (ticketTypes ?? []).map((tt: Record<string, unknown>) => [tt.ticket_type_id as string, tt.version as number]),
    );

    // ── 7. Generate QR hashes for all tickets ─────────────────────────────
    // One QR hash per physical ticket seat (reservation.quantity tickets each)
    const ticketQRData: TicketQRItem[] = reservations.map((r: Record<string, unknown>) => ({
      reservation_id: r.reservation_id as string,
      ticket_type_version: versionMap.get(r.ticket_type_id as string) ?? 1,
      qr_hashes: generateQRHashesForReservation(
        orderId!,
        r.reservation_id as string,
        r.quantity as number,
      ),
    }));

    // ── 8. Call finalize_order_tickets RPC (atomic transaction) ────────────
    // This single RPC atomically:
    //  - Validates reservation expiry (DB-layer edge-case protection)
    //  - OCC version check + qty_sold increment
    //  - Inserts ticket rows with QR hashes
    //  - Updates reservation status → CONFIRMED
    //  - Updates order payment_status → PAID
    //  - Inserts transaction record
    //  - Increments promotion usage
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

      // If OCC conflict — the inventory has changed. Mark order failed.
      if (finalizeErr.message.includes("OCC_CONFLICT_OR_SOLD_OUT")) {
        await getSupabaseAdmin()
          .from("orders")
          .update({ payment_status: "FAILED", remarks: "OCC_CONFLICT_SOLD_OUT" })
          .eq("order_id", orderId);
        // TODO: Trigger refund flow here in production
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

    // --- Store transaction meta_data (raw webhook payload) ---
    const { error: metaErr } = await getSupabaseAdmin()
      .from("transactions")
      .update({
        meta_data: {
          payment_id: payload.payment_id,
          method: payload.method ?? null,
          status_message: payload.status_message ?? null,
          payhere_currency: payload.payhere_currency,
          payhere_amount: payload.payhere_amount,
        },
      })
      .eq("order_id", orderId)
      .eq("gateway_ref_id", payload.payment_id);

    if (metaErr) {
      logger.error({
        fn: "payhere.webhook.updateMeta",
        message: `Failed to store transaction meta_data for order ${orderId}: ${metaErr.message}`,
      });
    }

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
    // Return 200 to prevent PayHere infinite retries
    return OK();
  }
}
