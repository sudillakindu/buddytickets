// lib/actions/checkout.ts
// Server Actions for ticket reservation and checkout flow.
//
// SECURITY: All pricing computations are server-side.
//           Client-submitted totals are NEVER trusted.
//
// CONCURRENCY: reserve_tickets_occ() RPC uses SELECT FOR UPDATE row-level
//              locking — FCFS inventory control at DB layer.

"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  CartItem,
  CreateReservationResult,
  GetCheckoutDataResult,
  CheckoutData,
  ReservationLineItem,
  ReserveTicketsResult,
  PromoValidationResult,
  ValidatedPromotion,
  PromotionRow,
} from "@/lib/types/checkout";

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 · RESERVATION CREATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates inventory reservations for the given cart items.
 * Calls the `reserve_tickets_occ` DB RPC which:
 *  - Cancels any existing PENDING reservations for the user+event
 *  - Acquires SELECT FOR UPDATE locks on ticket_types rows
 *  - Validates availability (FCFS)
 *  - Inserts PENDING reservation rows expiring in 10 minutes
 *
 * Requires: authenticated session.
 * Redirects to sign-in if not authenticated.
 */
export async function createReservation(
  eventId: string,
  items: CartItem[],
): Promise<CreateReservationResult> {
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: "UNAUTHENTICATED",
    };
  }

  if (!eventId || items.length === 0) {
    return { success: false, message: "Invalid reservation request." };
  }

  // Filter out zero-quantity items
  const validItems = items.filter((i) => i.quantity > 0);
  if (validItems.length === 0) {
    return { success: false, message: "Please select at least one ticket." };
  }

  try {
    // Call reserve_tickets_occ RPC — SECURITY DEFINER, handles all locking/validation
    const { data, error } = await supabaseAdmin.rpc("reserve_tickets_occ", {
      p_user_id: session.sub,
      p_event_id: eventId,
      p_items: validItems,
      p_expires_mins: 10,
    });

    if (error) {
      return { success: false, message: parseRPCError(error.message) };
    }

    const result = data as ReserveTicketsResult;
    return {
      success: true,
      message: "Reservation created.",
      primary_id: result.primary_id,
      expires_at: result.expires_at,
    };
  } catch (err) {
    logger.error({
      fn: "createReservation",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Failed to create reservation. Please try again." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 · CHECKOUT DATA FETCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all data needed for the checkout page.
 * Validates the primary reservation exists and belongs to the authenticated user.
 * Fetches all PENDING reservations for the same user+event checkout session.
 * Computes the subtotal server-side.
 */
export async function getCheckoutData(
  primaryReservationId: string,
): Promise<GetCheckoutDataResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    // 1. Fetch the primary reservation to get event_id
    const { data: primaryRaw, error: primaryErr } = await supabaseAdmin
      .from("ticket_reservations")
      .select("reservation_id, user_id, event_id, expires_at, status")
      .eq("reservation_id", primaryReservationId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (primaryErr) throw primaryErr;
    if (!primaryRaw) {
      return { success: false, message: "Reservation not found." };
    }

    if (primaryRaw.status === "EXPIRED") {
      return { success: false, message: "RESERVATION_EXPIRED" };
    }
    if (primaryRaw.status === "CONFIRMED") {
      return { success: false, message: "RESERVATION_ALREADY_CONFIRMED" };
    }
    if (primaryRaw.status !== "PENDING") {
      return { success: false, message: "Reservation is no longer valid." };
    }

    // Check expiry
    if (new Date(primaryRaw.expires_at) <= new Date()) {
      return { success: false, message: "RESERVATION_EXPIRED" };
    }

    const eventId = primaryRaw.event_id;

    // 2. Fetch all PENDING reservations for this user+event (current session)
    const { data: reservations, error: resErr } = await supabaseAdmin
      .from("ticket_reservations")
      .select(
        "reservation_id, ticket_type_id, quantity, expires_at, status, order_id",
      )
      .eq("user_id", session.sub)
      .eq("event_id", eventId)
      .eq("status", "PENDING")
      .gt("expires_at", new Date().toISOString());

    if (resErr) throw resErr;
    if (!reservations || reservations.length === 0) {
      return { success: false, message: "RESERVATION_EXPIRED" };
    }

    const ticketTypeIds = reservations.map((r) => r.ticket_type_id);

    // 3. Fetch ticket type details for all reserved types
    const { data: ticketTypes, error: ttErr } = await supabaseAdmin
      .from("ticket_types")
      .select(
        "ticket_type_id, name, description, price, capacity, qty_sold, is_active, version, sale_end_at",
      )
      .in("ticket_type_id", ticketTypeIds);

    if (ttErr) throw ttErr;

    const ttMap = new Map(
      (ticketTypes ?? []).map((tt: Record<string, unknown>) => [tt.ticket_type_id, tt]),
    );

    // 4. Fetch event details
    const { data: event, error: evErr } = await supabaseAdmin
      .from("events")
      .select("event_id, name, start_at, location, status")
      .eq("event_id", eventId)
      .maybeSingle();

    if (evErr) throw evErr;
    if (!event) return { success: false, message: "Event not found." };

    // 5. Build line items and compute subtotal
    const lineItems: ReservationLineItem[] = reservations.map(
      (r) => {
        const tt = ttMap.get(r.ticket_type_id) as Record<string, unknown> | undefined;
        const priceEach = Number(tt?.price ?? 0);
        const quantity = r.quantity;
        return {
          reservation_id: r.reservation_id,
          ticket_type_id: r.ticket_type_id,
          ticket_type_name: (tt?.name as string) ?? "—",
          description: (tt?.description as string) ?? "",
          price_each: priceEach,
          quantity,
          line_total: priceEach * quantity,
          version: (tt?.version as number) ?? 1,
          capacity: (tt?.capacity as number) ?? 0,
          qty_sold: (tt?.qty_sold as number) ?? 0,
          is_active: (tt?.is_active as boolean) ?? true,
          sale_end_at: (tt?.sale_end_at as string | null) ?? null,
        };
      },
    );

    const subtotal = lineItems.reduce((sum, li) => sum + li.line_total, 0);

    const checkoutData: CheckoutData = {
      primary_reservation_id: primaryReservationId,
      event_id: eventId,
      event_name: (event as Record<string, unknown>).name as string,
      event_start_at: (event as Record<string, unknown>).start_at as string,
      event_location: (event as Record<string, unknown>).location as string,
      event_status: (event as Record<string, unknown>).status as string,
      expires_at: reservations[0].expires_at,
      line_items: lineItems,
      subtotal,
    };

    return { success: true, message: "OK", data: checkoutData };
  } catch (err) {
    logger.error({
      fn: "getCheckoutData",
      message: "Error fetching checkout data",
      meta: err,
    });
    return { success: false, message: "Failed to load checkout data." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 · PROMOTION VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Server-side promotion validation.
 * NEVER trust client-computed discount values.
 * All discount computation happens here.
 *
 * Validates:
 *  1. Promo code exists, is_active = true
 *  2. NOW() is within start_at..end_at window
 *  3. Global usage not exceeded (usage_limit_global > 0)
 *  4. Per-user usage not exceeded (usage_limit_per_user)
 *  5. Scope matches (event_id / ticket_type_id)
 *  6. min_order_amount satisfied
 *  7. Computes discount: PERCENTAGE or FIXED_AMOUNT, applying max_discount_cap
 */
export async function validatePromoCode(
  code: string,
  eventId: string,
  ticketTypeIds: string[],
  subtotal: number,
): Promise<PromoValidationResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Please sign in to apply a promo code." };
  }

  if (!code.trim()) {
    return { success: false, message: "Please enter a promo code." };
  }

  try {
    const now = new Date().toISOString();

    // 1. Fetch and validate the promotion
    const { data: promoRaw, error: promoErr } = await supabaseAdmin
      .from("promotions")
      .select(
        `promotion_id, code, description, discount_type, discount_value,
         max_discount_cap, min_order_amount, start_at, end_at, is_active,
         usage_limit_global, usage_limit_per_user, current_global_usage,
         scope_event_id, scope_ticket_type_id, version`,
      )
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (promoErr) throw promoErr;
    if (!promoRaw) {
      return { success: false, message: "Invalid promo code." };
    }

    const promo = promoRaw as PromotionRow;

    // 2. Active check
    if (!promo.is_active) {
      return { success: false, message: "This promo code is no longer active." };
    }

    // 3. Date window check
    if (now < promo.start_at) {
      return { success: false, message: "This promo code is not yet active." };
    }
    if (now > promo.end_at) {
      return { success: false, message: "This promo code has expired." };
    }

    // 4. Global usage limit (0 = unlimited)
    if (
      promo.usage_limit_global > 0 &&
      promo.current_global_usage >= promo.usage_limit_global
    ) {
      return { success: false, message: "This promo code has reached its usage limit." };
    }

    // 5. Per-user usage limit with limit clause to prevent performance issues
    if (promo.usage_limit_per_user > 0) {
      const { count, error: usageErr } = await supabaseAdmin
        .from("promotion_usages")
        .select("usage_id", { count: "exact", head: true })
        .eq("promotion_id", promo.promotion_id)
        .eq("user_id", session.sub)
        .limit(promo.usage_limit_per_user); // Stop counting after limit reached

      if (usageErr) throw usageErr;
      if ((count ?? 0) >= promo.usage_limit_per_user) {
        return {
          success: false,
          message: `You have already used this promo code (limit: ${promo.usage_limit_per_user}x).`,
        };
      }
    }

    // 6. Scope check — NULL scope = platform-wide, applicable to any event/type
    if (promo.scope_event_id && promo.scope_event_id !== eventId) {
      return { success: false, message: "This promo code is not valid for this event." };
    }

    if (
      promo.scope_ticket_type_id &&
      !ticketTypeIds.includes(promo.scope_ticket_type_id)
    ) {
      return {
        success: false,
        message: "This promo code is not valid for the selected ticket types.",
      };
    }

    // 7. Minimum order amount
    if (promo.min_order_amount > 0 && subtotal < promo.min_order_amount) {
      return {
        success: false,
        message: `Minimum order amount of LKR ${promo.min_order_amount.toLocaleString()} required.`,
      };
    }

    // 8. Compute discount (server-side — NEVER trust client)
    let discountAmount = 0;
    if (promo.discount_type === "PERCENTAGE") {
      discountAmount = subtotal * (promo.discount_value / 100);
      // Apply cap if specified, otherwise unlimited
      const cap = promo.max_discount_cap ?? Number.MAX_SAFE_INTEGER;
      discountAmount = Math.min(discountAmount, cap);
    } else {
      // FIXED_AMOUNT — can't discount more than subtotal
      discountAmount = Math.min(promo.discount_value, subtotal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100; // round to 2 dp

    const finalTotal = Math.max(0, subtotal - discountAmount);

    const validated: ValidatedPromotion = {
      promotion_id: promo.promotion_id,
      code: promo.code,
      description: promo.description,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      max_discount_cap: promo.max_discount_cap,
      discount_amount: discountAmount,
      final_total: finalTotal,
    };

    return {
      success: true,
      message: `Promo applied! You save LKR ${discountAmount.toLocaleString()}.`,
      promo: validated,
    };
  } catch (err) {
    logger.error({
      fn: "validatePromoCode",
      message: "Error validating promo",
      meta: err,
    });
    return { success: false, message: "Failed to validate promo code." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse DB RPC error messages into user-friendly strings.
 * The RPCs RAISE EXCEPTION with structured codes like: 'SOLD_OUT:ticket_type_id'
 */
function parseRPCError(raw: string): string {
  if (!raw) return "An unexpected error occurred.";

  if (raw.includes("SOLD_OUT"))
    return "Sorry, these tickets are sold out. Another buyer just grabbed the last ones!";
  if (raw.includes("EVENT_NOT_ON_SALE"))
    return "Ticket sales are not currently open for this event.";
  if (raw.includes("EVENT_NOT_FOUND"))
    return "Event not found.";
  if (raw.includes("EVENT_INACTIVE"))
    return "This event is not currently available.";
  if (raw.includes("TICKET_TYPE_NOT_FOUND"))
    return "The selected ticket type was not found.";
  if (raw.includes("TICKET_TYPE_INACTIVE"))
    return "The selected ticket type is no longer available.";
  if (raw.includes("SALE_NOT_STARTED"))
    return "Ticket sales for this type have not started yet.";
  if (raw.includes("SALE_ENDED"))
    return "Ticket sales for this type have ended.";
  if (raw.includes("INVALID_QUANTITY"))
    return "Invalid ticket quantity selected.";
  if (raw.includes("EXCEEDS_MAX_PER_ORDER"))
    return "Maximum 10 tickets per type per order.";
  if (raw.includes("INVALID_INPUT"))
    return "Please select at least one ticket.";

  return "Failed to reserve tickets. Please try again.";
}
