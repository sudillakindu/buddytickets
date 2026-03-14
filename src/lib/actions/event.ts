"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  Event,
  EventDetails,
  EventImage,
  EventStatus,
  TicketType,
  Organizer,
  CategoryDetails,
  GetFeaturedEventsResult,
  GetAllEventsResult,
  GetEventByIdResult,
  WaitlistStatus,
} from "@/lib/types/event";

const FEATURED_ACTIVE_LIMIT = 8;
const FEATURED_UPCOMING_LIMIT = 4;

const STATUS_PRIORITY: Record<string, number> = {
  ONGOING: 1,
  ON_SALE: 2,
  PUBLISHED: 3,
  SOLD_OUT: 4,
  COMPLETED: 5,
  CANCELLED: 6,
};

const EVENT_CARD_SELECT = `
  event_id, organizer_id, category_id, name, subtitle, description, requirements,
  location, map_link, start_at, end_at, status, is_active, is_vip,
  platform_fee_type, platform_fee_value, platform_fee_cap,
  allowed_payment_methods, created_at, updated_at,
  categories ( name ),
  event_images ( image_url, priority_order ),
  ticket_types ( price, is_active ),
  vip_events ( priority_order )
` as const;

// Raw shape returned by Supabase for EVENT_CARD_SELECT
interface RawEventRow {
  event_id: string;
  organizer_id: string;
  category_id: string;
  name: string;
  subtitle: string;
  description: string;
  requirements: string | null;
  location: string;
  map_link: string;
  start_at: string;
  end_at: string;
  status: EventStatus;
  is_active: boolean;
  is_vip: boolean;
  platform_fee_type: import("@/lib/types/checkout").DiscountType;
  platform_fee_value: number;
  platform_fee_cap: number | null;
  allowed_payment_methods: import("@/lib/types/payment").PaymentMethod[] | null;
  created_at: string;
  updated_at: string | null;
  categories: { name: string } | null;
  event_images: { image_url: string; priority_order: number }[];
  ticket_types: { price: number; is_active: boolean }[];
  vip_events: { priority_order: number }[];
}

// Map raw Supabase row to standardized Event object
function mapRowToEvent(row: RawEventRow): Event {
  const images = row.event_images ?? [];
  const tickets = row.ticket_types ?? [];
  const vipRows = row.vip_events ?? [];

  const sortedImages = [...images].sort(
    (a, b) => a.priority_order - b.priority_order,
  );
  const thumbnailImage =
    sortedImages.find((i) => i.priority_order === 1)?.image_url ??
    sortedImages[0]?.image_url ??
    null;

  const activeTicketPrices = tickets
    .filter((t) => t.is_active)
    .map((t) => Number(t.price));
  const startTicketPrice =
    activeTicketPrices.length > 0 ? Math.min(...activeTicketPrices) : null;

  return {
    event_id: row.event_id,
    organizer_id: row.organizer_id,
    category_id: row.category_id,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    requirements: row.requirements ?? null,
    location: row.location,
    map_link: row.map_link,
    start_at: row.start_at,
    end_at: row.end_at,
    status: row.status,
    is_active: row.is_active,
    is_vip: row.is_vip,
    platform_fee_type: row.platform_fee_type,
    platform_fee_value: Number(row.platform_fee_value),
    platform_fee_cap:
      row.platform_fee_cap != null ? Number(row.platform_fee_cap) : null,
    allowed_payment_methods: row.allowed_payment_methods ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    category: row.categories?.name ?? "General",
    thumbnail_image: thumbnailImage,
    start_ticket_price: startTicketPrice,
    vip_priority_order: vipRows[0]?.priority_order ?? null,
  };
}

function sortEvents(a: Event, b: Event): number {
  if (a.is_vip && b.is_vip)
    return (a.vip_priority_order ?? 9999) - (b.vip_priority_order ?? 9999);
  if (a.is_vip) return -1;
  if (b.is_vip) return 1;

  const dateDiff =
    new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
  if (dateDiff !== 0) return dateDiff;

  return (STATUS_PRIORITY[a.status] ?? 7) - (STATUS_PRIORITY[b.status] ?? 7);
}

export async function getFeaturedEvents(): Promise<GetFeaturedEventsResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .eq("is_active", true)
      .in("status", ["ONGOING", "ON_SALE", "PUBLISHED"]);

    if (error) throw error;

    const sorted = ((data ?? []) as unknown as RawEventRow[])
      .map(mapRowToEvent)
      .sort(sortEvents);
    const activeEvents = sorted
      .filter((e) => e.status === "ON_SALE" || e.status === "ONGOING")
      .slice(0, FEATURED_ACTIVE_LIMIT);
    const upcomingEvents = sorted
      .filter((e) => e.status === "PUBLISHED")
      .slice(0, FEATURED_UPCOMING_LIMIT);

    return { success: true, events: [...activeEvents, ...upcomingEvents] };
  } catch (err) {
    logger.error({
      fn: "getFeaturedEvents",
      message: "Error fetching featured events",
      meta: err,
    });
    return { success: false, message: "Failed to load featured events." };
  }
}

export async function getAllEvents(): Promise<GetAllEventsResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_CARD_SELECT)
      .eq("is_active", true)
      .in("status", [
        "ONGOING",
        "ON_SALE",
        "PUBLISHED",
        "SOLD_OUT",
        "COMPLETED",
        "CANCELLED",
      ]);

    if (error) throw error;

    return {
      success: true,
      events: ((data ?? []) as unknown as RawEventRow[])
        .map(mapRowToEvent)
        .sort(sortEvents),
    };
  } catch (err) {
    logger.error({
      fn: "getAllEvents",
      message: "Error fetching all events",
      meta: err,
    });
    return { success: false, message: "Failed to load events." };
  }
}

export async function getEventById(
  eventId: string,
): Promise<GetEventByIdResult> {
  if (!eventId) return { success: false, message: "Event ID is required." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        event_id, organizer_id, category_id, name, subtitle, description,
        requirements, location, map_link, start_at, end_at, status,
        is_active, is_vip, platform_fee_type, platform_fee_value, platform_fee_cap,
        allowed_payment_methods, created_at, updated_at,
        categories ( category_id, name, description ),
        event_images ( event_id, priority_order, image_url, created_at ),
        ticket_types ( ticket_type_id, event_id, name, description, inclusions, price, capacity, qty_sold, sale_start_at, sale_end_at, is_active, version, created_at, updated_at ),
        users!events_organizer_id_fkey ( user_id, name, image_url, email, username ),
        vip_events ( priority_order )
      `,
      )
      .eq("event_id", eventId)
      .eq("is_active", true)
      .neq("status", "DRAFT")
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, message: "Event not found." };

    const sortedImages = ((data.event_images as EventImage[]) ?? []).sort(
      (a, b) => a.priority_order - b.priority_order,
    );
    const thumbnailImage =
      sortedImages.find((i) => i.priority_order === 1)?.image_url ??
      sortedImages[0]?.image_url ??
      null;
    const bannerImage =
      sortedImages.find((i) => i.priority_order === 2)?.image_url ?? null;

    const ticketTypes: TicketType[] = (
      (data.ticket_types as TicketType[]) ?? []
    )
      .filter((t) => t.is_active)
      .map((t) => ({
        ...t,
        price: Number(t.price),
        qty_sold: t.qty_sold ?? 0,
        inclusions: Array.isArray(t.inclusions)
          ? t.inclusions.filter((i): i is string => typeof i === "string")
          : [],
        version: t.version ?? 1,
      }));

    const rawUser = Array.isArray(data.users) ? data.users[0] : data.users;
    const organizer: Organizer = {
      user_id: rawUser?.user_id ?? "",
      name: rawUser?.name ?? "Unknown Organizer",
      image_url: rawUser?.image_url ?? null,
      email: rawUser?.email ?? "",
      username: rawUser?.username ?? "",
    };

    const rawCategory = Array.isArray(data.categories)
      ? data.categories[0]
      : data.categories;
    const categoryDetails: CategoryDetails = {
      category_id: rawCategory?.category_id ?? data.category_id,
      name: rawCategory?.name ?? "General",
      description: rawCategory?.description ?? null,
    };

    const activeTicketPrices = ticketTypes.map((t) => t.price);
    const startTicketPrice =
      activeTicketPrices.length > 0 ? Math.min(...activeTicketPrices) : null;

    const event: EventDetails = {
      event_id: data.event_id,
      organizer_id: data.organizer_id,
      category_id: data.category_id,
      name: data.name,
      subtitle: data.subtitle,
      description: data.description,
      requirements: data.requirements ?? null,
      location: data.location,
      map_link: data.map_link,
      start_at: data.start_at,
      end_at: data.end_at,
      status: data.status,
      is_active: data.is_active,
      is_vip: data.is_vip,
      platform_fee_type:
        data.platform_fee_type as import("@/lib/types/checkout").DiscountType,
      platform_fee_value: Number(data.platform_fee_value),
      platform_fee_cap:
        data.platform_fee_cap != null ? Number(data.platform_fee_cap) : null,
      allowed_payment_methods:
        (data.allowed_payment_methods as
          | import("@/lib/types/payment").PaymentMethod[]
          | null) ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at ?? null,
      category: categoryDetails.name,
      thumbnail_image: thumbnailImage,
      banner_image: bannerImage,
      start_ticket_price: startTicketPrice,
      vip_priority_order: data.vip_events?.[0]?.priority_order ?? null,
      images: sortedImages,
      ticket_types: ticketTypes,
      organizer,
      category_details: categoryDetails,
    };

    return { success: true, event };
  } catch (err) {
    logger.error({
      fn: "getEventById",
      message: "Error fetching event details",
      meta: err,
    });
    return { success: false, message: "Event not found or an error occurred." };
  }
}

// --- Waitlist Result Types ---

interface JoinWaitlistResult {
  success: boolean;
  message: string;
}

interface WaitlistEntry {
  waitlist_id: string;
  position_order: number;
  status: WaitlistStatus;
  created_at: string;
}

interface GetWaitlistPositionResult {
  success: boolean;
  message: string;
  entry?: WaitlistEntry | null;
}

// --- Join Waitlist ---

export async function joinWaitlist(
  eventId: string,
  notifyEmail: string,
  ticketTypeId?: string,
): Promise<JoinWaitlistResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "UNAUTHENTICATED" };

  if (!eventId) return { success: false, message: "Event ID is required." };
  if (!notifyEmail.trim())
    return { success: false, message: "Email address is required." };

  try {
    const { data: event, error: evErr } = await getSupabaseAdmin()
      .from("events")
      .select("event_id, status")
      .eq("event_id", eventId)
      .maybeSingle();

    if (evErr) throw evErr;
    if (!event) return { success: false, message: "Event not found." };
    if (event.status !== "SOLD_OUT")
      return {
        success: false,
        message: "Waitlist is only available for sold-out events.",
      };

    const existingQuery = getSupabaseAdmin()
      .from("waitlists")
      .select("waitlist_id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("user_id", session.sub);

    if (ticketTypeId) {
      existingQuery.eq("ticket_type_id", ticketTypeId);
    } else {
      existingQuery.is("ticket_type_id", null);
    }

    const { count, error: existErr } = await existingQuery;
    if (existErr) throw existErr;
    if ((count ?? 0) > 0)
      return {
        success: false,
        message: "You are already on the waitlist for this event.",
      };

    const { data: maxPos, error: maxErr } = await getSupabaseAdmin()
      .from("waitlists")
      .select("position_order")
      .eq("event_id", eventId)
      .order("position_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) throw maxErr;
    const nextPosition = (maxPos?.position_order ?? 0) + 1;

    const { error: insertErr } = await getSupabaseAdmin()
      .from("waitlists")
      .insert({
        event_id: eventId,
        ticket_type_id: ticketTypeId ?? null,
        user_id: session.sub,
        notify_email: notifyEmail.trim(),
        position_order: nextPosition,
        status: "WAITING",
      });

    if (insertErr) throw insertErr;

    return {
      success: true,
      message: `You're #${nextPosition} on the waitlist! We'll notify you at ${notifyEmail.trim()}.`,
    };
  } catch (err) {
    logger.error({
      fn: "joinWaitlist",
      message: "Error joining waitlist",
      meta: err,
    });
    return { success: false, message: "Failed to join waitlist." };
  }
}

// --- Get Waitlist Position ---

export async function getWaitlistPosition(
  eventId: string,
): Promise<GetWaitlistPositionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "UNAUTHENTICATED" };

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("waitlists")
      .select("waitlist_id, position_order, status, created_at")
      .eq("event_id", eventId)
      .eq("user_id", session.sub)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return {
      success: true,
      message: "OK",
      entry: data
        ? {
            waitlist_id: data.waitlist_id,
            position_order: data.position_order,
            status: data.status as WaitlistStatus,
            created_at: data.created_at,
          }
        : null,
    };
  } catch (err) {
    logger.error({
      fn: "getWaitlistPosition",
      message: "Error fetching waitlist position",
      meta: err,
    });
    return { success: false, message: "Failed to check waitlist status." };
  }
}

// --- Review Result Types ---

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

interface ReviewEligibilityResult {
  success: boolean;
  message: string;
  canReview: boolean;
  ticketId?: string;
}

interface ReviewJoinRow {
  review_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  users: { name: string; image_url: string | null }[];
}

// --- Review Eligibility ---

export async function getReviewEligibility(
  eventId: string,
): Promise<ReviewEligibilityResult> {
  const session = await getSession();
  if (!session)
    return { success: true, message: "NOT_LOGGED_IN", canReview: false };

  try {
    const { data: usedTicket, error: ticketErr } = await getSupabaseAdmin()
      .from("tickets")
      .select("ticket_id")
      .eq("event_id", eventId)
      .eq("owner_user_id", session.sub)
      .eq("status", "USED")
      .limit(1)
      .maybeSingle();

    if (ticketErr) throw ticketErr;
    if (!usedTicket)
      return { success: true, message: "NO_USED_TICKET", canReview: false };

    const { count: existingCount, error: existErr } = await getSupabaseAdmin()
      .from("reviews")
      .select("review_id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("user_id", session.sub);

    if (existErr) throw existErr;
    if ((existingCount ?? 0) > 0)
      return { success: true, message: "ALREADY_REVIEWED", canReview: false };

    return {
      success: true,
      message: "ELIGIBLE",
      canReview: true,
      ticketId: usedTicket.ticket_id,
    };
  } catch (err) {
    logger.error({
      fn: "getReviewEligibility",
      message: "Error checking review eligibility",
      meta: err,
    });
    return { success: false, message: "Unable to verify review eligibility. Please try again later.", canReview: false };
  }
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

    const reviews: ReviewDisplay[] = (data ?? []).map((row: ReviewJoinRow) => {
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
