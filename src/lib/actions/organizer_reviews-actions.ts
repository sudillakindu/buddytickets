// lib/actions/organizer_reviews-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ActionResultWithData,
  OrganizerReview,
} from "@/lib/types/organizer_dashboard";

async function requireOrganizer(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session.sub;
}

export async function getReviews(filters?: {
  event_id?: string;
  rating?: number;
}): Promise<ActionResultWithData<OrganizerReview[]>> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    const supabase = await createClient();

    // Get organizer's events
    const { data: events } = await supabase
      .from("events")
      .select("event_id, name")
      .eq("organizer_id", userId);

    const eventIds = (events ?? []).map((e) => e.event_id);
    if (eventIds.length === 0) {
      return { success: true, message: "No reviews.", data: [] };
    }

    const eventMap = new Map((events ?? []).map((e) => [e.event_id, e.name]));

    let query = supabase
      .from("reviews")
      .select(
        "review_id, event_id, user_id, rating, review_text, is_visible, created_at",
      )
      .in("event_id", eventIds)
      .order("created_at", { ascending: false });

    if (filters?.event_id) query = query.eq("event_id", filters.event_id);
    if (filters?.rating) query = query.eq("rating", filters.rating);

    const { data, error } = await query;

    if (error) {
      logger.error({ fn: "getReviews", message: "DB error", meta: error.message });
      return { success: false, message: "Failed to load reviews." };
    }

    // Get user names
    const userIds = [...new Set((data ?? []).map((r) => r.user_id))];
    let userMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("user_id, name")
        .in("user_id", userIds);
      userMap = new Map((users ?? []).map((u) => [u.user_id, u.name]));
    }

    const result: OrganizerReview[] = (data ?? []).map((r) => ({
      review_id: r.review_id,
      event_id: r.event_id,
      event_name: eventMap.get(r.event_id) ?? "Unknown",
      user_name: userMap.get(r.user_id) ?? "Anonymous",
      rating: r.rating,
      review_text: r.review_text,
      is_visible: r.is_visible,
      created_at: r.created_at,
    }));

    return { success: true, message: "Reviews loaded.", data: result };
  } catch (err) {
    logger.error({ fn: "getReviews", message: "Unexpected error", meta: err });
    return { success: false, message: "An unexpected error occurred." };
  }
}
