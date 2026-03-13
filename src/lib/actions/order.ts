"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type { OrderSuccessData, PaymentStatus } from "@/lib/types/payment";

// --- Local row shape for the order + event join ---

interface OrderWithEventRow {
  order_id: string;
  user_id: string;
  final_amount: number;
  payment_status: PaymentStatus;
  events: { name: string; start_at: string; location: string } | null;
}

// Fetch order success data for /checkout/success page
export async function getOrderSuccessData(
  orderId: string,
): Promise<{ success: boolean; message: string; data?: OrderSuccessData }> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!orderId) return { success: false, message: "Order ID required." };

  try {
    const { data: order, error: orderErr } = await getSupabaseAdmin()
      .from("orders")
      .select(
        `order_id, user_id, final_amount, payment_status, events ( name, start_at, location )`,
      )
      .eq("order_id", orderId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order) return { success: false, message: "Order not found." };

    const { count: ticketCount, error: countErr } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id", { count: "exact", head: true })
      .eq("order_id", orderId);

    if (countErr) throw countErr;

    const raw = order as unknown as OrderWithEventRow;
    const ev = Array.isArray(raw.events) ? raw.events[0] : raw.events;

    return {
      success: true,
      message: "Order found.",
      data: {
        order_id: raw.order_id,
        event_name: ev?.name ?? "—",
        event_start_at: ev?.start_at ?? "",
        event_location: ev?.location ?? "—",
        ticket_count: ticketCount ?? 0,
        final_amount: Number(raw.final_amount),
        payment_status: raw.payment_status,
      },
    };
  } catch (err) {
    logger.error({ fn: "getOrderSuccessData", message: "Error", meta: err });
    return { success: false, message: "Failed to load order." };
  }
}

// Poll order payment status
export async function getOrderPaymentStatus(
  orderId: string,
): Promise<{ success: boolean; status?: string }> {
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
    logger.error({
      fn: "getOrderPaymentStatus",
      message: "Error polling payment status",
      meta: err,
    });
    return { success: false };
  }
}
