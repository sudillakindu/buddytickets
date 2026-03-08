// lib/utils/profile-image-upload.ts
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
const PROFILE_PATH = "profiles";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface ProfileImageUploadResult {
  success: boolean;
  message: string;
  imageUrl?: string;
  objectPath?: string;
}

function getBucketName(): string {
  if (!BUCKET_NAME)
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET environment variable.",
    );
  return BUCKET_NAME;
}

function extensionFromMime(file: File): string | null {
  return ALLOWED_MIME_TYPES[file.type] ?? null;
}

export async function uploadProfileImageToStorage(
  file: File,
  userId: string,
): Promise<ProfileImageUploadResult> {
  try {
    const ext = extensionFromMime(file);
    if (!ext) {
      return {
        success: false,
        message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: "File size exceeds 5 MB limit.",
      };
    }

    const bucket = getBucketName();
    const objectPath = `${PROFILE_PATH}/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

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
        fn: "uploadProfileImageToStorage",
        message: "Supabase storage upload error",
        meta: uploadError.message,
      });
      return {
        success: false,
        message: "Failed to upload image. Please try again.",
      };
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
      fn: "uploadProfileImageToStorage",
      message: "Unexpected error during profile image upload",
      meta: err,
    });
    return {
      success: false,
      message: "Image upload failed due to an unexpected error.",
    };
  }
}
