export const MAX_IMAGE_SIZE = 1 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAllowedImageType(type: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(type);
}

export function isWithinImageSizeLimit(size: number): boolean {
  return size > 0 && size <= MAX_IMAGE_SIZE;
}
