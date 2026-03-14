"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";

// --- Result Types ---

interface ReviewDisplay {
  review_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user: {
    name: string;
    image_url: string | null;
  };
}

interface GetEventReviewsResult {
  success: boolean;
  message: string;
  reviews?: ReviewDisplay[];
  average_rating?: number;
  total_count?: number;
}

interface SubmitReviewResult {
  success: boolean;
  message: string;
}

// --- Row Types ---

interface ReviewRow {
  review_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  users: { name: string; image_url: string | null }[];
}

// --- Get Event Reviews ---

export async function getEventReviews(
  eventId: string,
): Promise<GetEventReviewsResult> {
  if (!eventId)
    return { success: false, message: "Event ID is required." };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("reviews")
      .select(
        "review_id, rating, review_text, created_at, users ( name, image_url )",
      )
      .eq("event_id", eventId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const reviews: ReviewDisplay[] = (data ?? []).map((row: ReviewRow) => {
      const user = row.users?.[0];
      return {
        review_id: row.review_id,
        rating: row.rating,
        review_text: row.review_text,
        created_at: row.created_at,
        user: {
          name: user?.name ?? "Anonymous",
          image_url: user?.image_url ?? null,
        },
      };
    });

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating =
      reviews.length > 0
        ? Math.round((totalRating / reviews.length) * 10) / 10
        : 0;

    return {
      success: true,
      message: "OK",
      reviews,
      average_rating: averageRating,
      total_count: reviews.length,
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

// --- Submit Review ---

export async function submitReview(
  eventId: string,
  ticketId: string,
  rating: number,
  reviewText: string,
): Promise<SubmitReviewResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "UNAUTHENTICATED" };

  if (!eventId) return { success: false, message: "Event ID is required." };
  if (!ticketId) return { success: false, message: "Ticket ID is required." };
  if (rating < 1 || rating > 5)
    return { success: false, message: "Rating must be between 1 and 5." };

  try {
    const { data: ticket, error: ticketErr } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id, event_id, owner_user_id, status")
      .eq("ticket_id", ticketId)
      .eq("owner_user_id", session.sub)
      .maybeSingle();

    if (ticketErr) throw ticketErr;
    if (!ticket) return { success: false, message: "Ticket not found." };
    if (ticket.event_id !== eventId)
      return { success: false, message: "Ticket does not match event." };
    if (ticket.status !== "USED")
      return {
        success: false,
        message: "You can only review events you have attended.",
      };

    const { count: existingCount, error: existErr } = await getSupabaseAdmin()
      .from("reviews")
      .select("review_id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("user_id", session.sub);

    if (existErr) throw existErr;
    if ((existingCount ?? 0) > 0)
      return {
        success: false,
        message: "You have already reviewed this event.",
      };

    const { error: insertErr } = await getSupabaseAdmin()
      .from("reviews")
      .insert({
        event_id: eventId,
        user_id: session.sub,
        ticket_id: ticketId,
        rating,
        review_text: reviewText.trim() || null,
      });

    if (insertErr) throw insertErr;

    return { success: true, message: "Review submitted successfully!" };
  } catch (err) {
    logger.error({
      fn: "submitReview",
      message: "Error submitting review",
      meta: err,
    });
    return { success: false, message: "Failed to submit review." };
  }
}
