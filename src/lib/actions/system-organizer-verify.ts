// lib/actions/system-organizer-verify.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemActionResult,
  OrganizerVerifyItem,
  GetOrganizersResult,
} from "@/lib/types/system";
import type { OrganizerStatus } from "@/lib/types/organizer";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Get Organizers ──────────────────────────────────────────────────────────

export async function getOrganizers(
  status?: OrganizerStatus,
): Promise<GetOrganizersResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized", organizers: [] };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("organizer_details")
      .select(
        `user_id, nic_number, address, bank_name, bank_branch, account_holder_name,
         account_number, nic_front_image_url, nic_back_image_url, status, is_submitted,
         remarks, created_at, users!inner ( name, email )`,
      )
      .eq("is_submitted", true)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ fn: "getOrganizers", message: error.message });
      return { success: false, message: "Failed to fetch organizers", organizers: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const organizers: OrganizerVerifyItem[] = (data ?? []).map((row: any) => ({
      user_id: row.user_id,
      name: row.users?.name ?? "",
      email: row.users?.email ?? "",
      nic_number: row.nic_number,
      address: row.address,
      bank_name: row.bank_name,
      bank_branch: row.bank_branch,
      account_holder_name: row.account_holder_name,
      account_number: row.account_number,
      nic_front_image_url: row.nic_front_image_url,
      nic_back_image_url: row.nic_back_image_url,
      status: row.status,
      is_submitted: row.is_submitted,
      remarks: row.remarks,
      created_at: row.created_at,
    }));

    return { success: true, message: "Organizers fetched", organizers };
  } catch (err) {
    logger.error({ fn: "getOrganizers", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error", organizers: [] };
  }
}

// ─── Approve Organizer ───────────────────────────────────────────────────────

export async function approveOrganizer(
  userId: string,
): Promise<SystemActionResult> {
  const adminUserId = await requireSystem();
  if (!adminUserId) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("organizer_details")
      .update({
        status: "APPROVED",
        verified_by: adminUserId,
        verified_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("status", "PENDING");

    if (error) {
      logger.error({ fn: "approveOrganizer", message: error.message });
      return { success: false, message: "Failed to approve organizer" };
    }

    return { success: true, message: "Organizer approved" };
  } catch (err) {
    logger.error({ fn: "approveOrganizer", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Reject Organizer ────────────────────────────────────────────────────────

export async function rejectOrganizer(
  userId: string,
  remarks: string,
): Promise<SystemActionResult> {
  const adminUserId = await requireSystem();
  if (!adminUserId) {
    return { success: false, message: "Unauthorized" };
  }

  if (!remarks.trim()) {
    return { success: false, message: "Remarks are required for rejection" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("organizer_details")
      .update({
        status: "REJECTED",
        verified_by: adminUserId,
        verified_at: new Date().toISOString(),
        remarks: remarks.trim(),
      })
      .eq("user_id", userId)
      .eq("status", "PENDING");

    if (error) {
      logger.error({ fn: "rejectOrganizer", message: error.message });
      return { success: false, message: "Failed to reject organizer" };
    }

    return { success: true, message: "Organizer rejected" };
  } catch (err) {
    logger.error({ fn: "rejectOrganizer", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}
