"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type {
  Transaction,
  TransactionResult,
} from "@/lib/types/transaction";

const TRANSACTION_SELECT = `
  transaction_id, order_id, gateway, gateway_ref_id,
  amount, status, meta_data, created_at
` as const;

// --- Get transactions for an order ---
export async function getTransactionsByOrder(
  orderId: string,
): Promise<TransactionResult> {
  try {
    if (!orderId) {
      return { success: false, message: "Order ID is required." };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("transactions")
      .select(TRANSACTION_SELECT)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "Transactions loaded.",
      transactions: (data ?? []) as Transaction[],
    };
  } catch (err) {
    logger.error({
      fn: "getTransactionsByOrder",
      message: "Error fetching transactions",
      meta: err,
    });
    return { success: false, message: "Failed to load transactions." };
  }
}
