import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { MIME_TO_EXTENSION } from "@/lib/utils/file-validation";

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;
// Storage upload limit is higher than client-side form validation (1MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function getBucketName(): string {
  if (!BUCKET_NAME)
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET environment variable.",
    );
  return BUCKET_NAME;
}

export function extensionFromMime(file: File): string | null {
  return MIME_TO_EXTENSION[file.type] ?? null;
}

export interface StorageUploadResult {
  success: boolean;
  message: string;
  imageUrl?: string;
  objectPath?: string;
}

export async function uploadFileToStorage(
  file: File,
  folderPath: string,
  label: string,
): Promise<StorageUploadResult> {
  try {
    const ext = extensionFromMime(file);
    if (!ext)
      return {
        success: false,
        message: `Invalid file type for ${label}. Only JPEG, PNG, and WebP are allowed.`,
      };
    if (file.size > MAX_FILE_SIZE)
      return {
        success: false,
        message: `${label} exceeds 5 MB limit.`,
      };

    const bucket = getBucketName();
    const objectPath = `${folderPath}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
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
        fn: "uploadFileToStorage",
        message: "Supabase storage upload error",
        meta: { label, error: uploadError.message },
      });
      return { success: false, message: `Failed to upload ${label}.` };
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
      fn: "uploadFileToStorage",
      message: "Unexpected error during upload",
      meta: { label, error: err },
    });
    return {
      success: false,
      message: `Unexpected error uploading ${label}.`,
    };
  }
}
