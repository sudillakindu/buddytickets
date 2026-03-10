// lib/actions/system-payments.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemOrderRow,
  SystemTransactionRow,
  SystemListResult,
} from "@/lib/types/system";
import type { PaymentStatus } from "@/lib/types/payment";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session?.sub || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function getSystemOrders(
  statusFilter: "ALL" | PaymentStatus = "ALL",
  page: number = 1,
  pageSize: number = 10,
): Promise<SystemListResult<SystemOrderRow>> {
  try {
    const userId = await requireSystem();
    if (!userId) {
      return { success: false, message: "Unauthorized.", data: [], total: 0 };
    }

    const db = getSupabaseAdmin();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = db
      .from("orders")
      .select(
        "order_id, user_id, event_id, subtotal, discount_amount, final_amount, payment_source, payment_status, created_at, user:users!orders_user_id_fkey(name, email), event:events!orders_event_id_fkey(name)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (statusFilter !== "ALL") {
      query = query.eq("payment_status", statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getSystemOrders",
        message: "Failed to fetch orders",
        meta: error.message,
      });
      return { success: false, message: "Failed to fetch orders.", data: [], total: 0 };
    }

    const rows: SystemOrderRow[] = (data ?? []).map((o) => ({
      ...o,
      user: Array.isArray(o.user) ? o.user[0] : o.user,
      event: Array.isArray(o.event) ? o.event[0] : o.event,
    }));

    return {
      success: true,
      message: "Orders loaded.",
      data: rows,
      total: count ?? 0,
    };
  } catch (err) {
    logger.error({
      fn: "getSystemOrders",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error.", data: [], total: 0 };
  }
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function getSystemTransactions(
  page: number = 1,
  pageSize: number = 10,
): Promise<SystemListResult<SystemTransactionRow>> {
  try {
    const userId = await requireSystem();
    if (!userId) {
      return { success: false, message: "Unauthorized.", data: [], total: 0 };
    }

    const db = getSupabaseAdmin();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await db
      .from("transactions")
      .select(
        "transaction_id, order_id, gateway, gateway_ref_id, amount, status, created_at, order:orders!transactions_order_id_fkey(user_id, event_id, payment_source, payment_status, final_amount)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      logger.error({
        fn: "getSystemTransactions",
        message: "Failed to fetch transactions",
        meta: error.message,
      });
      return { success: false, message: "Failed to fetch transactions.", data: [], total: 0 };
    }

    const rows: SystemTransactionRow[] = (data ?? []).map((t) => ({
      ...t,
      order: Array.isArray(t.order) ? t.order[0] : t.order,
    }));

    return {
      success: true,
      message: "Transactions loaded.",
      data: rows,
      total: count ?? 0,
    };
  } catch (err) {
    logger.error({
      fn: "getSystemTransactions",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error.", data: [], total: 0 };
  }
}
