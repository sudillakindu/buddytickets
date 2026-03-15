"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  RefundRequest,
  CreateRefundInput,
  RefundRequestResult,
  RefundListResult,
} from "@/lib/types/refund";

interface RefundRow {
  refund_id: string;
  order_id: string;
  ticket_id: string | null;
  user_id: string;
  reason: string;
  refund_amount: number;
  status: RefundRequest["status"];
  admin_note: string | null;
  gateway_refund_ref: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

// --- Create Refund Request ---
export async function createRefundRequest(
  input: CreateRefundInput,
): Promise<RefundRequestResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!input.order_id)
    return { success: false, message: "Order ID required." };
  if (!input.reason) return { success: false, message: "Reason required." };
  if (!input.refund_amount || input.refund_amount <= 0)
    return { success: false, message: "Valid refund amount required." };

  try {
    const supabase = getSupabaseAdmin();

    // Validate user owns the order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("order_id")
      .eq("order_id", input.order_id)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order)
      return { success: false, message: "Order not found or not yours." };

    // Insert refund request
    const { data: refund, error: insertErr } = await supabase
      .from("refund_requests")
      .insert({
        order_id: input.order_id,
        ticket_id: input.ticket_id ?? null,
        user_id: session.sub,
        reason: input.reason,
        refund_amount: input.refund_amount,
        status: "PENDING",
      })
      .select("*")
      .single();

    if (insertErr) throw insertErr;

    return {
      success: true,
      message: "Refund request submitted.",
      refund: refund as unknown as RefundRequest,
    };
  } catch (err) {
    logger.error({ fn: "createRefundRequest", message: "Error", meta: err });
    return { success: false, message: "Failed to submit refund request." };
  }
}

// --- Get User Refund Requests ---
export async function getUserRefundRequests(): Promise<RefundListResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("refund_requests")
      .select("*")
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const refunds = (data ?? []).map((row) => {
      const typed = row as unknown as RefundRow;
      return {
        refund_id: typed.refund_id,
        order_id: typed.order_id,
        ticket_id: typed.ticket_id,
        user_id: typed.user_id,
        reason: typed.reason,
        refund_amount: Number(typed.refund_amount),
        status: typed.status,
        admin_note: typed.admin_note,
        gateway_refund_ref: typed.gateway_refund_ref,
        reviewed_by: typed.reviewed_by,
        reviewed_at: typed.reviewed_at,
        created_at: typed.created_at,
        updated_at: typed.updated_at,
      } satisfies RefundRequest;
    });

    return { success: true, message: "Refund requests loaded.", refunds };
  } catch (err) {
    logger.error({
      fn: "getUserRefundRequests",
      message: "Error",
      meta: err,
    });
    return { success: false, message: "Failed to load refund requests." };
  }
}

// --- Get Refund Request By ID ---
export async function getRefundRequestById(
  refundId: string,
): Promise<RefundRequestResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!refundId) return { success: false, message: "Refund ID required." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("refund_requests")
      .select("*")
      .eq("refund_id", refundId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (error) throw error;
    if (!data)
      return { success: false, message: "Refund request not found." };

    return {
      success: true,
      message: "Refund request loaded.",
      refund: data as unknown as RefundRequest,
    };
  } catch (err) {
    logger.error({
      fn: "getRefundRequestById",
      message: "Error",
      meta: err,
    });
    return { success: false, message: "Failed to load refund request." };
  }
}
