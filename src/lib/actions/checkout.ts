"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/types/supabase";

type PaymentSource = Database["public"]["Enums"]["payment_source"];
type DiscountType = Database["public"]["Enums"]["discount_type"];

const ALL_PAYMENT_METHODS: PaymentSource[] = [
  "PAYMENT_GATEWAY",
  "BANK_TRANSFER",
  "ONGATE",
];

interface CartItem {
  ticket_type_id: string;
  quantity: number;
}

interface ReservationLineItem {
  reservation_id: string;
  ticket_type_id: string;
  ticket_type_name: string;
  description: string;
  price_each: number;
  quantity: number;
  line_total: number;
  version: number;
  capacity: number;
  qty_sold: number;
  is_active: boolean | null;
  sale_end_at: string | null;
}

interface CheckoutData {
  primary_reservation_id: string;
  event_id: string;
  event_name: string;
  event_start_at: string;
  event_location: string;
  event_status: Database["public"]["Enums"]["event_status"] | null;
  expires_at: string;
  line_items: ReservationLineItem[];
  subtotal: number;
  allowed_payment_methods: PaymentSource[];
}

interface ReserveTicketsResult {
  reservation_ids: string[];
  primary_id: string;
  expires_at: string;
}

interface ValidatedPromotion {
  promotion_id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_cap: number | null;
  discount_amount: number;
  final_total: number;
}

interface PromoValidationResult {
  success: boolean;
  message: string;
  promo?: ValidatedPromotion;
}

interface CreateReservationResult {
  success: boolean;
  message: string;
  primary_id?: string;
  expires_at?: string;
}

interface GetCheckoutDataResult {
  success: boolean;
  message: string;
  data?: CheckoutData;
}

// --- Row Type Aliases for Read Operations ---
type PromotionRow = Pick<
  Database["public"]["Tables"]["promotions"]["Row"],
  | "promotion_id" | "code" | "description" | "discount_type" | "discount_value"
  | "max_discount_cap" | "min_order_amount" | "start_at" | "end_at" | "is_active"
  | "usage_limit_global" | "usage_limit_per_user" | "current_global_usage"
  | "scope_event_id" | "scope_ticket_type_id" | "version"
>;

type TicketTypeRow = Pick<
  Database["public"]["Tables"]["ticket_types"]["Row"],
  | "ticket_type_id" | "name" | "description" | "price" | "capacity"
  | "qty_sold" | "is_active" | "version" | "sale_end_at"
>;

type EventRow = Pick<
  Database["public"]["Tables"]["events"]["Row"],
  "event_id" | "name" | "start_at" | "location" | "status" | "allowed_payment_methods"
>;

// Create inventory reservation via RPC ensuring DB FCFS constraint
export async function createReservation(
  eventId: string,
  items: CartItem[],
): Promise<CreateReservationResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "UNAUTHENTICATED" };
  if (!eventId || items.length === 0)
    return { success: false, message: "Invalid reservation request." };

  const validItems = items.filter((i) => i.quantity > 0);
  if (validItems.length === 0)
    return { success: false, message: "Please select at least one ticket." };

  try {
    const { data, error } = await getSupabaseAdmin().rpc(
      "reserve_tickets_occ",
      {
        p_user_id: session.sub,
        p_event_id: eventId,
        p_items: validItems,
        p_expires_mins: 10,
      },
    );

    if (error) return { success: false, message: parseRPCError(error.message) };

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
    return {
      success: false,
      message: "Failed to create reservation. Please try again.",
    };
  }
}

// Prepare checkout state with safe, server-side data extraction
export async function getCheckoutData(
  primaryReservationId: string,
): Promise<GetCheckoutDataResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Unauthorized." };

  try {
    const { data: primaryRaw, error: primaryErr } = await getSupabaseAdmin()
      .from("ticket_reservations")
      .select("reservation_id, user_id, event_id, expires_at, status")
      .eq("reservation_id", primaryReservationId)
      .eq("user_id", session.sub)
      .maybeSingle();

    if (primaryErr) throw primaryErr;
    if (!primaryRaw)
      return { success: false, message: "Reservation not found." };
    if (primaryRaw.status === "EXPIRED")
      return { success: false, message: "RESERVATION_EXPIRED" };
    if (primaryRaw.status === "CONFIRMED")
      return { success: false, message: "RESERVATION_ALREADY_CONFIRMED" };
    if (primaryRaw.status !== "PENDING")
      return { success: false, message: "Reservation is no longer valid." };
    if (new Date(primaryRaw.expires_at) <= new Date())
      return { success: false, message: "RESERVATION_EXPIRED" };

    const eventId = primaryRaw.event_id;
    if (!eventId)
      return {
        success: false,
        message: "Reservation is missing event details.",
      };

    const { data: reservations, error: resErr } = await getSupabaseAdmin()
      .from("ticket_reservations")
      .select(
        "reservation_id, ticket_type_id, quantity, expires_at, status, order_id",
      )
      .eq("user_id", session.sub)
      .eq("event_id", eventId)
      .eq("status", "PENDING")
      .gt("expires_at", new Date().toISOString());

    if (resErr) throw resErr;
    if (!reservations || reservations.length === 0)
      return { success: false, message: "RESERVATION_EXPIRED" };

    const ticketTypeIds = reservations.map((r) => r.ticket_type_id);

    const { data: ticketTypes, error: ttErr } = await getSupabaseAdmin()
      .from("ticket_types")
      .select(
        "ticket_type_id, name, description, price, capacity, qty_sold, is_active, version, sale_end_at",
      )
      .in("ticket_type_id", ticketTypeIds);

    if (ttErr) throw ttErr;

    const ttMap = new Map(
      (ticketTypes ?? []).map((tt: TicketTypeRow) => [
        tt.ticket_type_id,
        tt,
      ]),
    );

    const { data: event, error: evErr } = await getSupabaseAdmin()
      .from("events")
      .select(
        "event_id, name, start_at, location, status, allowed_payment_methods",
      )
      .eq("event_id", eventId)
      .maybeSingle<EventRow>();

    if (evErr) throw evErr;
    if (!event) return { success: false, message: "Event not found." };

    const lineItems: ReservationLineItem[] = reservations.map((r) => {
      const tt = ttMap.get(r.ticket_type_id);
      const priceEach = Number(tt?.price ?? 0);
      const quantity = r.quantity;
      return {
        reservation_id: r.reservation_id,
        ticket_type_id: r.ticket_type_id,
        ticket_type_name: tt?.name ?? "—",
        description: tt?.description ?? "",
        price_each: priceEach,
        quantity,
        line_total: priceEach * quantity,
        version: tt?.version ?? 1,
        capacity: tt?.capacity ?? 0,
        qty_sold: tt?.qty_sold ?? 0,
        is_active: tt?.is_active ?? true,
        sale_end_at: tt?.sale_end_at ?? null,
      };
    });

    const subtotal = lineItems.reduce((sum, li) => sum + li.line_total, 0);
    const rawMethods = event.allowed_payment_methods;
    const allowedPaymentMethods: PaymentSource[] =
      rawMethods && rawMethods.length > 0
        ? rawMethods
        : [...ALL_PAYMENT_METHODS];

    const checkoutData: CheckoutData = {
      primary_reservation_id: primaryReservationId,
      event_id: eventId,
      event_name: event.name,
      event_start_at: event.start_at,
      event_location: event.location,
      event_status: event.status,
      expires_at: reservations[0].expires_at,
      line_items: lineItems,
      subtotal,
      allowed_payment_methods: allowedPaymentMethods,
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

// Server-side promo logic, discarding client price requests completely
export async function validatePromoCode(
  code: string,
  eventId: string,
  ticketTypeIds: string[],
  subtotal: number,
): Promise<PromoValidationResult> {
  const session = await getSession();
  if (!session)
    return { success: false, message: "Please sign in to apply a promo code." };
  if (!code.trim())
    return { success: false, message: "Please enter a promo code." };

  try {
    const now = new Date().toISOString();

    const { data: promoRaw, error: promoErr } = await getSupabaseAdmin()
      .from("promotions")
      .select(
        `promotion_id, code, description, discount_type, discount_value, max_discount_cap, min_order_amount, start_at, end_at, is_active, usage_limit_global, usage_limit_per_user, current_global_usage, scope_event_id, scope_ticket_type_id, version`,
      )
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (promoErr) throw promoErr;
    if (!promoRaw) return { success: false, message: "Invalid promo code." };

    const promo = promoRaw as PromotionRow;

    if (!promo.is_active)
      return {
        success: false,
        message: "This promo code is no longer active.",
      };
    if (now < promo.start_at)
      return { success: false, message: "This promo code is not yet active." };
    if (now > promo.end_at)
      return { success: false, message: "This promo code has expired." };
    if (
      (promo.usage_limit_global ?? 0) > 0 &&
      (promo.current_global_usage ?? 0) >= (promo.usage_limit_global ?? 0)
    )
      return {
        success: false,
        message: "This promo code has reached its usage limit.",
      };

    if ((promo.usage_limit_per_user ?? 0) > 0) {
      const { count, error: usageErr } = await getSupabaseAdmin()
        .from("promotion_usages")
        .select("usage_id", { count: "exact", head: true })
        .eq("promotion_id", promo.promotion_id)
        .eq("user_id", session.sub);

      if (usageErr) throw usageErr;
      if ((count ?? 0) >= (promo.usage_limit_per_user ?? 0)) {
        return {
          success: false,
          message: `You have already used this promo code (limit: ${promo.usage_limit_per_user ?? 0}x).`,
        };
      }
    }

    if (promo.scope_event_id && promo.scope_event_id !== eventId)
      return {
        success: false,
        message: "This promo code is not valid for this event.",
      };
    if (
      promo.scope_ticket_type_id &&
      !ticketTypeIds.includes(promo.scope_ticket_type_id)
    )
      return {
        success: false,
        message: "This promo code is not valid for the selected ticket types.",
      };
    if ((promo.min_order_amount ?? 0) > 0 && subtotal < (promo.min_order_amount ?? 0))
      return {
        success: false,
        message: `Minimum order amount of LKR ${(promo.min_order_amount ?? 0).toLocaleString()} required.`,
      };

    let discountAmount = 0;
    if (promo.discount_type === "PERCENTAGE") {
      discountAmount = subtotal * (promo.discount_value / 100);
      if (promo.max_discount_cap !== null)
        discountAmount = Math.min(discountAmount, promo.max_discount_cap);
    } else {
      discountAmount = Math.min(promo.discount_value, subtotal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

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

function parseRPCError(raw: string): string {
  if (!raw) return "An unexpected error occurred.";
  if (raw.includes("SOLD_OUT"))
    return "Sorry, these tickets are sold out. Another buyer just grabbed the last ones!";
  if (raw.includes("EVENT_NOT_ON_SALE"))
    return "Ticket sales are not currently open for this event.";
  if (raw.includes("EVENT_NOT_FOUND")) return "Event not found.";
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
