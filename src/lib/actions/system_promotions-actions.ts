// lib/actions/system_promotions-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  PaginatedResult,
  ActionResult,
  SystemPromotion,
  DiscountType,
} from "@/lib/types/system";

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getPromotions(filters: {
  is_active?: boolean;
  scope?: "global" | "event";
  page?: number;
  per_page?: number;
}): Promise<PaginatedResult<SystemPromotion>> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = await createClient();

    let query = supabase
      .from("promotions")
      .select(
        "*, events:scope_event_id(name), promotion_usages(count)",
        { count: "exact" },
      );

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters.scope === "global") {
      query = query.is("scope_event_id", null);
    } else if (filters.scope === "event") {
      query = query.not("scope_event_id", "is", null);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getPromotions",
        message: "DB fetch error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load promotions." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promotions: SystemPromotion[] = (data ?? []).map((row: any) => ({
      promotion_id: row.promotion_id,
      code: row.code,
      description: row.description,
      discount_type: row.discount_type,
      discount_value: row.discount_value,
      max_discount_cap: row.max_discount_cap,
      min_order_amount: row.min_order_amount,
      start_at: row.start_at,
      end_at: row.end_at,
      is_active: row.is_active,
      usage_limit_global: row.usage_limit_global,
      usage_limit_per_user: row.usage_limit_per_user,
      current_global_usage: row.current_global_usage,
      scope_event_id: row.scope_event_id,
      scope_ticket_type_id: row.scope_ticket_type_id,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      version: row.version,
      usage_count: row.promotion_usages?.[0]?.count ?? 0,
      scope_event_name: row.events?.name ?? null,
    }));

    return {
      success: true,
      message: "Promotions loaded.",
      data: promotions,
      total_count: count ?? 0,
      page,
      per_page: perPage,
    };
  } catch (err) {
    logger.error({
      fn: "getPromotions",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createPromotion(data: {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_cap?: number;
  min_order_amount?: number;
  start_at: string;
  end_at: string;
  usage_limit_global?: number;
  usage_limit_per_user?: number;
  scope_event_id?: string;
}): Promise<ActionResult> {
  try {
    const currentUserId = await requireSystem();
    if (!currentUserId) return { success: false, message: "Unauthorized." };

    if (!data.code.trim()) {
      return { success: false, message: "Promotion code is required." };
    }

    const admin = getSupabaseAdmin();

    const { error } = await admin.from("promotions").insert({
      code: data.code.trim().toUpperCase(),
      description: data.description?.trim() || null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      max_discount_cap: data.max_discount_cap ?? null,
      min_order_amount: data.min_order_amount ?? null,
      start_at: data.start_at,
      end_at: data.end_at,
      usage_limit_global: data.usage_limit_global ?? null,
      usage_limit_per_user: data.usage_limit_per_user ?? null,
      scope_event_id: data.scope_event_id ?? null,
      created_by: currentUserId,
    });

    if (error) {
      logger.error({
        fn: "createPromotion",
        message: "DB insert error",
        meta: error.message,
      });
      return { success: false, message: "Failed to create promotion." };
    }

    revalidatePath("/dashboard/system-overview");
    return { success: true, message: "Promotion created." };
  } catch (err) {
    logger.error({
      fn: "createPromotion",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function togglePromotionActive(
  promotionId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { data: promo, error: fetchErr } = await admin
      .from("promotions")
      .select("is_active")
      .eq("promotion_id", promotionId)
      .maybeSingle();

    if (fetchErr || !promo) {
      if (fetchErr)
        logger.error({
          fn: "togglePromotionActive",
          message: "DB fetch error",
          meta: fetchErr.message,
        });
      return { success: false, message: "Promotion not found." };
    }

    const { error: updateErr } = await admin
      .from("promotions")
      .update({ is_active: !promo.is_active })
      .eq("promotion_id", promotionId);

    if (updateErr) {
      logger.error({
        fn: "togglePromotionActive",
        message: "DB update error",
        meta: updateErr.message,
      });
      return {
        success: false,
        message: "Failed to update promotion status.",
      };
    }

    revalidatePath("/dashboard/system-overview");
    return {
      success: true,
      message: promo.is_active
        ? "Promotion deactivated."
        : "Promotion activated.",
    };
  } catch (err) {
    logger.error({
      fn: "togglePromotionActive",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}
