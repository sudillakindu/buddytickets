"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type { Transaction } from "@/lib/types/transaction";

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

// --- Get Transactions For Order ---
export async function getTransactionsForOrder(
  orderId: string,
): Promise<{
  success: boolean;
  message: string;
  transactions?: Transaction[];
}> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!orderId) return { success: false, message: "Order ID required." };

  try {
    const supabase = getSupabaseAdmin();

    // Validate user owns the order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("order_id")
      .eq("order_id", orderId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order)
      return { success: false, message: "Order not found or not yours." };

    // Fetch transactions for the order
    const { data, error } = await supabase
      .from("transactions")
      .select(
        `transaction_id, order_id, gateway, gateway_ref_id, amount, status, meta_data, created_at`,
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const transactions = (data ?? []).map((row) => {
      const typed = row as unknown as TransactionRow;
      return {
        transaction_id: typed.transaction_id,
        order_id: typed.order_id,
        gateway: typed.gateway,
        gateway_ref_id: typed.gateway_ref_id,
        amount: Number(typed.amount),
        status: typed.status,
        meta_data: typed.meta_data,
        created_at: typed.created_at,
      } satisfies Transaction;
    });

    return {
      success: true,
      message: "Transactions loaded.",
      transactions,
    };
  } catch (err) {
    logger.error({
      fn: "getTransactionsForOrder",
      message: "Error",
      meta: err,
    });
    return { success: false, message: "Failed to load transactions." };
  }
}
