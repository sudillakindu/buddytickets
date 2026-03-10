// lib/actions/organizer_promotions-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ActionResult,
  ActionResultWithData,
  OrganizerPromotion,
  CreatePromotionInput,
} from "@/lib/types/organizer_dashboard";

async function requireOrganizer(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session.sub;
}

export async function getPromotions(): Promise<
  ActionResultWithData<OrganizerPromotion[]>
> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("promotions")
      .select(
        "promotion_id, code, description, discount_type, discount_value, max_discount_cap, min_order_amount, start_at, end_at, is_active, usage_limit_global, usage_limit_per_user, current_global_usage, scope_event_id, created_at",
      )
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({ fn: "getPromotions", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load promotions." };
    }

    // Get event names for scoped promotions
    const eventIds = [...new Set((data ?? []).filter((p) => p.scope_event_id).map((p) => p.scope_event_id!))];
    let eventMap = new Map<string, string>();
    if (eventIds.length > 0) {
      const { data: events } = await supabase
        .from("events")
        .select("event_id, name")
        .in("event_id", eventIds);
      eventMap = new Map((events ?? []).map((e) => [e.event_id, e.name]));
    }

    const result: OrganizerPromotion[] = (data ?? []).map((p) => ({
      promotion_id: p.promotion_id,
      code: p.code,
      description: p.description,
      discount_type: p.discount_type,
      discount_value: Number(p.discount_value),
      max_discount_cap: p.max_discount_cap ? Number(p.max_discount_cap) : null,
      min_order_amount: Number(p.min_order_amount ?? 0),
      start_at: p.start_at,
      end_at: p.end_at,
      is_active: p.is_active,
      usage_limit_global: p.usage_limit_global,
      usage_limit_per_user: p.usage_limit_per_user,
      current_global_usage: p.current_global_usage,
      scope_event_id: p.scope_event_id,
      scope_event_name: p.scope_event_id ? eventMap.get(p.scope_event_id) ?? null : null,
      created_at: p.created_at,
    }));

    return { success: true, message: "Promotions loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getPromotions", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function createPromotion(
  input: CreatePromotionInput,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    // Validate
    if (!input.code?.trim()) return { success: false, message: "Promo code is required." };
    if (!input.discount_value || input.discount_value <= 0) {
      return { success: false, message: "Discount value must be positive." };
    }
    if (!input.start_at || !input.end_at) {
      return { success: false, message: "Start and end dates are required." };
    }
    if (new Date(input.end_at) <= new Date(input.start_at)) {
      return { success: false, message: "End date must be after start date." };
    }
    if (!input.scope_event_id) {
      return { success: false, message: "An event must be selected for the promotion scope." };
    }

    const admin = getSupabaseAdmin();

    // Verify event ownership
    const { data: event } = await admin
      .from("events")
      .select("event_id")
      .eq("event_id", input.scope_event_id)
      .eq("organizer_id", userId)
      .maybeSingle();

    if (!event) {
      return { success: false, message: "Event not found or you don't own it." };
    }

    // Verify ticket type ownership if provided
    if (input.scope_ticket_type_id) {
      const { data: tt } = await admin
        .from("ticket_types")
        .select("ticket_type_id")
        .eq("ticket_type_id", input.scope_ticket_type_id)
        .eq("event_id", input.scope_event_id)
        .maybeSingle();

      if (!tt) {
        return { success: false, message: "Ticket type not found for this event." };
      }
    }

    const { error } = await admin.from("promotions").insert({
      code: input.code.trim().toUpperCase(),
      description: input.description?.trim() || null,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      max_discount_cap: input.max_discount_cap ?? null,
      min_order_amount: input.min_order_amount ?? 0,
      start_at: input.start_at,
      end_at: input.end_at,
      usage_limit_global: input.usage_limit_global ?? 0,
      usage_limit_per_user: input.usage_limit_per_user ?? 1,
      scope_event_id: input.scope_event_id,
      scope_ticket_type_id: input.scope_ticket_type_id ?? null,
      created_by: userId,
    });

    if (error) {
      logger.error({ fn: "createPromotion", message: "DB error", meta: error.message });
      if (error.code === "23505") {
        return { success: false, message: "A promotion with this code already exists." };
      }
      return { success: false, message: "Failed to create promotion." };
    }

    revalidatePath("/dashboard/organizer-promotions");
    return { success: true, message: "Promotion created." };
  } catch (err) {
    logger.error({ fn: "createPromotion", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function deactivatePromotion(
  promotionId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    // Verify ownership
    const { data: promo } = await admin
      .from("promotions")
      .select("is_active")
      .eq("promotion_id", promotionId)
      .eq("created_by", userId)
      .maybeSingle();

    if (!promo) {
      return { success: false, message: "Promotion not found." };
    }

    const { error } = await admin
      .from("promotions")
      .update({ is_active: false })
      .eq("promotion_id", promotionId)
      .eq("created_by", userId);

    if (error) {
      logger.error({ fn: "deactivatePromotion", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to deactivate promotion." };
    }

    revalidatePath("/dashboard/organizer-promotions");
    return { success: true, message: "Promotion deactivated." };
  } catch (err) {
    logger.error({ fn: "deactivatePromotion", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}
