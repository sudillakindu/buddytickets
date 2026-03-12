// lib/utils/storage.ts
// Shared file upload helpers for Supabase storage.
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface StorageUploadResult {
  success: boolean;
  message: string;
  imageUrl?: string;
  objectPath?: string;
}

export function getBucketName(): string {
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
  if (!bucket)
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET environment variable.",
    );
  return bucket;
}

export function extensionFromMime(file: File): string | null {
  return ALLOWED_MIME_TYPES[file.type] ?? null;
}

export function validateFile(
  file: File,
  label: string,
): { valid: true; ext: string } | { valid: false; message: string } {
  const ext = extensionFromMime(file);
  if (!ext) {
    return {
      valid: false,
      message: `Invalid file type for ${label}. Only JPEG, PNG, and WebP images are allowed.`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, message: `${label} exceeds 5 MB limit.` };
  }
  return { valid: true, ext };
}

export async function uploadToStorage(
  file: File,
  objectPath: string,
  fnName: string,
): Promise<StorageUploadResult> {
  try {
    const bucket = getBucketName();
    const body = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await getSupabaseAdmin().storage
      .from(bucket)
      .upload(objectPath, body, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logger.error({
        fn: fnName,
        message: "Supabase storage upload error",
        meta: uploadError.message,
      });
      return { success: false, message: "Failed to upload image. Please try again." };
    }

    const { data } = getSupabaseAdmin().storage
      .from(bucket)
      .getPublicUrl(objectPath);

    return {
      success: true,
      message: "Image uploaded successfully.",
      imageUrl: data.publicUrl,
      objectPath,
    };
  } catch (err) {
    logger.error({
      fn: fnName,
      message: "Unexpected error during upload",
      meta: err,
    });
    return { success: false, message: "Upload failed due to an unexpected error." };
  }
}
