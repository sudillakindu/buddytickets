"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  RefundRequest,
  CreateRefundInput,
  RefundRequestResult,
  RefundListResult,
} from "@/lib/types/refund";

// --- Row shape returned by Supabase ---
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

function mapRowToRefund(row: RefundRow): RefundRequest {
  return {
    refund_id: row.refund_id,
    order_id: row.order_id,
    ticket_id: row.ticket_id,
    user_id: row.user_id,
    reason: row.reason,
    refund_amount: Number(row.refund_amount),
    status: row.status,
    admin_note: row.admin_note,
    gateway_refund_ref: row.gateway_refund_ref,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const REFUND_SELECT =
  "refund_id, order_id, ticket_id, user_id, reason, refund_amount, status, admin_note, gateway_refund_ref, reviewed_by, reviewed_at, created_at, updated_at";

// --- Submit a refund request ---
export async function createRefundRequest(
  input: CreateRefundInput,
): Promise<RefundRequestResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    if (!input.order_id)
      return { success: false, message: "Order ID is required." };
    if (!input.reason.trim())
      return { success: false, message: "Please provide a reason for the refund." };
    if (input.refund_amount <= 0)
      return { success: false, message: "Refund amount must be greater than zero." };

    // Verify order belongs to user and is PAID
    const { data: order, error: orderErr } = await getSupabaseAdmin()
      .from("orders")
      .select("order_id, final_amount, payment_status")
      .eq("order_id", input.order_id)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order) return { success: false, message: "Order not found." };
    if (order.payment_status !== "PAID")
      return {
        success: false,
        message: "Only paid orders can be refunded.",
      };
    if (input.refund_amount > Number(order.final_amount))
      return {
        success: false,
        message: "Refund amount cannot exceed order total.",
      };

    // If ticket-specific refund, verify ticket belongs to this order
    if (input.ticket_id) {
      const { data: ticket, error: ticketErr } = await getSupabaseAdmin()
        .from("tickets")
        .select("ticket_id")
        .eq("ticket_id", input.ticket_id)
        .eq("order_id", input.order_id)
        .maybeSingle();

      if (ticketErr) throw ticketErr;
      if (!ticket)
        return {
          success: false,
          message: "Ticket not found in this order.",
        };
    }

    // Check for existing pending refund on same order
    const { data: existing, error: existErr } = await getSupabaseAdmin()
      .from("refund_requests")
      .select("refund_id")
      .eq("order_id", input.order_id)
      .eq("user_id", session.sub)
      .eq("status", "PENDING")
      .maybeSingle();

    if (existErr) throw existErr;
    if (existing)
      return {
        success: false,
        message: "You already have a pending refund request for this order.",
      };

    const { data: refund, error: insertErr } = await getSupabaseAdmin()
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

    if (insertErr) throw insertErr;

    return {
      success: true,
      message: "Refund request submitted. We will review it shortly.",
      refund: mapRowToRefund(refund as RefundRow),
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

// --- Get user's refund requests ---
export async function getUserRefundRequests(): Promise<RefundListResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await getSupabaseAdmin()
      .from("refund_requests")
      .select(REFUND_SELECT)
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const refunds = ((data ?? []) as RefundRow[]).map(mapRowToRefund);
    return { success: true, message: "Refund requests loaded.", refunds };
  } catch (err) {
    logger.error({
      fn: "getUserRefundRequests",
      message: "Error fetching refund requests",
      meta: err,
    });
    return { success: false, message: "Failed to load refund requests." };
  }
}
