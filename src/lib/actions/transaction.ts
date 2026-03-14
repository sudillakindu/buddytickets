"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  Transaction,
  TransactionListResult,
} from "@/lib/types/transaction";

// --- Row shape returned by Supabase ---
interface TransactionRow {
  transaction_id: string;
  order_id: string;
  gateway: Transaction["gateway"];
  gateway_ref_id: string | null;
  amount: number;
  status: Transaction["status"];
  meta_data: Record<string, unknown> | null;
  created_at: string;
}

// --- Get transactions for a specific order ---
export async function getTransactionsByOrder(
  orderId: string,
): Promise<TransactionListResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };
    if (!orderId)
      return { success: false, message: "Order ID is required." };

    // Verify order belongs to user
    const { data: order, error: orderErr } = await getSupabaseAdmin()
      .from("orders")
      .select("order_id")
      .eq("order_id", orderId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order) return { success: false, message: "Order not found." };

    const { data, error } = await getSupabaseAdmin()
      .from("transactions")
      .select(
        "transaction_id, order_id, gateway, gateway_ref_id, amount, status, meta_data, created_at",
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const transactions: Transaction[] = (
      (data ?? []) as TransactionRow[]
    ).map((row) => ({
      transaction_id: row.transaction_id,
      order_id: row.order_id,
      gateway: row.gateway,
      gateway_ref_id: row.gateway_ref_id,
      amount: Number(row.amount),
      status: row.status,
      meta_data: row.meta_data,
      created_at: row.created_at,
    }));

    return { success: true, message: "Transactions loaded.", transactions };
  } catch (err) {
    logger.error({
      fn: "getTransactionsByOrder",
      message: "Error fetching transactions",
      meta: err,
    });
    return { success: false, message: "Failed to load transactions." };
  }
}
