// lib/actions/system_reviews-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  PaginatedResult,
  ActionResult,
  SystemReview,
} from "@/lib/types/system";

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getReviews(filters: {
  is_visible?: boolean;
  rating?: number;
  event_id?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResult<SystemReview>> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = await createClient();

    let query = supabase
      .from("reviews")
      .select("*, users:user_id(name), events:event_id(name)", {
        count: "exact",
      });

    if (filters.is_visible !== undefined) {
      query = query.eq("is_visible", filters.is_visible);
    }

    if (filters.rating !== undefined) {
      query = query.eq("rating", filters.rating);
    }

    if (filters.event_id) {
      query = query.eq("event_id", filters.event_id);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getReviews",
        message: "DB fetch error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load reviews." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews: SystemReview[] = (data ?? []).map((row: any) => ({
      review_id: row.review_id,
      event_id: row.event_id,
      user_id: row.user_id,
      ticket_id: row.ticket_id,
      rating: row.rating,
      review_text: row.review_text,
      is_visible: row.is_visible,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_name: row.users?.name ?? "Unknown",
      event_name: row.events?.name ?? "Unknown",
    }));

    return {
      success: true,
      message: "Reviews loaded.",
      data: reviews,
      total_count: count ?? 0,
      page,
      per_page: perPage,
    };
  } catch (err) {
    logger.error({
      fn: "getReviews",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function toggleReviewVisibility(
  reviewId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { data: review, error: fetchErr } = await admin
      .from("reviews")
      .select("is_visible")
      .eq("review_id", reviewId)
      .maybeSingle();

    if (fetchErr || !review) {
      if (fetchErr)
        logger.error({
          fn: "toggleReviewVisibility",
          message: "DB fetch error",
          meta: fetchErr.message,
        });
      return { success: false, message: "Review not found." };
    }

    const { error: updateErr } = await admin
      .from("reviews")
      .update({ is_visible: !review.is_visible })
      .eq("review_id", reviewId);

    if (updateErr) {
      logger.error({
        fn: "toggleReviewVisibility",
        message: "DB update error",
        meta: updateErr.message,
      });
      return {
        success: false,
        message: "Failed to update review visibility.",
      };
    }

    revalidatePath("/dashboard/system-overview");
    return {
      success: true,
      message: review.is_visible ? "Review hidden." : "Review visible.",
    };
  } catch (err) {
    logger.error({
      fn: "toggleReviewVisibility",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}
