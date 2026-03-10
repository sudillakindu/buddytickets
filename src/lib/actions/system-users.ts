// lib/actions/system-users.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemActionResult,
  SystemUser,
  GetUsersResult,
} from "@/lib/types/system";
import type { UserRole } from "@/lib/types/organizer";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Get Users ───────────────────────────────────────────────────────────────

export async function getSystemUsers(filters?: {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}): Promise<GetUsersResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized", users: [] };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("users")
      .select("user_id, name, email, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (filters?.role) {
      query = query.eq("role", filters.role);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }
    if (filters?.search) {
      const term = `%${filters.search}%`;
      query = query.or(`name.ilike.${term},email.ilike.${term}`);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ fn: "getSystemUsers", message: error.message });
      return { success: false, message: "Failed to fetch users", users: [] };
    }

    return {
      success: true,
      message: "Users fetched",
      users: (data ?? []) as SystemUser[],
    };
  } catch (err) {
    logger.error({ fn: "getSystemUsers", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error", users: [] };
  }
}

// ─── Toggle Active ───────────────────────────────────────────────────────────

export async function toggleUserActive(
  userId: string,
  isActive: boolean,
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("users")
      .update({ is_active: isActive })
      .eq("user_id", userId);

    if (error) {
      logger.error({ fn: "toggleUserActive", message: error.message });
      return { success: false, message: "Failed to update user status" };
    }

    return { success: true, message: `User ${isActive ? "activated" : "deactivated"}` };
  } catch (err) {
    logger.error({ fn: "toggleUserActive", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Change Role ─────────────────────────────────────────────────────────────

export async function changeUserRole(
  userId: string,
  newRole: "STAFF" | "USER",
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  if (newRole !== "STAFF" && newRole !== "USER") {
    return { success: false, message: "Only STAFF↔USER role changes allowed" };
  }

  try {
    const admin = getSupabaseAdmin();

    // Verify user is currently STAFF or USER
    const { data: user, error: fetchErr } = await admin
      .from("users")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (fetchErr || !user) {
      return { success: false, message: "User not found" };
    }

    if (user.role !== "STAFF" && user.role !== "USER") {
      return { success: false, message: "Can only change roles between STAFF and USER" };
    }

    const { error } = await admin
      .from("users")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      logger.error({ fn: "changeUserRole", message: error.message });
      return { success: false, message: "Failed to change role" };
    }

    return { success: true, message: `Role changed to ${newRole}` };
  } catch (err) {
    logger.error({ fn: "changeUserRole", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}
