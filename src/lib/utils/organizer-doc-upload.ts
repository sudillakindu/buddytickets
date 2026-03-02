// lib/utils/organizer-doc-upload.ts
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type {
  OrganizerDetailsFieldErrors,
  OrganizerDetailsInput,
  OrganizerValidationResult,
} from "@/lib/types/organizer";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
const DOCUMENTS_PATH = "organizer-documents";

export interface OrganizerDocUploadResult {
  success: boolean;
  message: string;
  imageUrl?: string;
  objectPath?: string;
}

function getBucketName(): string {
  if (!BUCKET_NAME) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET environment variable.",
    );
  }
  return BUCKET_NAME;
}

function extensionFromFile(file: File): string {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  if (byMime[file.type]) return byMime[file.type];

  const fromName = file.name.split(".").pop()?.toLowerCase();
  return fromName && /^[a-z0-9]+$/.test(fromName) ? fromName : "jpg";
}

export function isValidSriLankanNic(value: string): boolean {
  const nic = value.trim().toUpperCase();
  return /^\d{9}[VX]$/.test(nic) || /^\d{12}$/.test(nic);
}

export function validateOrganizerDetailsInput(
  input: OrganizerDetailsInput,
): OrganizerValidationResult {
  const fieldErrors: OrganizerDetailsFieldErrors = {};

  const nic = input.nic_number.trim().toUpperCase();
  const address = input.address.trim();
  const bankName = input.bank_name.trim();
  const bankBranch = input.bank_branch.trim();
  const accountHolder = input.account_holder_name.trim();
  const accountNumber = input.account_number.trim();

  if (!isValidSriLankanNic(nic)) {
    fieldErrors.nic_number =
      "Enter a valid Sri Lankan NIC (old or new format).";
  }

  if (address.length < 8) {
    fieldErrors.address = "Address must be at least 8 characters.";
  }

  if (!bankName) {
    fieldErrors.bank_name = "Bank name is required.";
  }

  if (!bankBranch) {
    fieldErrors.bank_branch = "Bank branch is required.";
  }

  if (!accountHolder) {
    fieldErrors.account_holder_name = "Account holder name is required.";
  }

  if (!accountNumber) {
    fieldErrors.account_number = "Account number is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: "Please correct the highlighted fields and try again.",
      fieldErrors,
    };
  }

  return { success: true, message: "Validation passed." };
}

export function validateOrganizerDocument(
  file: File | null,
  fieldName: "nic_front_image" | "nic_back_image",
): OrganizerValidationResult {
  if (!(file instanceof File)) {
    return {
      success: false,
      message: "Both NIC images are required.",
      fieldErrors: {
        [fieldName]: "This image is required.",
      },
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
      fieldErrors: {
        [fieldName]: "Image must be smaller than 2MB.",
      },
    };
  }

  return { success: true, message: "Document is valid." };
}

export async function uploadOrganizerDocumentToStorage(
  file: File,
  userId: string,
  side: "front" | "back",
): Promise<OrganizerDocUploadResult> {
  try {
    const bucket = getBucketName();
    const ext = extensionFromFile(file);
    const objectPath = `${DOCUMENTS_PATH}/${userId}/${Date.now()}-${side}-${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(objectPath, body, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logger.error({
        fn: "uploadOrganizerDocumentToStorage",
        message: "Upload error",
        meta: uploadError.message,
      });
      return { success: false, message: "Failed to upload document image." };
    }

    const { data } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(objectPath);

    return {
      success: true,
      message: "Document uploaded successfully.",
      imageUrl: data.publicUrl,
      objectPath,
    };
  } catch (error) {
    logger.error({
      fn: "uploadOrganizerDocumentToStorage",
      message: "Unexpected error",
      meta: error,
    });
    return {
      success: false,
      message: "Document upload failed due to an unexpected error.",
    };
  }
}
