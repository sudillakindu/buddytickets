// lib/actions/system-categories.ts
"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/utils/session";
import { logger } from "@/lib/logger";
import type {
  SystemActionResult,
  SystemCategory,
  GetCategoriesResult,
} from "@/lib/types/system";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Get Categories ──────────────────────────────────────────────────────────

export async function getCategories(): Promise<GetCategoriesResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized", categories: [] };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("category_id, name, description, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({ fn: "getCategories", message: error.message });
      return { success: false, message: "Failed to fetch categories", categories: [] };
    }

    return {
      success: true,
      message: "Categories fetched",
      categories: (data ?? []) as SystemCategory[],
    };
  } catch (err) {
    logger.error({ fn: "getCategories", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error", categories: [] };
  }
}

// ─── Create Category ─────────────────────────────────────────────────────────

export async function createCategory(
  name: string,
  description: string,
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  if (!name.trim()) {
    return { success: false, message: "Category name is required" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("categories")
      .insert({ name: name.trim(), description: description.trim() || null });

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "A category with this name already exists" };
      }
      logger.error({ fn: "createCategory", message: error.message });
      return { success: false, message: "Failed to create category" };
    }

    return { success: true, message: "Category created" };
  } catch (err) {
    logger.error({ fn: "createCategory", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Update Category ─────────────────────────────────────────────────────────

export async function updateCategory(
  categoryId: string,
  name: string,
  description: string,
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  if (!name.trim()) {
    return { success: false, message: "Category name is required" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("categories")
      .update({ name: name.trim(), description: description.trim() || null })
      .eq("category_id", categoryId);

    if (error) {
      if (error.code === "23505") {
        return { success: false, message: "A category with this name already exists" };
      }
      logger.error({ fn: "updateCategory", message: error.message });
      return { success: false, message: "Failed to update category" };
    }

    return { success: true, message: "Category updated" };
  } catch (err) {
    logger.error({ fn: "updateCategory", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}

// ─── Toggle Category Active ──────────────────────────────────────────────────

export async function toggleCategoryActive(
  categoryId: string,
  isActive: boolean,
): Promise<SystemActionResult> {
  if (!(await requireSystem())) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("categories")
      .update({ is_active: isActive })
      .eq("category_id", categoryId);

    if (error) {
      logger.error({ fn: "toggleCategoryActive", message: error.message });
      return { success: false, message: "Failed to update category" };
    }

    return {
      success: true,
      message: `Category ${isActive ? "activated" : "deactivated"}`,
    };
  } catch (err) {
    logger.error({ fn: "toggleCategoryActive", message: "Unexpected error", meta: err });
    return { success: false, message: "Unexpected error" };
  }
}
