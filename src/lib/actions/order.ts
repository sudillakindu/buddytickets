// lib/actions/order.ts
// Order query server actions.
// finalize_order_tickets RPC is called by the PayHere webhook — not here.
// These actions are for reading order state (success page, user order history).

"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type { OrderSuccessData } from "@/lib/types/payment";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 · ORDER SUCCESS DATA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch order success page data.
 * Used by /checkout/success to display confirmation details.
 * Validates the order belongs to the authenticated user.
 */
export async function getOrderSuccessData(orderId: string): Promise<{
  success: boolean;
  message: string;
  data?: OrderSuccessData;
}> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };

  if (!orderId) return { success: false, message: "Order ID required." };

  try {
    // Fetch order with event details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select(
        `order_id, user_id, final_amount, payment_status,
         events ( name, start_at, location )`,
      )
      .eq("order_id", orderId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order) return { success: false, message: "Order not found." };

    // Count tickets for this order
    const { count: ticketCount, error: countErr } = await supabaseAdmin
      .from("tickets")
      .select("ticket_id", { count: "exact", head: true })
      .eq("order_id", orderId);

    if (countErr) throw countErr;

    const ev = Array.isArray(order.events) ? order.events[0] : order.events;

    return {
      success: true,
      message: "Order found.",
      data: {
        order_id: order.order_id,
        event_name: (ev as Record<string, unknown>)?.name as string ?? "—",
        event_start_at: (ev as Record<string, unknown>)?.start_at as string ?? "",
        event_location: (ev as Record<string, unknown>)?.location as string ?? "—",
        ticket_count: ticketCount ?? 0,
        final_amount: Number(order.final_amount),
        payment_status: order.payment_status,
      },
    };
  } catch (err) {
    logger.error({ fn: "getOrderSuccessData", message: "Error", meta: err });
    return { success: false, message: "Failed to load order." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 · ORDER STATUS POLLING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Poll order payment status.
 * Used by success page to confirm payment_status = 'PAID'.
 * Returns 'PENDING' | 'PAID' | 'FAILED'.
 */
export async function getOrderPaymentStatus(orderId: string): Promise<{
  success: boolean;
  status?: string;
}> {
  const session = await getSession();
  if (!session) return { success: false };

  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("payment_status")
      .eq("order_id", orderId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (error || !data) return { success: false };
    return { success: true, status: data.payment_status };
  } catch {
    return { success: false };
  }
}