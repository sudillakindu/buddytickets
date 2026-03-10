// lib/actions/system_categories-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  PaginatedResult,
  ActionResult,
  SystemCategory,
} from "@/lib/types/system";

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function requireSystem(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "SYSTEM") return null;
  return session.sub;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getCategories(
  page: number = 1,
  perPage: number = 100,
): Promise<PaginatedResult<SystemCategory>> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const supabase = await createClient();

    const { data, error, count } = await supabase
      .from("categories")
      .select("*, events(count)", { count: "exact" })
      .order("name", { ascending: true })
      .range(from, to);

    if (error) {
      logger.error({
        fn: "getCategories",
        message: "DB fetch error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load categories." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories: SystemCategory[] = (data ?? []).map((row: any) => ({
      category_id: row.category_id,
      name: row.name,
      description: row.description,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      events_count: row.events?.[0]?.count ?? 0,
    }));

    return {
      success: true,
      message: "Categories loaded.",
      data: categories,
      total_count: count ?? 0,
      page,
      per_page: perPage,
    };
  } catch (err) {
    logger.error({
      fn: "getCategories",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createCategory(
  name: string,
  description?: string,
): Promise<ActionResult> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!name.trim()) {
      return { success: false, message: "Category name is required." };
    }

    const admin = getSupabaseAdmin();

    const { error } = await admin.from("categories").insert({
      name: name.trim(),
      description: description?.trim() || null,
    });

    if (error) {
      logger.error({
        fn: "createCategory",
        message: "DB insert error",
        meta: error.message,
      });
      return { success: false, message: "Failed to create category." };
    }

    revalidatePath("/dashboard/system-overview");
    return { success: true, message: "Category created." };
  } catch (err) {
    logger.error({
      fn: "createCategory",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function updateCategory(
  categoryId: string,
  name: string,
  description?: string,
): Promise<ActionResult> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!name.trim()) {
      return { success: false, message: "Category name is required." };
    }

    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("categories")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .eq("category_id", categoryId);

    if (error) {
      logger.error({
        fn: "updateCategory",
        message: "DB update error",
        meta: error.message,
      });
      return { success: false, message: "Failed to update category." };
    }

    revalidatePath("/dashboard/system-overview");
    return { success: true, message: "Category updated." };
  } catch (err) {
    logger.error({
      fn: "updateCategory",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function toggleCategoryActive(
  categoryId: string,
): Promise<ActionResult> {
  try {
    const userId = await requireSystem();
    if (!userId) return { success: false, message: "Unauthorized." };

    const admin = getSupabaseAdmin();

    const { data: category, error: fetchErr } = await admin
      .from("categories")
      .select("is_active")
      .eq("category_id", categoryId)
      .maybeSingle();

    if (fetchErr || !category) {
      if (fetchErr)
        logger.error({
          fn: "toggleCategoryActive",
          message: "DB fetch error",
          meta: fetchErr.message,
        });
      return { success: false, message: "Category not found." };
    }

    // Prevent deactivating if active events use this category
    if (category.is_active) {
      const { count, error: countErr } = await admin
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("category_id", categoryId)
        .eq("is_active", true);

      if (countErr) {
        logger.error({
          fn: "toggleCategoryActive",
          message: "DB count error",
          meta: countErr.message,
        });
        return {
          success: false,
          message: "Failed to check active events for this category.",
        };
      }

      if (count && count > 0) {
        return {
          success: false,
          message: `Cannot deactivate: ${count} active event(s) use this category.`,
        };
      }
    }

    const { error: updateErr } = await admin
      .from("categories")
      .update({ is_active: !category.is_active })
      .eq("category_id", categoryId);

    if (updateErr) {
      logger.error({
        fn: "toggleCategoryActive",
        message: "DB update error",
        meta: updateErr.message,
      });
      return { success: false, message: "Failed to update category status." };
    }

    revalidatePath("/dashboard/system-overview");
    return {
      success: true,
      message: category.is_active
        ? "Category deactivated."
        : "Category activated.",
    };
  } catch (err) {
    logger.error({
      fn: "toggleCategoryActive",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}
