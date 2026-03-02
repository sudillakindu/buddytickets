// lib/utils/profile-image-upload.ts
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
const PROFILE_PATH = "profiles";

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

export async function uploadProfileImageToStorage(
  file: File,
  userId: string,
): Promise<ProfileImageUploadResult> {
  try {
    const bucket = getBucketName();
    const ext = extensionFromFile(file);
    const objectPath = `${PROFILE_PATH}/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const body = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
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

    const { data } = supabaseAdmin.storage
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
