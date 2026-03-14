"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  Review,
  CreateReviewInput,
  ReviewActionResult,
  ReviewListResult,
} from "@/lib/types/review";

// --- Row shape returned by Supabase ---
interface ReviewRow {
  review_id: string;
  event_id: string;
  user_id: string;
  ticket_id: string;
  rating: number;
  review_text: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string | null;
}

function mapRowToReview(row: ReviewRow): Review {
  return {
    review_id: row.review_id,
    event_id: row.event_id,
    user_id: row.user_id,
    ticket_id: row.ticket_id,
    rating: row.rating,
    review_text: row.review_text,
    is_visible: row.is_visible,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const REVIEW_SELECT =
  "review_id, event_id, user_id, ticket_id, rating, review_text, is_visible, created_at, updated_at";

// --- Submit a review for a completed event ---
export async function createReview(
  input: CreateReviewInput,
): Promise<ReviewActionResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };

    if (!input.event_id)
      return { success: false, message: "Event ID is required." };
    if (!input.ticket_id)
      return { success: false, message: "Ticket ID is required." };
    if (input.rating < 1 || input.rating > 5)
      return { success: false, message: "Rating must be between 1 and 5." };

    // Verify the ticket belongs to user and is USED (attended the event)
    const { data: ticket, error: ticketErr } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id, event_id, status")
      .eq("ticket_id", input.ticket_id)
      .eq("owner_user_id", session.sub)
      .maybeSingle();

    if (ticketErr) throw ticketErr;
    if (!ticket)
      return { success: false, message: "Ticket not found." };
    if (ticket.event_id !== input.event_id)
      return { success: false, message: "Ticket does not belong to this event." };
    if (ticket.status !== "USED")
      return {
        success: false,
        message: "You can only review events you have attended.",
      };

    // Verify event is COMPLETED
    const { data: event, error: eventErr } = await getSupabaseAdmin()
      .from("events")
      .select("status")
      .eq("event_id", input.event_id)
      .maybeSingle();

    if (eventErr) throw eventErr;
    if (!event || event.status !== "COMPLETED")
      return {
        success: false,
        message: "Reviews can only be submitted for completed events.",
      };

    const { data: review, error: insertErr } = await getSupabaseAdmin()
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

    if (insertErr) {
      // Handle unique constraint (one review per user per event)
      if (insertErr.code === "23505")
        return {
          success: false,
          message: "You have already reviewed this event.",
        };
      throw insertErr;
    }

    return {
      success: true,
      message: "Review submitted successfully. Thank you for your feedback!",
      review: mapRowToReview(review as ReviewRow),
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
export async function getEventReviews(
  eventId: string,
): Promise<ReviewListResult> {
  try {
    if (!eventId)
      return { success: false, message: "Event ID is required." };

    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select(REVIEW_SELECT)
      .eq("event_id", eventId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reviews = ((data ?? []) as ReviewRow[]).map(mapRowToReview);
    const totalCount = reviews.length;
    const averageRating =
      totalCount > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10,
          ) / 10
        : 0;

    return {
      success: true,
      message: "Reviews loaded.",
      reviews,
      average_rating: averageRating,
      total_count: totalCount,
    };
  } catch (err) {
    logger.error({
      fn: "getEventReviews",
      message: "Error fetching reviews",
      meta: err,
    });
    return { success: false, message: "Failed to load reviews." };
  }
}

// --- Get current user's review for an event ---
export async function getUserReviewForEvent(
  eventId: string,
): Promise<ReviewActionResult> {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized." };
    if (!eventId) return { success: false, message: "Event ID is required." };

    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select(REVIEW_SELECT)
      .eq("event_id", eventId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (error) throw error;
    if (!data)
      return { success: false, message: "No review found for this event." };

    return {
      success: true,
      message: "Review loaded.",
      review: mapRowToReview(data as ReviewRow),
    };
  } catch (err) {
    logger.error({
      fn: "getUserReviewForEvent",
      message: "Error fetching user review",
      meta: err,
    });
    return { success: false, message: "Failed to load review." };
  }
}
