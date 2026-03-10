// lib/actions/system-users.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemUserRow,
  SystemActionResult,
  SystemListResult,
  UserRole,
} from "@/lib/types/system";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session?.sub || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getSystemUsers(
  roleFilter: "ALL" | UserRole = "ALL",
  search: string = "",
  page: number = 1,
  pageSize: number = 10,
): Promise<SystemListResult<SystemUserRow>> {
  try {
    const userId = await requireSystem();
    if (!userId) {
      return { success: false, message: "Unauthorized.", data: [], total: 0 };
    }

    const db = getSupabaseAdmin();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = db
      .from("users")
      .select(
        "user_id, name, email, mobile, username, role, is_active, is_email_verified, created_at, last_login_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (roleFilter !== "ALL") {
      query = query.eq("role", roleFilter);
    }

    if (search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getSystemUsers",
        message: "Failed to fetch users",
        meta: error.message,
      });
      return { success: false, message: "Failed to fetch users.", data: [], total: 0 };
    }

    return {
      success: true,
      message: "Users loaded.",
      data: (data ?? []) as SystemUserRow[],
      total: count ?? 0,
    };
  } catch (err) {
    logger.error({
      fn: "getSystemUsers",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error.", data: [], total: 0 };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function toggleUserActive(
  targetUserId: string,
  isActive: boolean,
): Promise<SystemActionResult> {
  try {
    const adminId = await requireSystem();
    if (!adminId) {
      return { success: false, message: "Unauthorized." };
    }

    // Prevent disabling own account
    if (targetUserId === adminId) {
      return { success: false, message: "Cannot modify your own account." };
    }

    const db = getSupabaseAdmin();
    const { error } = await db
      .from("users")
      .update({ is_active: isActive })
      .eq("user_id", targetUserId);

    if (error) {
      logger.error({
        fn: "toggleUserActive",
        message: "Failed to update user",
        meta: error.message,
      });
      return { success: false, message: "Failed to update user." };
    }

    return {
      success: true,
      message: isActive ? "User activated." : "User suspended.",
    };
  } catch (err) {
    logger.error({
      fn: "toggleUserActive",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "Unexpected error." };
  }
}
