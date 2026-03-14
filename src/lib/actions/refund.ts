"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  RefundRequest,
  RefundRequestInsert,
  RefundRequestResult,
  RefundRequestListResult,
} from "@/lib/types/refund";

const REFUND_SELECT = `
  refund_id, order_id, ticket_id, user_id, reason, refund_amount,
  status, admin_note, gateway_refund_ref, reviewed_by, reviewed_at,
  created_at, updated_at
` as const;

// --- Submit a refund request ---
export async function createRefundRequest(
  input: RefundRequestInsert,
): Promise<RefundRequestResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    if (!input.order_id) {
      return { success: false, message: "Order ID is required." };
    }

    if (!input.reason || input.reason.trim().length === 0) {
      return { success: false, message: "A refund reason is required." };
    }

    if (input.refund_amount <= 0) {
      return { success: false, message: "Refund amount must be greater than zero." };
    }

    // Verify the order belongs to the user
    const { data: order, error: orderErr } = await getSupabaseAdmin()
      .from("orders")
      .select("order_id, user_id, final_amount, payment_status")
      .eq("order_id", input.order_id)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order) return { success: false, message: "Order not found." };

    if (order.payment_status !== "PAID") {
      return { success: false, message: "Only paid orders can be refunded." };
    }

    if (input.refund_amount > Number(order.final_amount)) {
      return { success: false, message: "Refund amount exceeds order total." };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("refund_requests")
      .insert({
        order_id: input.order_id,
        ticket_id: input.ticket_id ?? null,
        user_id: session.sub,
        reason: input.reason.trim(),
        refund_amount: input.refund_amount,
        status: "PENDING",
      })
      .select(REFUND_SELECT)
      .single();

    if (error) throw error;

    return {
      success: true,
      message: "Refund request submitted.",
      refund: data as RefundRequest,
    };
  } catch (err) {
    logger.error({
      fn: "createRefundRequest",
      message: "Error creating refund request",
      meta: err,
    });
    return { success: false, message: "Failed to submit refund request." };
  }
}

// --- Get refund requests for the current user ---
export async function getUserRefundRequests(): Promise<RefundRequestListResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await getSupabaseAdmin()
      .from("refund_requests")
      .select(REFUND_SELECT)
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "Refund requests loaded.",
      refunds: (data ?? []) as RefundRequest[],
    };
  } catch (err) {
    logger.error({
      fn: "getUserRefundRequests",
      message: "Error fetching refund requests",
      meta: err,
    });
    return { success: false, message: "Failed to load refund requests." };
  }
}

// --- Get a single refund request by ID ---
export async function getRefundRequestById(
  refundId: string,
): Promise<RefundRequestResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    if (!refundId) {
      return { success: false, message: "Refund ID is required." };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("refund_requests")
      .select(REFUND_SELECT)
      .eq("refund_id", refundId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, message: "Refund request not found." };

    return {
      success: true,
      message: "Refund request loaded.",
      refund: data as RefundRequest,
    };
  } catch (err) {
    logger.error({
      fn: "getRefundRequestById",
      message: "Error fetching refund request",
      meta: err,
    });
    return { success: false, message: "Failed to load refund request." };
  }
}
