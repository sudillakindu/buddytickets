"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  Review,
  EventReview,
  CreateReviewInput,
  ReviewResult,
  EventReviewsResult,
} from "@/lib/types/review";

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

interface ReviewWithUserRow extends ReviewRow {
  users: { name: string } | null;
}

// --- Create Review ---
export async function createReview(
  input: CreateReviewInput,
): Promise<ReviewResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!input.event_id) return { success: false, message: "Event ID required." };
  if (!input.rating || input.rating < 1 || input.rating > 5)
    return { success: false, message: "Rating must be between 1 and 5." };

  try {
    const supabase = getSupabaseAdmin();

    // Resolve ticket_id: use provided value or auto-find one
    let ticketId = input.ticket_id;
    if (!ticketId) {
      const { data: ticket, error: ticketErr } = await supabase
        .from("tickets")
        .select("ticket_id")
        .eq("event_id", input.event_id)
        .eq("owner_user_id", session.sub)
        .limit(1)
        .maybeSingle();

      if (ticketErr) throw ticketErr;
      if (!ticket) {
        return {
          success: false,
          message: "You must have a ticket for this event to leave a review.",
        };
      }
      ticketId = ticket.ticket_id;
    } else {
      // Validate the provided ticket_id
      const { data: ticket, error: ticketErr } = await supabase
        .from("tickets")
        .select("ticket_id")
        .eq("ticket_id", ticketId)
        .eq("event_id", input.event_id)
        .eq("owner_user_id", session.sub)
        .maybeSingle();

      if (ticketErr) throw ticketErr;
      if (!ticket) {
        return {
          success: false,
          message: "You must have a ticket for this event to leave a review.",
        };
      }
    }

    // Check if user already reviewed this event
    const { data: existing, error: existErr } = await supabase
      .from("reviews")
      .select("review_id")
      .eq("event_id", input.event_id)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (existErr) throw existErr;
    if (existing) {
      return {
        success: false,
        message: "You have already reviewed this event.",
      };
    }

    // Insert review
    const { data: review, error: insertErr } = await supabase
      .from("reviews")
      .insert({
        event_id: input.event_id,
        user_id: session.sub,
        ticket_id: ticketId,
        rating: input.rating,
        review_text: input.review_text ?? null,
        is_visible: true,
      })
      .select("*")
      .single();

    if (insertErr) throw insertErr;

    return {
      success: true,
      message: "Review submitted.",
      review: review as unknown as Review,
    };
  } catch (err) {
    logger.error({ fn: "createReview", message: "Error", meta: err });
    return { success: false, message: "Failed to submit review." };
  }
}

// --- Get Event Reviews (Public) ---
export async function getEventReviews(
  eventId: string,
): Promise<EventReviewsResult> {
  if (!eventId) return { success: false, message: "Event ID required." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select(
        `review_id, event_id, user_id, ticket_id, rating, review_text, is_visible, created_at, updated_at,
        users ( name )`,
      )
      .eq("event_id", eventId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reviews: EventReview[] = (data ?? []).map((row) => {
      const typed = row as unknown as ReviewWithUserRow;
      return {
        review_id: typed.review_id,
        rating: typed.rating,
        review_text: typed.review_text,
        created_at: typed.created_at,
        user_name: typed.users?.name ?? "Anonymous",
      };
    });

    return { success: true, message: "Reviews loaded.", reviews };
  } catch (err) {
    logger.error({ fn: "getEventReviews", message: "Error", meta: err });
    return { success: false, message: "Failed to load reviews." };
  }
}

// --- Get User Review For Event ---
export async function getUserReviewForEvent(
  eventId: string,
): Promise<ReviewResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };
  if (!eventId) return { success: false, message: "Event ID required." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (error) throw error;
    if (!data)
      return { success: false, message: "No review found for this event." };

    return {
      success: true,
      message: "Review found.",
      review: data as unknown as Review,
    };
  } catch (err) {
    logger.error({
      fn: "getUserReviewForEvent",
      message: "Error",
      meta: err,
    });
    return { success: false, message: "Failed to load review." };
  }
}
