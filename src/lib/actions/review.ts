"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  Review,
  ReviewInsert,
  ReviewResult,
  ReviewListResult,
} from "@/lib/types/review";

const REVIEW_SELECT = `
  review_id, event_id, user_id, ticket_id, rating, review_text,
  is_visible, created_at, updated_at
` as const;

// --- Submit a review for an event ---
export async function createReview(
  input: ReviewInsert,
): Promise<ReviewResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    if (!input.event_id) {
      return { success: false, message: "Event ID is required." };
    }

    if (!input.ticket_id) {
      return { success: false, message: "Ticket ID is required as proof of attendance." };
    }

    if (!input.rating || input.rating < 1 || input.rating > 5) {
      return { success: false, message: "Rating must be between 1 and 5." };
    }

    // Verify the ticket belongs to the user and is USED
    const { data: ticket, error: ticketErr } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id, owner_user_id, event_id, status")
      .eq("ticket_id", input.ticket_id)
      .eq("owner_user_id", session.sub)
      .eq("event_id", input.event_id)
      .maybeSingle();

    if (ticketErr) throw ticketErr;
    if (!ticket) return { success: false, message: "Ticket not found." };

    if (ticket.status !== "USED") {
      return {
        success: false,
        message: "You can only review events you have attended.",
      };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .insert({
        event_id: input.event_id,
        user_id: session.sub,
        ticket_id: input.ticket_id,
        rating: input.rating,
        review_text: input.review_text?.trim() || null,
      })
      .select(REVIEW_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "You have already reviewed this event." };
      }
      throw error;
    }

    return {
      success: true,
      message: "Review submitted.",
      review: data as Review,
    };
  } catch (err) {
    logger.error({
      fn: "createReview",
      message: "Error creating review",
      meta: err,
    });
    return { success: false, message: "Failed to submit review." };
  }
}

// --- Get visible reviews for an event ---
export async function getReviewsByEvent(
  eventId: string,
): Promise<ReviewListResult> {
  try {
    if (!eventId) {
      return { success: false, message: "Event ID is required." };
    }

    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select(REVIEW_SELECT)
      .eq("event_id", eventId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "Reviews loaded.",
      reviews: (data ?? []) as Review[],
    };
  } catch (err) {
    logger.error({
      fn: "getReviewsByEvent",
      message: "Error fetching reviews",
      meta: err,
    });
    return { success: false, message: "Failed to load reviews." };
  }
}

// --- Get reviews by the current user ---
export async function getUserReviews(): Promise<ReviewListResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select(REVIEW_SELECT)
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: "Reviews loaded.",
      reviews: (data ?? []) as Review[],
    };
  } catch (err) {
    logger.error({
      fn: "getUserReviews",
      message: "Error fetching user reviews",
      meta: err,
    });
    return { success: false, message: "Failed to load reviews." };
  }
}
