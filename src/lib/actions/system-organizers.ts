// lib/actions/system-organizers.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemOrganizerRow,
  OrganizerActionResult,
  SystemListResult,
  OrganizerVerifyStatus,
} from "@/lib/types/system";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session?.sub || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getOrganizers(
  filter: "ALL" | OrganizerVerifyStatus = "ALL",
  page: number = 1,
  pageSize: number = 10,
): Promise<SystemListResult<SystemOrganizerRow>> {
  try {
    const userId = await requireSystem();
    if (!userId) {
      return { success: false, message: "Unauthorized.", data: [], total: 0 };
    }

    const db = getSupabaseAdmin();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build query for users with ORGANIZER role
    let query = db
      .from("users")
      .select(
        "user_id, name, email, mobile, is_active, created_at, organizer_details(nic_number, address, bank_name, bank_branch, account_holder_name, account_number, nic_front_image_url, nic_back_image_url, remarks, status, is_submitted, verified_at, created_at)",
        { count: "exact" },
      )
      .eq("role", "ORGANIZER")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filter !== "ALL") {
      query = query.eq("organizer_details.status", filter);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getOrganizers",
        message: "Failed to fetch organizers",
        meta: error.message,
      });
      return { success: false, message: "Failed to fetch organizers.", data: [], total: 0 };
    }

    // Transform nested data — Supabase returns organizer_details as array
    const rows: SystemOrganizerRow[] = (data ?? []).map((u) => {
      const od = Array.isArray(u.organizer_details)
        ? u.organizer_details[0] ?? null
        : u.organizer_details ?? null;
      return { ...u, organizer_details: od };
    });

    // When filtering by status, exclude rows with no matching organizer_details
    const filtered =
      filter !== "ALL"
        ? rows.filter((r) => r.organizer_details?.status === filter)
        : rows;

    return {
      success: true,
      message: "Organizers loaded.",
      data: filtered,
      total: count ?? 0,
    };
  } catch (err) {
    logger.error({
      fn: "getOrganizers",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error.", data: [], total: 0 };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function approveOrganizer(
  organizerUserId: string,
): Promise<OrganizerActionResult> {
  try {
    const adminId = await requireSystem();
    if (!adminId) {
      return { success: false, message: "Unauthorized." };
    }

    const db = getSupabaseAdmin();
    const { error } = await db
      .from("organizer_details")
      .update({
        status: "APPROVED",
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        remarks: null,
      })
      .eq("user_id", organizerUserId)
      .eq("status", "PENDING");

    if (error) {
      logger.error({
        fn: "approveOrganizer",
        message: "Failed to approve organizer",
        meta: error.message,
      });
      return { success: false, message: "Failed to approve organizer." };
    }

    return { success: true, message: "Organizer approved successfully." };
  } catch (err) {
    logger.error({
      fn: "approveOrganizer",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error." };
  }
}

export async function rejectOrganizer(
  organizerUserId: string,
  remarks: string,
): Promise<OrganizerActionResult> {
  try {
    const adminId = await requireSystem();
    if (!adminId) {
      return { success: false, message: "Unauthorized." };
    }

    if (!remarks.trim()) {
      return { success: false, message: "Rejection reason is required." };
    }

    const db = getSupabaseAdmin();
    const { error } = await db
      .from("organizer_details")
      .update({
        status: "REJECTED",
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        remarks: remarks.trim(),
      })
      .eq("user_id", organizerUserId)
      .eq("status", "PENDING");

    if (error) {
      logger.error({
        fn: "rejectOrganizer",
        message: "Failed to reject organizer",
        meta: error.message,
      });
      return { success: false, message: "Failed to reject organizer." };
    }

    return { success: true, message: "Organizer rejected." };
  } catch (err) {
    logger.error({
      fn: "rejectOrganizer",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error." };
  }
}

export async function suspendOrganizer(
  organizerUserId: string,
): Promise<OrganizerActionResult> {
  try {
    const adminId = await requireSystem();
    if (!adminId) {
      return { success: false, message: "Unauthorized." };
    }

    const db = getSupabaseAdmin();
    const { error } = await db
      .from("users")
      .update({ is_active: false })
      .eq("user_id", organizerUserId)
      .eq("role", "ORGANIZER");

    if (error) {
      logger.error({
        fn: "suspendOrganizer",
        message: "Failed to suspend organizer",
        meta: error.message,
      });
      return { success: false, message: "Failed to suspend organizer." };
    }

    return { success: true, message: "Organizer suspended." };
  } catch (err) {
    logger.error({
      fn: "suspendOrganizer",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error." };
  }
}

export async function reactivateOrganizer(
  organizerUserId: string,
): Promise<OrganizerActionResult> {
  try {
    const adminId = await requireSystem();
    if (!adminId) {
      return { success: false, message: "Unauthorized." };
    }

    const db = getSupabaseAdmin();
    const { error } = await db
      .from("users")
      .update({ is_active: true })
      .eq("user_id", organizerUserId)
      .eq("role", "ORGANIZER");

    if (error) {
      logger.error({
        fn: "reactivateOrganizer",
        message: "Failed to reactivate organizer",
        meta: error.message,
      });
      return { success: false, message: "Failed to reactivate organizer." };
    }

    return { success: true, message: "Organizer reactivated." };
  } catch (err) {
    logger.error({
      fn: "reactivateOrganizer",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error." };
  }
}
