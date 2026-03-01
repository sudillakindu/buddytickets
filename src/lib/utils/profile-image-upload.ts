// lib/utils/profile-image-upload.ts
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
const DOCUMENTS_PATH = "profiles";

export interface ProfileImageUploadResult {
  success: boolean;
  message: string;
  imageUrl?: string;
  objectPath?: string;
}

function getBucketName(): string {
  const bucket = BUCKET_NAME;
  if (!bucket)
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET environment variable.",
    );
  return bucket;
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
    if (!(file instanceof File)) {
      return { success: false, message: "Invalid image file." };
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return {
        success: false,
        message: "Only JPG, PNG, or WEBP images are allowed.",
      };
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      return { success: false, message: "Image must be smaller than 1MB." };
    }

    const bucket = getBucketName();
    const ext = extensionFromFile(file);
    const objectPath = `${DOCUMENTS_PATH}/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

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
  } catch (error) {
    console.error("[uploadProfileImageToStorage] error:", error);
    return {
      success: false,
      message: "Image upload failed due to an unexpected error.",
    };
  }
}
