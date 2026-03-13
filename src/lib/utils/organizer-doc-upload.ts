import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getBucketName,
  uploadFileToStorage,
} from "./storage-upload";
import { logger } from "@/lib/logger";

const DOCUMENTS_PATH = "organizer-documents";

export interface OrganizerDocUploadResult {
  success: boolean;
  message: string;
  frontUrl?: string;
  backUrl?: string;
  frontPath?: string;
  backPath?: string;
}

// Uploads both NIC images in parallel and rolls back entirely on partial failure
export async function uploadOrganizerNicImages(
  frontFile: File,
  backFile: File,
  userId: string,
): Promise<OrganizerDocUploadResult> {
  const [front, back] = await Promise.all([
    uploadFileToStorage(
      frontFile,
      `${DOCUMENTS_PATH}/${userId}`,
      "NIC front image",
    ),
    uploadFileToStorage(
      backFile,
      `${DOCUMENTS_PATH}/${userId}`,
      "NIC back image",
    ),
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
