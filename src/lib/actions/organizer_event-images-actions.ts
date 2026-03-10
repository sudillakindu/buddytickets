// lib/actions/organizer_event-images-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { getSession } from "@/lib/utils/session";
import type {
  ActionResult,
  ActionResultWithData,
} from "@/lib/types/organizer_dashboard";

interface EventImage {
  event_id: string;
  priority_order: number;
  image_url: string;
  created_at: string;
}

async function requireOrganizer(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== "ORGANIZER") return null;
  return session.sub;
}

async function verifyEventOwnership(
  eventId: string,
  userId: string,
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("events")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("organizer_id", userId)
    .maybeSingle();
  return !!data;
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getEventImages(
  eventId: string,
): Promise<ActionResultWithData<EventImage[]>> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!(await verifyEventOwnership(eventId, userId))) {
      return { success: false, message: "Event not found." };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("event_images")
      .select("event_id, priority_order, image_url, created_at")
      .eq("event_id", eventId)
      .order("priority_order", { ascending: true });

    if (error) {
      logger.error({
        fn: "getEventImages",
        message: "DB error",
        meta: error.message,
      });
      return { success: false, message: "Failed to load event images." };
    }

    return {
      success: true,
      message: "Event images loaded.",
      data: (data ?? []) as EventImage[],
    };
  } catch (err) {
    logger.error({
      fn: "getEventImages",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function addEventImage(
  eventId: string,
  imageUrl: string,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!(await verifyEventOwnership(eventId, userId))) {
      return { success: false, message: "Event not found." };
    }

    const admin = getSupabaseAdmin();

    // Determine the next priority_order
    const { data: existing, error: fetchError } = await admin
      .from("event_images")
      .select("priority_order")
      .eq("event_id", eventId)
      .order("priority_order", { ascending: false })
      .limit(1);

    if (fetchError) {
      logger.error({
        fn: "addEventImage",
        message: "DB fetch error",
        meta: fetchError.message,
      });
      return { success: false, message: "Failed to add image." };
    }

    const nextOrder =
      existing && existing.length > 0 ? existing[0].priority_order + 1 : 1;

    const { error } = await admin.from("event_images").insert({
      event_id: eventId,
      priority_order: nextOrder,
      image_url: imageUrl,
    });

    if (error) {
      logger.error({
        fn: "addEventImage",
        message: "DB insert error",
        meta: error.message,
      });
      return { success: false, message: "Failed to add image." };
    }

    revalidatePath("/dashboard/organizer-events");
    return { success: true, message: "Image added." };
  } catch (err) {
    logger.error({
      fn: "addEventImage",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteEventImage(
  eventId: string,
  priorityOrder: number,
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!(await verifyEventOwnership(eventId, userId))) {
      return { success: false, message: "Event not found." };
    }

    const admin = getSupabaseAdmin();

    const { error: delError } = await admin
      .from("event_images")
      .delete()
      .eq("event_id", eventId)
      .eq("priority_order", priorityOrder);

    if (delError) {
      logger.error({
        fn: "deleteEventImage",
        message: "DB delete error",
        meta: delError.message,
      });
      return { success: false, message: "Failed to delete image." };
    }

    // Reorder remaining images to fill the gap
    const { data: remaining, error: fetchError } = await admin
      .from("event_images")
      .select("priority_order, image_url")
      .eq("event_id", eventId)
      .order("priority_order", { ascending: true });

    if (fetchError) {
      logger.error({
        fn: "deleteEventImage",
        message: "DB fetch error during reorder",
        meta: fetchError.message,
      });
      // Deletion succeeded but reorder failed — still report success
      revalidatePath("/dashboard/organizer-events");
      return { success: true, message: "Image deleted." };
    }

    if (remaining && remaining.length > 0) {
      // Phase 1: move all to temporary negative values to avoid PK conflicts
      await Promise.all(
        remaining.map((row, i) =>
          admin
            .from("event_images")
            .update({ priority_order: -(i + 1) })
            .eq("event_id", eventId)
            .eq("priority_order", row.priority_order),
        ),
      );

      // Phase 2: assign new positive priorities in order
      await Promise.all(
        remaining.map((_, i) =>
          admin
            .from("event_images")
            .update({ priority_order: i + 1 })
            .eq("event_id", eventId)
            .eq("priority_order", -(i + 1)),
        ),
      );
    }

    revalidatePath("/dashboard/organizer-events");
    return { success: true, message: "Image deleted." };
  } catch (err) {
    logger.error({
      fn: "deleteEventImage",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}

// ─── Reorder ─────────────────────────────────────────────────────────────────

export async function reorderEventImages(
  eventId: string,
  orderedPriorities: number[],
): Promise<ActionResult> {
  try {
    const userId = await requireOrganizer();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!(await verifyEventOwnership(eventId, userId))) {
      return { success: false, message: "Event not found." };
    }

    const admin = getSupabaseAdmin();

    // Fetch current images to validate the input
    const { data: current, error: fetchError } = await admin
      .from("event_images")
      .select("priority_order")
      .eq("event_id", eventId)
      .order("priority_order", { ascending: true });

    if (fetchError) {
      logger.error({
        fn: "reorderEventImages",
        message: "DB fetch error",
        meta: fetchError.message,
      });
      return { success: false, message: "Failed to reorder images." };
    }

    const currentOrders = (current ?? []).map((r) => r.priority_order);

    // Validate that orderedPriorities contains exactly the same set of priorities
    if (
      orderedPriorities.length !== currentOrders.length ||
      ![...orderedPriorities].sort((a, b) => a - b).every(
        (v, i) => v === currentOrders[i],
      )
    ) {
      return {
        success: false,
        message: "Provided priorities do not match existing images.",
      };
    }

    // Phase 1: move all to temporary negative values to avoid PK conflicts
    const phase1Results = await Promise.all(
      orderedPriorities.map((oldPriority, i) =>
        admin
          .from("event_images")
          .update({ priority_order: -(i + 1) })
          .eq("event_id", eventId)
          .eq("priority_order", oldPriority),
      ),
    );

    const phase1Error = phase1Results.find((r) => r.error)?.error;
    if (phase1Error) {
      logger.error({
        fn: "reorderEventImages",
        message: "DB update error (phase 1)",
        meta: phase1Error.message,
      });
      return { success: false, message: "Failed to reorder images." };
    }

    // Phase 2: assign new positive priorities in order
    const phase2Results = await Promise.all(
      orderedPriorities.map((_, i) =>
        admin
          .from("event_images")
          .update({ priority_order: i + 1 })
          .eq("event_id", eventId)
          .eq("priority_order", -(i + 1)),
      ),
    );

    const phase2Error = phase2Results.find((r) => r.error)?.error;
    if (phase2Error) {
      logger.error({
        fn: "reorderEventImages",
        message: "DB update error (phase 2)",
        meta: phase2Error.message,
      });
      return { success: false, message: "Failed to reorder images." };
    }

    revalidatePath("/dashboard/organizer-events");
    return { success: true, message: "Images reordered." };
  } catch (err) {
    logger.error({
      fn: "reorderEventImages",
      message: "Unexpected error",
      meta: err,
    });
    return { success: false, message: "An unexpected error occurred." };
  }
}
