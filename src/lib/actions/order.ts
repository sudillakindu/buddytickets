// lib/actions/order.ts
// Order query server actions.
// finalize_order_tickets RPC is called by the payment gateway webhook — not here.
// These actions are for reading order state (success page, user order history).

"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type { OrderSuccessData } from "@/lib/types/payment";

interface EventJoin {
  name: string;
  start_at: string;
  location: string;
}

// --- Order Success Data ---

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
    const { data: order, error: orderError } = await getSupabaseAdmin()
      .from("orders")
      .select(
        `order_id, user_id, final_amount, payment_status,
         events ( name, start_at, location )`,
      )
      .eq("order_id", orderId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return { success: false, message: "Order not found." };

    // Count tickets for this order
    const { count: ticketCount, error: countError } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id", { count: "exact", head: true })
      .eq("order_id", orderId);

    if (countError) throw countError;

    const ev = Array.isArray(order.events) ? order.events[0] : order.events;
    const eventData = ev as EventJoin | null;

    return {
      success: true,
      message: "Order found.",
      data: {
        order_id: order.order_id,
        event_name: eventData?.name ?? "—",
        event_start_at: eventData?.start_at ?? "",
        event_location: eventData?.location ?? "—",
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

// --- Order Status Polling ---

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
    const { data, error } = await getSupabaseAdmin()
      .from("orders")
      .select("payment_status")
      .eq("order_id", orderId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (error || !data) return { success: false };
    return { success: true, status: data.payment_status };
  } catch (err) {
    logger.error({ fn: "getOrderPaymentStatus", message: "Unexpected error", meta: err });
    return { success: false };
  }
}