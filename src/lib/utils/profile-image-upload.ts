import { uploadFileToStorage, type StorageUploadResult } from "./storage-upload";

const PROFILE_PATH = "profiles";

export type ProfileImageUploadResult = StorageUploadResult;

export async function uploadProfileImageToStorage(
  file: File,
  userId: string,
): Promise<ProfileImageUploadResult> {
  return uploadFileToStorage(file, `${PROFILE_PATH}/${userId}`, "profile image");
}
