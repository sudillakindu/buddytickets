// lib/actions/organizer.ts
"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSession } from "@/lib/utils/session";
import { uploadOrganizerNicImages } from "@/lib/utils/organizer-doc-upload";
import type {
  OrganizerDetails,
  OrganizerDetailsInput,
  OrganizerStateResult,
  SubmitOrganizerDetailsResult,
  UserRole,
} from "@/lib/types/organizer";
import { logger } from "@/lib/logger";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// ─── Internal Types & Helpers ────────────────────────────────────────────────

interface UserRow {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  is_active: boolean;
}

interface OrganizerDetailsRow {
  user_id: string;
  nic_number: string;
  address: string;
  bank_name: string;
  bank_branch: string;
  account_holder_name: string;
  account_number: string;
  nic_front_image_url: string;
  nic_back_image_url: string;
  remarks: string | null;
  status: OrganizerDetails["status"];
  is_submitted: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string | null;
}

function getWhatsappNumber(): string {
  return process.env.WHATSAPP_NUMBER ?? "";
}

function isValidSriLankanNic(value: string): boolean {
  const nic = value.trim().toUpperCase();
  return /^\d{9}[VX]$/.test(nic) || /^\d{12}$/.test(nic);
}

function validateDetailsPayload(
  payload: OrganizerDetailsInput,
): SubmitOrganizerDetailsResult | null {
  const fieldErrors: Record<string, string> = {};

  if (!isValidSriLankanNic(payload.nic_number)) {
    fieldErrors.nic_number =
      "Enter a valid Sri Lankan NIC (old or new format).";
  }
  if (payload.address.length < 8) {
    fieldErrors.address = "Address must be at least 8 characters.";
  }
  if (!payload.bank_name) {
    fieldErrors.bank_name = "Bank name is required.";
  }
  if (!payload.bank_branch) {
    fieldErrors.bank_branch = "Bank branch is required.";
  }
  if (!payload.account_holder_name) {
    fieldErrors.account_holder_name = "Account holder name is required.";
  }
  if (!payload.account_number) {
    fieldErrors.account_number = "Account number is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      fieldErrors,
    };
  }

  return null;
}

function validateImageFile(
  file: File | null,
  fieldName: "nic_front_image" | "nic_back_image",
): SubmitOrganizerDetailsResult | null {
  if (!(file instanceof File)) {
    return {
      success: false,
      message: "Both NIC images are required.",
      fieldErrors: { [fieldName]: "This image is required." },
    };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      success: false,
      message: "Only JPG, PNG, or WEBP images are allowed.",
      fieldErrors: {
        [fieldName]: "Only JPG, PNG, or WEBP images are allowed.",
      },
    };
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    return {
      success: false,
      message: "Each image must be smaller than 2MB.",
      fieldErrors: { [fieldName]: "Image must be smaller than 2MB." },
    };
  }
  return null;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getOrganizerOnboardingState(): Promise<OrganizerStateResult> {
  try {
    const session = await getSession();

    if (!session?.sub) {
      return {
        success: true,
        message: "Guest onboarding state loaded.",
        user: null,
        organizerDetails: null,
        whatsappNumber: getWhatsappNumber(),
      };
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("user_id, name, email, mobile, role, is_active")
      .eq("user_id", session.sub)
      .maybeSingle<UserRow>();

    if (userError || !user) {
      if (userError)
        logger.error({
          fn: "getOrganizerOnboardingState",
          message: "User fetch error",
          meta: userError.message,
        });
      return {
        success: false,
        message: "Failed to load user account details.",
        user: null,
        organizerDetails: null,
        whatsappNumber: getWhatsappNumber(),
      };
    }

    const { data: organizerDetails, error: organizerError } =
      await supabaseAdmin
        .from("organizer_details")
        .select(
          "user_id, nic_number, address, bank_name, bank_branch, account_holder_name, account_number, nic_front_image_url, nic_back_image_url, remarks, status, is_submitted, verified_at, created_at, updated_at",
        )
        .eq("user_id", user.user_id)
        .maybeSingle<OrganizerDetailsRow>();

    if (organizerError && organizerError.code !== "PGRST116") {
      logger.error({
        fn: "getOrganizerOnboardingState",
        message: "Organizer details fetch error",
        meta: organizerError.message,
      });
      return {
        success: false,
        message: "Failed to load organizer details.",
        user,
        organizerDetails: null,
        whatsappNumber: getWhatsappNumber(),
      };
    }

    return {
      success: true,
      message: "Organizer onboarding state loaded.",
      user,
      organizerDetails: organizerDetails ?? null,
      whatsappNumber: getWhatsappNumber(),
    };
  } catch (err) {
    logger.error({
      fn: "getOrganizerOnboardingState",
      message: "Unexpected error while loading organizer onboarding state",
      meta: err,
    });
    return {
      success: false,
      message:
        "An unexpected error occurred while loading organizer onboarding state.",
      user: null,
      organizerDetails: null,
      whatsappNumber: getWhatsappNumber(),
    };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function submitOrganizerDetails(
  formData: FormData,
): Promise<SubmitOrganizerDetailsResult> {
  try {
    const session = await getSession();
    if (!session?.sub) {
      return { success: false, message: "Unauthorized. Please sign in first." };
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("user_id, role")
      .eq("user_id", session.sub)
      .maybeSingle<{ user_id: string; role: UserRole }>();

    if (userError || !user) {
      if (userError)
        logger.error({
          fn: "submitOrganizerDetails",
          message: "User fetch error",
          meta: userError.message,
        });
      return { success: false, message: "Failed to validate account." };
    }

    if (user.role !== "ORGANIZER") {
      return {
        success: false,
        message: "Your account is not yet upgraded to organizer role.",
      };
    }

    const payload: OrganizerDetailsInput = {
      nic_number: String(formData.get("nic_number") ?? "")
        .trim()
        .toUpperCase(),
      address: String(formData.get("address") ?? "").trim(),
      bank_name: String(formData.get("bank_name") ?? "").trim(),
      bank_branch: String(formData.get("bank_branch") ?? "").trim(),
      account_holder_name: String(
        formData.get("account_holder_name") ?? "",
      ).trim(),
      account_number: String(formData.get("account_number") ?? "").trim(),
    };

    const detailsError = validateDetailsPayload(payload);
    if (detailsError) return detailsError;

    const frontFile = formData.get("nic_front_image");
    const backFile = formData.get("nic_back_image");
    const nicFrontImage = frontFile instanceof File ? frontFile : null;
    const nicBackImage = backFile instanceof File ? backFile : null;

    const frontImageError = validateImageFile(nicFrontImage, "nic_front_image");
    if (frontImageError) return frontImageError;

    const backImageError = validateImageFile(nicBackImage, "nic_back_image");
    if (backImageError) return backImageError;

    // Concurrency check before uploading files
    const [{ data: nicConflict }, { data: accountConflict }] =
      await Promise.all([
        supabaseAdmin
          .from("organizer_details")
          .select("user_id")
          .eq("nic_number", payload.nic_number)
          .neq("user_id", user.user_id)
          .maybeSingle(),
        supabaseAdmin
          .from("organizer_details")
          .select("user_id")
          .eq("account_number", payload.account_number)
          .neq("user_id", user.user_id)
          .maybeSingle(),
      ]);

    if (nicConflict) {
      return {
        success: false,
        message: "This NIC number is already registered by another account.",
        fieldErrors: { nic_number: "NIC number already in use." },
      };
    }

    if (accountConflict) {
      return {
        success: false,
        message:
          "This bank account number is already registered by another account.",
        fieldErrors: { account_number: "Account number already in use." },
      };
    }

    const uploadResult = await uploadOrganizerNicImages(
      nicFrontImage!,
      nicBackImage!,
      user.user_id,
    );

    if (
      !uploadResult.success ||
      !uploadResult.frontUrl ||
      !uploadResult.backUrl
    ) {
      return { success: false, message: uploadResult.message };
    }

    const { error: upsertError } = await supabaseAdmin
      .from("organizer_details")
      .upsert(
        {
          user_id: user.user_id,
          nic_number: payload.nic_number,
          address: payload.address,
          bank_name: payload.bank_name,
          bank_branch: payload.bank_branch,
          account_holder_name: payload.account_holder_name,
          account_number: payload.account_number,
          nic_front_image_url: uploadResult.frontUrl,
          nic_back_image_url: uploadResult.backUrl,
          status: "PENDING",
          remarks: null,
          verified_by: null,
          verified_at: null,
          is_submitted: true,
        },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      logger.error({
        fn: "submitOrganizerDetails",
        message: "Supabase upsert error",
        meta: upsertError.message,
      });

      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!;
      const toRemove = [uploadResult.frontPath, uploadResult.backPath].filter(
        Boolean,
      ) as string[];

      if (toRemove.length > 0) {
        await supabaseAdmin.storage.from(bucket).remove(toRemove);
      }

      if (upsertError.code === "23505") {
        return {
          success: false,
          message:
            "The provided NIC or bank account details are already in use.",
        };
      }

      return { success: false, message: "Failed to submit organizer details." };
    }

    return {
      success: true,
      message:
        "Organizer details submitted successfully. Your account is now pending review.",
    };
  } catch (err) {
    logger.error({
      fn: "submitOrganizerDetails",
      message: "Unexpected error while submitting organizer details",
      meta: err,
    });
    return {
      success: false,
      message:
        "An unexpected error occurred while submitting organizer details.",
    };
  }
}
