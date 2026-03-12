// lib/utils/file-validation.ts
// Shared file upload validation constants and helpers.

export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isValidImageFile(file: unknown): file is File {
  return file instanceof File;
}

export function isAllowedImageType(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.has(file.type);
}

export function isWithinSizeLimit(
  file: File,
  maxSize: number = MAX_IMAGE_SIZE,
): boolean {
  return file.size > 0 && file.size <= maxSize;
}
