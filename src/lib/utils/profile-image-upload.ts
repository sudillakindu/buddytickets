// lib/utils/profile-image-upload.ts
import { validateFile, uploadToStorage } from "./storage";

const PROFILE_PATH = "profiles";

export interface ProfileImageUploadResult {
  success: boolean;
  message: string;
  imageUrl?: string;
  objectPath?: string;
}

export async function uploadProfileImageToStorage(
  file: File,
  userId: string,
): Promise<ProfileImageUploadResult> {
  const validation = validateFile(file, "profile image");
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const objectPath = `${PROFILE_PATH}/${userId}/${Date.now()}-${crypto.randomUUID()}.${validation.ext}`;
  return uploadToStorage(file, objectPath, "uploadProfileImageToStorage");
}
