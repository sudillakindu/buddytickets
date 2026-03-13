import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
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
  if (!BUCKET_NAME)
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET environment variable.",
    );
  return BUCKET_NAME;
}

export function extensionFromMime(file: File): string | null {
  return ALLOWED_MIME_TYPES[file.type] ?? null;
}

export async function uploadFileToStorage(
  file: File,
  objectPath: string,
  context: string,
): Promise<StorageUploadResult> {
  try {
    const ext = extensionFromMime(file);
    if (!ext)
      return {
        success: false,
        message:
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
      };
    if (file.size > MAX_FILE_SIZE)
      return { success: false, message: "File size exceeds 5 MB limit." };

    const bucket = getBucketName();
    const body = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await getSupabaseAdmin()
      .storage.from(bucket)
      .upload(objectPath, body, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logger.error({
        fn: context,
        message: "Supabase storage upload error",
        meta: uploadError.message,
      });
      return {
        success: false,
        message: "Failed to upload image. Please try again.",
      };
    }

    const { data } = getSupabaseAdmin()
      .storage.from(bucket)
      .getPublicUrl(objectPath);

    return {
      success: true,
      message: "Image uploaded successfully.",
      imageUrl: data.publicUrl,
      objectPath,
    };
  } catch (err) {
    logger.error({
      fn: context,
      message: "Unexpected error during image upload",
      meta: err,
    });
    return {
      success: false,
      message: "Image upload failed due to an unexpected error.",
    };
  }
}
