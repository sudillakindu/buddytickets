"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  RefundRequest,
  CreateRefundInput,
  CreateRefundResult,
  ReviewRefundInput,
  ReviewRefundResult,
  GetRefundRequestsResult,
} from "@/lib/types/refund";

// --- Create a refund request ---

export async function createRefundRequest(
  input: CreateRefundInput,
): Promise<CreateRefundResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  const { order_id, ticket_id, reason, refund_amount } = input;
  if (!order_id || !reason?.trim() || !refund_amount || refund_amount <= 0)
    return { success: false, message: "Order ID, reason, and a valid refund amount are required." };

  try {
    // --- Verify order belongs to user and is paid ---
    const { data: order, error: orderErr } = await getSupabaseAdmin()
      .from("orders")
      .select("order_id, user_id, payment_status, final_amount")
      .eq("order_id", order_id)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order)
      return { success: false, message: "Order not found." };
    if (order.payment_status !== "PAID")
      return { success: false, message: "Only paid orders can be refunded." };
    if (refund_amount > Number(order.final_amount))
      return { success: false, message: "Refund amount exceeds the order total." };

    // --- Check for existing pending refund on same order ---
    const { data: existingRefund, error: existErr } = await getSupabaseAdmin()
      .from("refund_requests")
      .select("refund_id")
      .eq("order_id", order_id)
      .eq("user_id", session.sub)
      .eq("status", "PENDING")
      .maybeSingle();

    if (existErr) throw existErr;
    if (existingRefund)
      return { success: false, message: "A pending refund request already exists for this order." };

    // --- Create refund request ---
    const { data: refund, error: insertErr } = await getSupabaseAdmin()
      .from("refund_requests")
      .insert({
        order_id,
        ticket_id: ticket_id ?? null,
        user_id: session.sub,
        reason: reason.trim(),
        refund_amount,
        status: "PENDING",
      })
      .select(
        "refund_id, order_id, ticket_id, user_id, reason, refund_amount, status, admin_note, gateway_refund_ref, reviewed_by, reviewed_at, created_at, updated_at",
      )
      .single();

    if (insertErr) throw insertErr;

    return {
      success: true,
      message: "Refund request submitted successfully.",
      refund: refund as RefundRequest,
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

// --- Admin: Review (approve/reject) a refund request ---

export async function reviewRefundRequest(
  input: ReviewRefundInput,
): Promise<ReviewRefundResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  const { refund_id, status, admin_note, gateway_refund_ref } = input;
  if (!refund_id || !status)
    return { success: false, message: "Refund ID and decision are required." };

  try {
    const { data: refund, error: fetchErr } = await getSupabaseAdmin()
      .from("refund_requests")
      .select("refund_id, status, order_id, refund_amount")
      .eq("refund_id", refund_id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!refund)
      return { success: false, message: "Refund request not found." };
    if (refund.status !== "PENDING")
      return { success: false, message: "This refund request has already been reviewed." };

    const updateData: Record<string, unknown> = {
      status,
      reviewed_by: session.sub,
      reviewed_at: new Date().toISOString(),
      admin_note: admin_note?.trim() ?? null,
    };

    if (status === "APPROVED" && gateway_refund_ref) {
      updateData.gateway_refund_ref = gateway_refund_ref.trim();
    }

    const { error: updateErr } = await getSupabaseAdmin()
      .from("refund_requests")
      .update(updateData)
      .eq("refund_id", refund_id);

    if (updateErr) throw updateErr;

    // --- If approved, update order payment status to REFUNDED ---
    if (status === "APPROVED") {
      const { error: orderUpdateErr } = await getSupabaseAdmin()
        .from("orders")
        .update({ payment_status: "REFUNDED" })
        .eq("order_id", refund.order_id);

      if (orderUpdateErr) {
        logger.error({
          fn: "reviewRefundRequest.orderUpdate",
          message: `Failed to update order status for refund ${refund_id}`,
          meta: orderUpdateErr.message,
        });
      }
    }

    return {
      success: true,
      message: status === "APPROVED"
        ? "Refund approved successfully."
        : "Refund request rejected.",
    };
  } catch (err) {
    logger.error({
      fn: "reviewRefundRequest",
      message: "Error reviewing refund request",
      meta: err,
    });
    return { success: false, message: "Failed to review refund request." };
  }
}

// --- Get user's refund requests ---

export async function getUserRefundRequests(): Promise<GetRefundRequestsResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("refund_requests")
      .select(
        "refund_id, order_id, ticket_id, user_id, reason, refund_amount, status, admin_note, gateway_refund_ref, reviewed_by, reviewed_at, created_at, updated_at",
      )
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

// --- Admin: Get all pending refund requests ---

export async function getPendingRefundRequests(): Promise<GetRefundRequestsResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("refund_requests")
      .select(
        "refund_id, order_id, ticket_id, user_id, reason, refund_amount, status, admin_note, gateway_refund_ref, reviewed_by, reviewed_at, created_at, updated_at",
      )
      .eq("status", "PENDING")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      message: "Pending refund requests loaded.",
      refunds: (data ?? []) as RefundRequest[],
    };
  } catch (err) {
    logger.error({
      fn: "getPendingRefundRequests",
      message: "Error fetching pending refund requests",
      meta: err,
    });
    return { success: false, message: "Failed to load refund requests." };
  }
}
