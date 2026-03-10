// lib/actions/system_organizer-verification-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  PaginatedResult,
  ActionResult,
  SystemOrganizerVerification,
  OrganizerStatus,
} from "@/lib/types/system";

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getVerifications(
  statusFilter?: OrganizerStatus,
  page: number = 1,
  perPage: number = 20,
): Promise<PaginatedResult<SystemOrganizerVerification>> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = await createClient();

    let query = supabase
      .from("organizer_details")
      .select("*, users:user_id(name, email, image_url)", { count: "exact" });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getVerifications",
        message: "DB fetch error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load verifications." };
    }

    const verifications: SystemOrganizerVerification[] = (data ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (row: any) => ({
        user_id: row.user_id,
        nic_number: row.nic_number,
        address: row.address,
        bank_name: row.bank_name,
        bank_branch: row.bank_branch,
        account_holder_name: row.account_holder_name,
        account_number: row.account_number,
        nic_front_image_url: row.nic_front_image_url,
        nic_back_image_url: row.nic_back_image_url,
        remarks: row.remarks,
        status: row.status,
        is_submitted: row.is_submitted,
        verified_by: row.verified_by,
        verified_at: row.verified_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user_name: row.users?.name ?? "Unknown",
        user_email: row.users?.email ?? "Unknown",
        user_image_url: row.users?.image_url ?? null,
      }),
    );

    return {
      success: true,
      message: "Verifications loaded.",
      data: verifications,
      total_count: count ?? 0,
      page,
      per_page: perPage,
    };
  } catch (err) {
    logger.error({
      fn: "getVerifications",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function approveOrganizer(
  targetUserId: string,
): Promise<ActionResult> {
  try {
    const currentUserId = await requireSystem();
    if (!currentUserId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("organizer_details")
      .update({
        status: "APPROVED",
        verified_by: currentUserId,
        verified_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId);

    if (error) {
      logger.error({
        fn: "approveOrganizer",
        message: "DB update error",
        meta: error.message,
      });
      return { success: false, message: "Failed to approve organizer." };
    }

    return { success: true, message: "Organizer approved." };
  } catch (err) {
    logger.error({
      fn: "approveOrganizer",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function rejectOrganizer(
  targetUserId: string,
  remarks: string,
): Promise<ActionResult> {
  try {
    const currentUserId = await requireSystem();
    if (!currentUserId) return { success: false, message: "Unauthorized." };

    if (!remarks.trim()) {
      return {
        success: false,
        message: "Remarks are required when rejecting.",
      };
    }

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("organizer_details")
      .update({
        status: "REJECTED",
        remarks: remarks.trim(),
        verified_by: currentUserId,
        verified_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId);

    if (error) {
      logger.error({
        fn: "rejectOrganizer",
        message: "DB update error",
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
    return { success: false, message: "An unexpected error occurred." };
  }
}
