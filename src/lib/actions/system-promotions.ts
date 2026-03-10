// lib/actions/system-promotions.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemActionResult,
  SystemPromotion,
  GetPromotionsResult,
  DiscountType,
} from "@/lib/types/system";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Get Promotions ──────────────────────────────────────────────────────────

export async function getPromotions(): Promise<GetPromotionsResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized", promotions: [] };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("promotions")
      .select(
        `promotion_id, code, description, discount_type, discount_value,
         is_active, usage_limit_global, current_global_usage, start_at, end_at,
         scope_event_id, created_at`,
      )
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({ fn: "getPromotions", message: error.message });
      return { success: false, message: "Failed to fetch promotions", promotions: [] };
    }

    return {
      success: true,
      message: "Promotions fetched",
      promotions: (data ?? []) as SystemPromotion[],
    };
  } catch (err) {
    logger.error({ fn: "getPromotions", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error", promotions: [] };
  }
}

// ─── Create Promotion ────────────────────────────────────────────────────────

export async function createPromotion(input: {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  start_at: string;
  end_at: string;
  usage_limit_global: number;
}): Promise<SystemActionResult> {
  const adminUserId = await requireSystem();
  if (!adminUserId) {
    return { success: false, message: "Unauthorized" };
  }

  if (!input.code.trim()) {
    return { success: false, message: "Promotion code is required" };
  }

  if (input.discount_value <= 0) {
    return { success: false, message: "Discount value must be positive" };
  }

  if (
    input.discount_type === "PERCENTAGE" &&
    input.discount_value > 100
  ) {
    return { success: false, message: "Percentage discount cannot exceed 100%" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("promotions").insert({
      code: input.code.trim().toUpperCase(),
      description: input.description.trim() || null,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      start_at: input.start_at,
      end_at: input.end_at,
      is_active: true,
      usage_limit_global: input.usage_limit_global,
      scope_event_id: null, // Platform-wide
      created_by: adminUserId,
    });

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "A promotion with this code already exists" };
      }
      logger.error({ fn: "createPromotion", message: error.message });
      return { success: false, message: "Failed to create promotion" };
    }

    return { success: true, message: "Promotion created" };
  } catch (err) {
    logger.error({ fn: "createPromotion", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Update Promotion ────────────────────────────────────────────────────────

export async function updatePromotion(
  promotionId: string,
  input: {
    code: string;
    description: string;
    discount_type: DiscountType;
    discount_value: number;
    start_at: string;
    end_at: string;
    usage_limit_global: number;
  },
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  if (!input.code.trim()) {
    return { success: false, message: "Promotion code is required" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("promotions")
      .update({
        code: input.code.trim().toUpperCase(),
        description: input.description.trim() || null,
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        start_at: input.start_at,
        end_at: input.end_at,
        usage_limit_global: input.usage_limit_global,
      })
      .eq("promotion_id", promotionId);

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "A promotion with this code already exists" };
      }
      logger.error({ fn: "updatePromotion", message: error.message });
      return { success: false, message: "Failed to update promotion" };
    }

    return { success: true, message: "Promotion updated" };
  } catch (err) {
    logger.error({ fn: "updatePromotion", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Toggle Promotion Active ─────────────────────────────────────────────────

export async function togglePromotionActive(
  promotionId: string,
  isActive: boolean,
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("promotions")
      .update({ is_active: isActive })
      .eq("promotion_id", promotionId);

    if (error) {
      logger.error({ fn: "togglePromotionActive", message: error.message });
      return { success: false, message: "Failed to update promotion" };
    }

    return {
      success: true,
      message: `Promotion ${isActive ? "activated" : "deactivated"}`,
    };
  } catch (err) {
    logger.error({ fn: "togglePromotionActive", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}
