// lib/actions/admin-event.ts
// Admin server actions for event management.
// SECURITY: All actions validate SYSTEM role before execution.

"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import { ALL_PAYMENT_METHODS } from "@/lib/types/payment";
import type { PaymentMethod } from "@/lib/types/payment";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminEventSummary {
  event_id: string;
  name: string;
  status: string;
  is_active: boolean;
  start_at: string;
  allowed_payment_methods: PaymentMethod[] | null;
}

export interface GetAdminEventsResult {
  success: boolean;
  message: string;
  events?: AdminEventSummary[];
}

export interface UpdatePaymentMethodsResult {
  success: boolean;
  message: string;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Fetches all events for admin management with their payment method config.
 * SECURITY: Requires SYSTEM role.
 */
export async function getAdminEvents(): Promise<GetAdminEventsResult> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") {
    return { success: false, message: "Unauthorized." };
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("events")
      .select("event_id, name, status, is_active, start_at, allowed_payment_methods")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const events: AdminEventSummary[] = (data ?? []).map((row) => ({
      event_id: row.event_id,
      name: row.name,
      status: row.status,
      is_active: row.is_active,
      start_at: row.start_at,
      allowed_payment_methods: (row as Record<string, unknown>).allowed_payment_methods as PaymentMethod[] | null,
    }));

    return { success: true, message: "OK", events };
  } catch (err) {
    logger.error({
      fn: "getAdminEvents",
      message: "Error fetching admin events",
      meta: err,
    });
    return { success: false, message: "Failed to load events." };
  }
}

/**
 * Updates the allowed payment methods for a specific event.
 * SECURITY: Requires SYSTEM role.
 *
 * @param eventId - The event to update
 * @param methods - Array of allowed payment methods, or null to allow all
 */
export async function updateEventPaymentMethods(
  eventId: string,
  methods: PaymentMethod[] | null,
): Promise<UpdatePaymentMethodsResult> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") {
    return { success: false, message: "Unauthorized." };
  }

  if (!eventId) {
    return { success: false, message: "Event ID is required." };
  }

  // Validate methods are valid PaymentMethod values
  if (methods !== null) {
    const validMethods = new Set<string>(ALL_PAYMENT_METHODS);
    for (const m of methods) {
      if (!validMethods.has(m)) {
        return { success: false, message: `Invalid payment method: ${m}` };
      }
    }
    // If all methods are selected, store NULL (default behavior)
    if (methods.length === ALL_PAYMENT_METHODS.length) {
      methods = null;
    }
    // Empty array not allowed (DB constraint)
    if (methods !== null && methods.length === 0) {
      return { success: false, message: "At least one payment method must be selected." };
    }
  }

  try {
    const { error } = await getSupabaseAdmin()
      .from("events")
      .update({ allowed_payment_methods: methods })
      .eq("event_id", eventId);

    if (error) throw error;

    return { success: true, message: "Payment methods updated successfully." };
  } catch (err) {
    logger.error({
      fn: "updateEventPaymentMethods",
      message: "Error updating event payment methods",
      meta: err,
    });
    return { success: false, message: "Failed to update payment methods." };
  }
}
