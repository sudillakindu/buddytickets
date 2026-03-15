import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
const DOCUMENTS_PATH = "organizer-documents";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface OrganizerDocUploadResult {
  success: boolean;
  message: string;
  frontUrl?: string;
  backUrl?: string;
  frontPath?: string;
  backPath?: string;
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

async function uploadSingleImage(
  file: File,
  userId: string,
  side: "front" | "back",
): Promise<{
  success: boolean;
  message: string;
  imageUrl?: string;
  objectPath?: string;
}> {
  try {
    const ext = extensionFromMime(file);
    if (!ext)
      return {
        success: false,
        message: `Invalid file type for NIC ${side} image. Only JPEG, PNG, and WebP are allowed.`,
      };
    if (file.size > MAX_FILE_SIZE)
      return {
        success: false,
        message: `NIC ${side} image exceeds 5 MB limit.`,
      };

    const bucket = getBucketName();
    const objectPath = `${DOCUMENTS_PATH}/${userId}/${Date.now()}-${side}-${crypto.randomUUID()}.${ext}`;
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
        fn: "uploadSingleImage",
        message: "Supabase storage upload error",
        meta: { side, error: uploadError.message },
      });
      return { success: false, message: `Failed to upload NIC ${side} image.` };
    }

    const { data } = getSupabaseAdmin()
      .storage.from(bucket)
      .getPublicUrl(objectPath);
    return {
      success: true,
      message: "Uploaded.",
      imageUrl: data.publicUrl,
      objectPath,
    };
  } catch (err) {
    logger.error({
      fn: "uploadSingleImage",
      message: "Unexpected error during single image upload",
      meta: { side, error: err },
    });
    return {
      success: false,
      message: `Unexpected error uploading NIC ${side} image.`,
    };
  }
}

export async function uploadOrganizerNicImages(
  frontFile: File,
  backFile: File,
  userId: string,
): Promise<OrganizerDocUploadResult> {
  const [front, back] = await Promise.all([
    uploadSingleImage(frontFile, userId, "front"),
    uploadSingleImage(backFile, userId, "back"),
  ]);

  if (!front.success || !back.success) {
    const bucket = getBucketName();
    const toRemove = [front.objectPath, back.objectPath].filter(
      Boolean,
    ) as string[];

    if (toRemove.length > 0) {
      await getSupabaseAdmin().storage.from(bucket).remove(toRemove);
    }

    logger.error({
      fn: "uploadOrganizerNicImages",
      message: "One or both NIC uploads failed — rolled back",
      meta: { frontSuccess: front.success, backSuccess: back.success },
    });
    return {
      success: false,
      message: !front.success ? front.message : back.message,
    };
  }

  return {
    success: true,
    message: "Both NIC images uploaded.",
    frontUrl: front.imageUrl,
    backUrl: back.imageUrl,
    frontPath: front.objectPath,
    backPath: back.objectPath,
  };
}
