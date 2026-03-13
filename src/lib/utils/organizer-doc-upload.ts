import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import {
  uploadFileToStorage,
  extensionFromMime,
  getBucketName,
} from "@/lib/utils/storage-upload";

const DOCUMENTS_PATH = "organizer-documents";

export interface OrganizerDocUploadResult {
  success: boolean;
  message: string;
  frontUrl?: string;
  backUrl?: string;
  frontPath?: string;
  backPath?: string;
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
  const ext = extensionFromMime(file);
  if (!ext)
    return {
      success: false,
      message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    };
  const objectPath = `${DOCUMENTS_PATH}/${userId}/${Date.now()}-${side}-${crypto.randomUUID()}.${ext}`;
  const result = await uploadFileToStorage(
    file,
    objectPath,
    "uploadSingleImage",
  );

  if (!result.success) {
    return {
      success: false,
      message: `Failed to upload NIC ${side} image.`,
    };
  }

  return result;
}

// Uploads both NIC images in parallel and rolls back entirely on partial failure
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
