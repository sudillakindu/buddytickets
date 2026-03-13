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

interface PrePaymentValidationResult {
  valid: boolean;
  error?: string;
  computedSubtotal?: number;
  computedDiscount?: number;
  computedFinal?: number;
  reservations?: ReservationRow[];
  allowedPaymentMethods?: PaymentMethod[];
}

// Server-side validation to recompute pricing and verify availability
async function runPrePaymentValidation(
  primaryReservationId: string,
  userId: string,
  appliedPromo: ValidatedPromotion | null,
): Promise<PrePaymentValidationResult> {
  const now = new Date().toISOString();

  const { data: primary, error: primErr } = await getSupabaseAdmin()
    .from("ticket_reservations")
    .select("reservation_id, user_id, event_id, expires_at, status")
    .eq("reservation_id", primaryReservationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (primErr) throw primErr;
  if (!primary) return { valid: false, error: "Reservation not found." };
  if (primary.status !== "PENDING")
    return { valid: false, error: "RESERVATION_INVALID_STATUS" };
  if (primary.expires_at <= now)
    return { valid: false, error: "RESERVATION_EXPIRED" };

  const eventId = primary.event_id;
  if (!eventId)
    return { valid: false, error: "Reservation missing event reference." };

  const { data: reservations, error: resErr } = await getSupabaseAdmin()
    .from("ticket_reservations")
    .select(
      "reservation_id, ticket_type_id, quantity, expires_at, status, order_id, user_id, event_id, reserved_at",
    )
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("status", "PENDING")
    .gt("expires_at", now);

  if (resErr) throw resErr;
  if (!reservations || reservations.length === 0)
    return { valid: false, error: "RESERVATION_EXPIRED" };

  const ticketTypeIds = reservations.map(
    (r: ReservationRow) => r.ticket_type_id,
  );

  const { data: ticketTypes, error: ttErr } = await getSupabaseAdmin()
    .from("ticket_types")
    .select(
      "ticket_type_id, price, capacity, qty_sold, is_active, sale_start_at, sale_end_at, version",
    )
    .in("ticket_type_id", ticketTypeIds);

  if (ttErr) throw ttErr;

  const ttMap = new Map(
    (ticketTypes ?? []).map((tt: Record<string, unknown>) => [
      tt.ticket_type_id as string,
      tt,
    ]),
  );

  const { data: event, error: evErr } = await getSupabaseAdmin()
    .from("events")
    .select("event_id, status, is_active, allowed_payment_methods")
    .eq("event_id", eventId)
    .maybeSingle();

  if (evErr) throw evErr;
  if (!event || !event.is_active)
    return { valid: false, error: "Event not available." };
  if (event.status !== "ON_SALE" && event.status !== "ONGOING")
    return { valid: false, error: "Ticket sales are closed for this event." };

  const rawMethods = event.allowed_payment_methods as PaymentMethod[] | null;
  const allowedPaymentMethods: PaymentMethod[] =
    rawMethods && rawMethods.length > 0 ? rawMethods : [...ALL_PAYMENT_METHODS];

  let computedSubtotal = 0;

  for (const res of reservations as ReservationRow[]) {
    const tt = ttMap.get(res.ticket_type_id) as
      | Record<string, unknown>
      | undefined;
    if (!tt) return { valid: false, error: "Ticket type not found." };
    if (!tt.is_active)
      return {
        valid: false,
        error: "A selected ticket type is no longer available.",
      };

    const saleStart = tt.sale_start_at as string | null;
    const saleEnd = tt.sale_end_at as string | null;
    if (saleStart && now < saleStart)
      return { valid: false, error: "Ticket sales have not started yet." };
    if (saleEnd && now > saleEnd)
      return {
        valid: false,
        error: "Ticket sales have ended for a selected type.",
      };

    const available = (tt.capacity as number) - (tt.qty_sold as number);
    if (available < res.quantity)
      return { valid: false, error: "INVENTORY_CONFLICT" };

    const price = Number(tt.price);
    if (!Number.isFinite(price) || price < 0)
      return { valid: false, error: "Invalid ticket price configuration." };

    computedSubtotal += price * res.quantity;
  }

  let computedDiscount = 0;
  if (appliedPromo) {
    const promoRes = await getSupabaseAdmin()
      .from("promotions")
      .select(
        "promotion_id, is_active, start_at, end_at, usage_limit_global, current_global_usage, discount_type, discount_value, max_discount_cap, min_order_amount, scope_event_id, scope_ticket_type_id",
      )
      .eq("promotion_id", appliedPromo.promotion_id)
      .maybeSingle();

    if (promoRes.error) throw promoRes.error;
    if (!promoRes.data)
      return { valid: false, error: "Applied promo no longer exists." };

    const p = promoRes.data as Record<string, unknown>;
    if (
      !p.is_active ||
      now > (p.end_at as string) ||
      now < (p.start_at as string)
    )
      return {
        valid: false,
        error: "The applied promo code is no longer valid.",
      };
    if (
      (p.usage_limit_global as number) > 0 &&
      (p.current_global_usage as number) >= (p.usage_limit_global as number)
    )
      return { valid: false, error: "The promo code has reached its limit." };
    if ((p.scope_event_id as string | null) && p.scope_event_id !== eventId)
      return { valid: false, error: "Promo not valid for this event." };

    if (p.discount_type === "PERCENTAGE") {
      computedDiscount =
        computedSubtotal * ((p.discount_value as number) / 100);
      if ((p.max_discount_cap as number | null) !== null) {
        computedDiscount = Math.min(
          computedDiscount,
          p.max_discount_cap as number,
        );
      }
    } else {
      computedDiscount = Math.min(p.discount_value as number, computedSubtotal);
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

// Creates a pending order after validation and ties reservations to it
export async function createPendingOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const session = await getSession();
  if (!session)
    return {
      success: false,
      message: "Please sign in to complete your purchase.",
    };

  try {
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

    if (!validation.valid)
      return {
        success: false,
        message: formatValidationError(validation.error!),
      };

    const {
      computedSubtotal,
      computedDiscount,
      computedFinal,
      reservations,
      allowedPaymentMethods = ALL_PAYMENT_METHODS,
    } = validation;

    if (!allowedPaymentMethods.includes(input.payment_method)) {
      return {
        success: false,
        message: "The selected payment method is not available for this event.",
      };
    }

    const paymentSource: PaymentSource = input.payment_method as PaymentSource;
    const remarks = input.remarks ?? null;
    const eventId = reservations![0].event_id;

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

    const reservationIds = reservations!.map(
      (r: ReservationRow) => r.reservation_id,
    );
    const { error: linkErr } = await getSupabaseAdmin()
      .from("ticket_reservations")
      .update({ order_id: newOrder.order_id })
      .in("reservation_id", reservationIds)
      .eq("user_id", session.sub)
      .eq("status", "PENDING");

    if (linkErr) {
      logger.error({
        fn: "createPendingOrder.linkReservations",
        message: linkErr.message,
      });
      await getSupabaseAdmin()
        .from("orders")
        .update({
          payment_status: "FAILED",
          remarks: "RESERVATION_LINK_FAILED",
        })
        .eq("order_id", newOrder.order_id);
      return {
        success: false,
        message: "Failed to link reservations. Please try again.",
      };
    }

    if (input.payment_method === "PAYMENT_GATEWAY") {
      const { data: userProfile } = await getSupabaseAdmin()
        .from("users")
        .select("name, email, mobile")
        .eq("user_id", session.sub)
        .maybeSingle();
      const nameParts = (userProfile?.name ?? "Customer").split(" ");
      const firstName = nameParts[0] ?? "Customer";
      const lastName = nameParts.slice(1).join(" ") || "-";

      const { data: event } = await getSupabaseAdmin()
        .from("events")
        .select("name")
        .eq("event_id", eventId)
        .maybeSingle();

      const gatewayForm = initiatePaymentGateway({
        orderId: newOrder.order_id,
        amount: computedFinal!,
        itemName: `Tickets - ${(event as Record<string, unknown>)?.name ?? "Event"}`,
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
        bank_name:
          process.env.BANK_TRANSFER_BANK_NAME ?? "Commercial Bank of Ceylon",
        account_number:
          process.env.BANK_TRANSFER_ACCOUNT_NUMBER ?? "8001234567",
        account_holder:
          process.env.BANK_TRANSFER_ACCOUNT_HOLDER ?? "BuddyTicket (Pvt) Ltd",
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
    return {
      success: false,
      message: "Failed to process payment. Please try again.",
    };
  }
}

function formatValidationError(code: string): string {
  switch (code) {
    case "RESERVATION_EXPIRED":
      return "Your reservation has expired. Please select tickets again.";
    case "RESERVATION_INVALID_STATUS":
      return "Your reservation is no longer valid. Please start over.";
    case "INVENTORY_CONFLICT":
      return "Some tickets are no longer available. Please update your selection.";
    default:
      return code.startsWith("Reservation") ||
        code.startsWith("Ticket") ||
        code.startsWith("Event") ||
        code.startsWith("The") ||
        code.startsWith("A ")
        ? code
        : "Checkout validation failed. Please try again.";
  }
}
