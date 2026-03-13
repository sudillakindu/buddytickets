import {
  uploadFileToStorage,
  extensionFromMime,
} from "@/lib/utils/storage-upload";
import type { StorageUploadResult } from "@/lib/utils/storage-upload";

export type ProfileImageUploadResult = StorageUploadResult;

const PROFILE_PATH = "profiles";

export async function uploadProfileImageToStorage(
  file: File,
  userId: string,
): Promise<ProfileImageUploadResult> {
  const ext = extensionFromMime(file);
  const objectPath = `${PROFILE_PATH}/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext ?? "bin"}`;
  return uploadFileToStorage(file, objectPath, "uploadProfileImageToStorage");
}
