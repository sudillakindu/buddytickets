"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  Review,
  CreateReviewInput,
  CreateReviewResult,
  GetEventReviewsResult,
  GetUserReviewsResult,
} from "@/lib/types/review";

// --- Create a review for an attended event ---

export async function createReview(
  input: CreateReviewInput,
): Promise<CreateReviewResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Please sign in to leave a review." };

  const { event_id, ticket_id, rating, review_text } = input;

  if (!event_id || !ticket_id || !rating)
    return { success: false, message: "Event, ticket, and rating are required." };
  if (rating < 1 || rating > 5)
    return { success: false, message: "Rating must be between 1 and 5." };

  try {
    // --- Verify user owns a USED ticket for this event ---
    const { data: ticket, error: ticketErr } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id, event_id, status")
      .eq("ticket_id", ticket_id)
      .eq("owner_user_id", session.sub)
      .eq("event_id", event_id)
      .maybeSingle();

    if (ticketErr) throw ticketErr;
    if (!ticket)
      return { success: false, message: "Ticket not found." };
    if (ticket.status !== "USED")
      return { success: false, message: "You can only review events you have attended." };

    // --- Check for existing review (one per user per event) ---
    const { data: existingReview, error: existErr } = await getSupabaseAdmin()
      .from("reviews")
      .select("review_id")
      .eq("event_id", event_id)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (existErr) throw existErr;
    if (existingReview)
      return { success: false, message: "You have already reviewed this event." };

    // --- Insert review ---
    const { data: review, error: insertErr } = await getSupabaseAdmin()
      .from("reviews")
      .insert({
        event_id,
        user_id: session.sub,
        ticket_id,
        rating,
        review_text: review_text?.trim() ?? null,
        is_visible: true,
      })
      .select(
        "review_id, event_id, user_id, ticket_id, rating, review_text, is_visible, created_at, updated_at",
      )
      .single();

    if (insertErr) throw insertErr;

    return {
      success: true,
      message: "Review submitted successfully.",
      review: review as Review,
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
): Promise<GetEventReviewsResult> {
  if (!eventId)
    return { success: false, message: "Event ID is required." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select(
        "review_id, event_id, user_id, ticket_id, rating, review_text, is_visible, created_at, updated_at",
      )
      .eq("event_id", eventId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reviews = (data ?? []) as Review[];
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating =
      reviews.length > 0
        ? Math.round((totalRating / reviews.length) * 10) / 10
        : 0;

    return {
      success: true,
      message: "Reviews loaded.",
      reviews,
      average_rating: averageRating,
    };
  } catch (err) {
    logger.error({
      fn: "getEventReviews",
      message: "Error fetching event reviews",
      meta: err,
    });
    return { success: false, message: "Failed to load reviews." };
  }
}

// --- Get reviews written by the current user ---

export async function getUserReviews(): Promise<GetUserReviewsResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Unauthorized." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select(
        "review_id, event_id, user_id, ticket_id, rating, review_text, is_visible, created_at, updated_at",
      )
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
