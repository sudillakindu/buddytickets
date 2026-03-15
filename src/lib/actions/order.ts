"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/types/supabase";

type PaymentStatus = Database["public"]["Enums"]["payment_status"];

interface OrderSuccessData {
  order_id: string;
  event_name: string;
  event_start_at: string;
  event_location: string;
  ticket_count: number;
  final_amount: number;
  payment_status: PaymentStatus;
}

// --- Composite Join Type for Read Operations ---
type OrderWithEventRow = Pick<
  Database["public"]["Tables"]["orders"]["Row"],
  "order_id" | "user_id" | "final_amount" | "payment_status"
> & {
  events: Pick<
    Database["public"]["Tables"]["events"]["Row"],
    "name" | "start_at" | "location"
  > | null;
};

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

    const typed = order as unknown as OrderWithEventRow;
    const ev = typed.events;

    return {
      success: true,
      message: "Order found.",
      data: {
        order_id: typed.order_id,
        event_name: ev?.name ?? "—",
        event_start_at: ev?.start_at ?? "",
        event_location: ev?.location ?? "—",
        ticket_count: ticketCount ?? 0,
        final_amount: Number(typed.final_amount),
        payment_status: typed.payment_status ?? "PENDING",
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
  } catch {
    return { success: false };
  }
}
