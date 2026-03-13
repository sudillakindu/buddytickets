import {
  extensionFromMime,
  uploadFileToStorage,
} from "@/lib/utils/storage-upload";
import type { StorageUploadResult } from "@/lib/utils/storage-upload";

export type ProfileImageUploadResult = StorageUploadResult;

const PROFILE_PATH = "profiles";

export async function uploadProfileImageToStorage(
  file: File,
  userId: string,
): Promise<ProfileImageUploadResult> {
  const ext = extensionFromMime(file);
  if (!ext)
    return {
      success: false,
      message:
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    };

  const objectPath = `${PROFILE_PATH}/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  return uploadFileToStorage(file, objectPath, "uploadProfileImageToStorage");
}
