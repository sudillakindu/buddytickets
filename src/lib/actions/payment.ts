// lib/actions/payment.ts
// Payment server actions — order creation and payment gateway initiation.
//
// PRE-PAYMENT VALIDATION (before any gateway redirect):
//  1. Reservation still PENDING and not expired
//  2. Ticket types still active
//  3. Inventory still valid (qty_sold + pending <= capacity)
//  4. Promotion still valid (if applied)
//  5. Final price matches server recomputation
//
// SECURITY:
//  - All pricing computed server-side from DB values
//  - Client-submitted totals are IGNORED
//  - Auth session required for every action

"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import { initiatePaymentGateway } from "@/lib/utils/payment-gateway";
import { ALL_PAYMENT_METHODS } from "@/lib/types/payment";
import type {
  CreateOrderInput,
  CreateOrderResult,
  PaymentSource,
  PaymentMethod,
  BankTransferDetails,
} from "@/lib/types/payment";
import type { ValidatedPromotion, ReservationRow } from "@/lib/types/checkout";

// --- Pre-payment Server Validation ---

interface TicketTypeRow {
  ticket_type_id: string;
  price: number;
  capacity: number;
  qty_sold: number;
  is_active: boolean;
  sale_start_at: string | null;
  sale_end_at: string | null;
  version: number;
}

interface PromotionValidationRow {
  promotion_id: string;
  is_active: boolean;
  start_at: string;
  end_at: string;
  usage_limit_global: number;
  current_global_usage: number;
  discount_type: string;
  discount_value: number;
  max_discount_cap: number | null;
  min_order_amount: number;
  scope_event_id: string | null;
  scope_ticket_type_id: string | null;
}

interface EventRow {
  event_id: string;
  status: string;
  is_active: boolean;
  allowed_payment_methods: PaymentMethod[] | null;
}

interface EventNameRow {
  name: string;
}

interface PrePaymentValidationResult {
  valid: boolean;
  error?: string;
  computedSubtotal?: number;
  computedDiscount?: number;
  computedFinal?: number;
  reservations?: ReservationRow[];
  allowedPaymentMethods?: PaymentMethod[];
}

/**
 * Comprehensive server-side validation before creating an order.
 * Recomputes all pricing from scratch — never trusts client values.
 */
async function runPrePaymentValidation(
  primaryReservationId: string,
  userId: string,
  appliedPromo: ValidatedPromotion | null,
): Promise<PrePaymentValidationResult> {
  const now = new Date().toISOString();

  // 1. Fetch primary reservation to get event_id
  const { data: primary, error: primaryError } = await getSupabaseAdmin()
    .from("ticket_reservations")
    .select("reservation_id, user_id, event_id, expires_at, status")
    .eq("reservation_id", primaryReservationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (primaryError) throw primaryError;
  if (!primary) return { valid: false, error: "Reservation not found." };
  if (primary.status !== "PENDING") {
    return { valid: false, error: "RESERVATION_INVALID_STATUS" };
  }
  if (primary.expires_at <= now) {
    return { valid: false, error: "RESERVATION_EXPIRED" };
  }

  const eventId = primary.event_id;
  if (!eventId) {
    return { valid: false, error: "Reservation missing event reference." };
  }

  // 2. Fetch all PENDING reservations for this user+event
  const { data: reservations, error: reservationsError } = await getSupabaseAdmin()
    .from("ticket_reservations")
    .select("reservation_id, ticket_type_id, quantity, expires_at, status, order_id, user_id, event_id, reserved_at")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("status", "PENDING")
    .gt("expires_at", now);

  if (reservationsError) throw reservationsError;
  if (!reservations || reservations.length === 0) {
    return { valid: false, error: "RESERVATION_EXPIRED" };
  }

  const ticketTypeIds = reservations.map((r: ReservationRow) => r.ticket_type_id);

  // 3. Validate ticket types (still active, in-window)
  const { data: ticketTypes, error: ticketTypesError } = await getSupabaseAdmin()
    .from("ticket_types")
    .select("ticket_type_id, price, capacity, qty_sold, is_active, sale_start_at, sale_end_at, version")
    .in("ticket_type_id", ticketTypeIds);

  if (ticketTypesError) throw ticketTypesError;

  const ticketTypeMap = new Map(
    (ticketTypes ?? []).map((tt: TicketTypeRow) => [tt.ticket_type_id, tt]),
  );

  // 4. Validate event status
  const { data: event, error: eventError } = await getSupabaseAdmin()
    .from("events")
    .select("event_id, status, is_active, allowed_payment_methods")
    .eq("event_id", eventId)
    .maybeSingle<EventRow>();

  if (eventError) throw eventError;
  if (!event || !event.is_active) return { valid: false, error: "Event not available." };
  if (event.status !== "ON_SALE" && event.status !== "ONGOING") {
    return { valid: false, error: "Ticket sales are closed for this event." };
  }

  const allowedPaymentMethods: PaymentMethod[] =
    event.allowed_payment_methods && event.allowed_payment_methods.length > 0
      ? event.allowed_payment_methods
      : [...ALL_PAYMENT_METHODS];

  let computedSubtotal = 0;

  for (const reservation of reservations as ReservationRow[]) {
    const ticketType = ticketTypeMap.get(reservation.ticket_type_id);
    if (!ticketType) return { valid: false, error: "Ticket type not found." };
    if (!ticketType.is_active) return { valid: false, error: "A selected ticket type is no longer available." };

    if (ticketType.sale_start_at && now < ticketType.sale_start_at) {
      return { valid: false, error: "Ticket sales have not started yet." };
    }
    if (ticketType.sale_end_at && now > ticketType.sale_end_at) {
      return { valid: false, error: "Ticket sales have ended for a selected type." };
    }

    // 5. Inventory sanity check (belt-and-suspenders — RPC does the real lock)
    const available = ticketType.capacity - ticketType.qty_sold;
    if (available < reservation.quantity) {
      return { valid: false, error: "INVENTORY_CONFLICT" };
    }

    const price = Number(ticketType.price);
    if (!Number.isFinite(price) || price < 0) {
      return { valid: false, error: "Invalid ticket price configuration." };
    }

    computedSubtotal += price * reservation.quantity;
  }

  // 6. Revalidate promotion server-side
  let computedDiscount = 0;
  if (appliedPromo) {
    const promotionResult = await getSupabaseAdmin()
      .from("promotions")
      .select("promotion_id, is_active, start_at, end_at, usage_limit_global, current_global_usage, discount_type, discount_value, max_discount_cap, min_order_amount, scope_event_id, scope_ticket_type_id")
      .eq("promotion_id", appliedPromo.promotion_id)
      .maybeSingle<PromotionValidationRow>();

    if (promotionResult.error) throw promotionResult.error;
    if (!promotionResult.data) return { valid: false, error: "Applied promo no longer exists." };

    const promotion = promotionResult.data;
    if (!promotion.is_active || now > promotion.end_at || now < promotion.start_at) {
      return { valid: false, error: "The applied promo code is no longer valid." };
    }
    if (
      promotion.usage_limit_global > 0 &&
      promotion.current_global_usage >= promotion.usage_limit_global
    ) {
      return { valid: false, error: "The promo code has reached its limit." };
    }
    if (promotion.scope_event_id && promotion.scope_event_id !== eventId) {
      return { valid: false, error: "Promo not valid for this event." };
    }

    // Recompute discount
    if (promotion.discount_type === "PERCENTAGE") {
      computedDiscount = computedSubtotal * (promotion.discount_value / 100);
      if (promotion.max_discount_cap !== null) {
        computedDiscount = Math.min(computedDiscount, promotion.max_discount_cap);
      }
    } else {
      computedDiscount = Math.min(promotion.discount_value, computedSubtotal);
    }
    computedDiscount = Math.round(computedDiscount * 100) / 100;
  }

  const computedFinal = Math.max(0, computedSubtotal - computedDiscount);

  return {
    valid: true,
    computedSubtotal,
    computedDiscount,
    computedFinal,
    reservations: reservations as ReservationRow[],
    allowedPaymentMethods,
  };
}

// --- Order Creation ---

/**
 * Creates a pending order after full server-side validation.
 * Links all PENDING reservations to the created order (ticket_reservations.order_id).
 * Returns gateway form data or bank transfer instructions based on payment method.
 *
 * Flow:
 *  1. Auth check
 *  2. Pre-payment validation (re-validate everything, recompute pricing)
 *  3. INSERT into orders (PENDING)
 *  4. UPDATE ticket_reservations SET order_id = new_order_id
 *  5. Build and return gateway data
 */
export async function createPendingOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: "Please sign in to complete your purchase." };
  }

  try {
    // --- 1. Pre-payment validation ---
    const validation = await runPrePaymentValidation(
      input.reservation_id,
      session.sub,
      input.promotion_id
        ? ({
            promotion_id: input.promotion_id,
            discount_amount: input.discount_amount,
          } as ValidatedPromotion)
        : null,
    );

    if (!validation.valid) {
      return { success: false, message: formatValidationError(validation.error!) };
    }

    const { computedSubtotal, computedDiscount, computedFinal, reservations, allowedPaymentMethods = ALL_PAYMENT_METHODS } = validation;

    // --- 2. Validate payment method is allowed for this event ---
    if (!allowedPaymentMethods.includes(input.payment_method)) {
      return {
        success: false,
        message: "The selected payment method is not available for this event.",
      };
    }

    // --- 3. Map payment method to DB enum ---
    const paymentSource: PaymentSource = input.payment_method as PaymentSource;

    const remarks = input.remarks ?? null;

    // --- 4. Fetch event_id from primary reservation ---
    const eventId = reservations![0].event_id;

    // --- 5. Create pending order ---
    const { data: newOrder, error: orderErr } = await getSupabaseAdmin()
      .from("orders")
      .insert({
        user_id: session.sub,
        event_id: eventId,
        promotion_id: input.promotion_id ?? null,
        remarks,
        subtotal: computedSubtotal,
        discount_amount: computedDiscount ?? 0,
        final_amount: computedFinal,
        payment_source: paymentSource,
        payment_status: "PENDING",
      })
      .select("order_id, final_amount, payment_source")
      .single();

    if (orderErr) throw orderErr;

    // --- 6. Link reservations to this order ---
    const reservationIds = reservations!.map((r: ReservationRow) => r.reservation_id);

    const { error: linkErr } = await getSupabaseAdmin()
      .from("ticket_reservations")
      .update({ order_id: newOrder.order_id })
      .in("reservation_id", reservationIds)
      .eq("user_id", session.sub)
      .eq("status", "PENDING");

    if (linkErr) {
      logger.error({ fn: "createPendingOrder.linkReservations", message: linkErr.message });
      // Mark the order as FAILED since reservations couldn't be linked
      await getSupabaseAdmin()
        .from("orders")
        .update({ payment_status: "FAILED", remarks: "RESERVATION_LINK_FAILED" })
        .eq("order_id", newOrder.order_id);
      return { success: false, message: "Failed to link reservations. Please try again." };
    }

    // --- 7. Build payment response ---
    if (input.payment_method === "PAYMENT_GATEWAY") {
      // Fetch user profile for gateway form fields
      const { data: userProfile } = await getSupabaseAdmin()
        .from("users")
        .select("name, email, mobile")
        .eq("user_id", session.sub)
        .maybeSingle();

      const nameParts = (userProfile?.name ?? "Customer").split(" ");
      const firstName = nameParts[0] ?? "Customer";
      const lastName = nameParts.slice(1).join(" ") || "-";

      // Build event item description for gateway "items" field
      const { data: event } = await getSupabaseAdmin()
        .from("events")
        .select("name")
        .eq("event_id", eventId)
        .maybeSingle<EventNameRow>();

      const gatewayForm = initiatePaymentGateway({
        orderId: newOrder.order_id,
        amount: computedFinal!,
        itemName: `Tickets - ${event?.name ?? "Event"}`,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerEmail: userProfile?.email ?? session.email,
        customerPhone: userProfile?.mobile ?? "N/A",
        currency: "LKR",
      });

      return {
        success: true,
        message: "Order created. Redirecting to payment gateway.",
        order: newOrder,
        gateway_form: gatewayForm,
      };
    }

    if (input.payment_method === "BANK_TRANSFER") {
      const bankDetails: BankTransferDetails = {
        order_id: newOrder.order_id,
        amount: computedFinal!,
        bank_name: process.env.BANK_TRANSFER_BANK_NAME ?? "Commercial Bank of Ceylon",
        account_number: process.env.BANK_TRANSFER_ACCOUNT_NUMBER ?? "8001234567",
        account_holder: process.env.BANK_TRANSFER_ACCOUNT_HOLDER ?? "BuddyTicket (Pvt) Ltd",
        reference: `BT-${newOrder.order_id.split("-")[0].toUpperCase()}`,
        instructions:
          "Please transfer the exact amount and use your Order ID as the payment reference. Your tickets will be issued once payment is confirmed.",
      };
      return {
        success: true,
        message: "Order created. Please complete bank transfer.",
        order: newOrder,
        bank_details: bankDetails,
      };
    }

    // ONGATE — staff confirm at gate
    return {
      success: true,
      message: "Order created. Complete payment at the gate.",
      order: newOrder,
    };
  } catch (err) {
    logger.error({
      fn: "createPendingOrder",
      message: "Error creating order",
      meta: err,
    });
    return { success: false, message: "Failed to process payment. Please try again." };
  }
}

// --- Helpers ---

function formatValidationError(code: string): string {
  switch (code) {
    case "RESERVATION_EXPIRED":
      return "Your reservation has expired. Please select tickets again.";
    case "RESERVATION_INVALID_STATUS":
      return "Your reservation is no longer valid. Please start over.";
    case "INVENTORY_CONFLICT":
      return "Some tickets are no longer available. Please update your selection.";
    default:
      return code.startsWith("Reservation") || code.startsWith("Ticket") || code.startsWith("Event") || code.startsWith("The") || code.startsWith("A ")
        ? code
        : "Checkout validation failed. Please try again.";
  }
}
