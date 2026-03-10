// lib/actions/system_users-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  PaginatedResult,
  ActionResult,
  SystemUser,
  UserRole,
} from "@/lib/types/system";

// ─── Internal Helpers ────────────────────────────────────────────────────────

const VALID_ROLES: UserRole[] = ["SYSTEM", "ORGANIZER", "STAFF", "USER"];

const USER_COLUMNS =
  "user_id, name, image_url, email, is_email_verified, mobile, is_mobile_verified, username, role, is_active, created_at, updated_at, last_login_at";

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getUsers(filters: {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PaginatedResult<SystemUser>> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = await createClient();

    let query = supabase
      .from("users")
      .select(USER_COLUMNS, { count: "exact" });

    if (filters.role) {
      query = query.eq("role", filters.role);
    }

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters.search) {
      const term = filters.search.trim();
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,email.ilike.%${term}%,username.ilike.%${term}%`,
        );
      }
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error({
        fn: "getUsers",
        message: "DB fetch error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load users." };
    }

    return {
      success: true,
      message: "Users loaded.",
      data: (data ?? []) as SystemUser[],
      total_count: count ?? 0,
      page,
      per_page: perPage,
    };
  } catch (err) {
    logger.error({
      fn: "getUsers",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function toggleUserActive(userId: string): Promise<ActionResult> {
  try {
    const currentUserId = await requireSystem();
    if (!currentUserId) return { success: false, message: "Unauthorized." };

    if (userId === currentUserId) {
      return { success: false, message: "You cannot deactivate yourself." };
    }

    const admin = getSupabaseAdmin();

    const { data: user, error: fetchErr } = await admin
      .from("users")
      .select("is_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr || !user) {
      if (fetchErr)
        logger.error({
          fn: "toggleUserActive",
          message: "DB fetch error",
          meta: fetchErr.message,
        });
      return { success: false, message: "User not found." };
    }

    const { error: updateErr } = await admin
      .from("users")
      .update({ is_active: !user.is_active })
      .eq("user_id", userId);

    if (updateErr) {
      logger.error({
        fn: "toggleUserActive",
        message: "DB update error",
        meta: updateErr.message,
      });
      return { success: false, message: "Failed to update user status." };
    }

    return {
      success: true,
      message: user.is_active ? "User deactivated." : "User activated.",
    };
  } catch (err) {
    logger.error({
      fn: "toggleUserActive",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function changeUserRole(
  userId: string,
  newRole: UserRole,
): Promise<ActionResult> {
  try {
    const currentUserId = await requireSystem();
    if (!currentUserId) return { success: false, message: "Unauthorized." };

    if (userId === currentUserId) {
      return { success: false, message: "You cannot change your own role." };
    }

    if (!VALID_ROLES.includes(newRole)) {
      return { success: false, message: "Invalid role specified." };
    }

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("users")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      logger.error({
        fn: "changeUserRole",
        message: "DB update error",
        meta: error.message,
      });
      return { success: false, message: "Failed to change user role." };
    }

    return { success: true, message: `User role changed to ${newRole}.` };
  } catch (err) {
    logger.error({
      fn: "changeUserRole",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}
