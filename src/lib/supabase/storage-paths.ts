/**
 * Storage path resolution for the private documents bucket.
 *
 * Legacy rows stored full public URLs (`…/storage/v1/object/public/documents/…`)
 * from the pre-hardening upload path. New uploads store the raw object path
 * (e.g. `userId/1723456789012_resume.pdf`). Both formats resolve to the same
 * object path so the service-role download/delete helpers and the
 * /api/documents/[id]/file route work for every row.
 */
export const DOCUMENTS_BUCKET = "documents";

export function resolveStoragePath(value: string | null): string | null {
  if (!value) return null;

  // Legacy full URL → take everything after the bucket marker.
  const marker = `/${DOCUMENTS_BUCKET}/`;
  const idx = value.lastIndexOf(marker);
  if (idx !== -1) {
    const path = value.slice(idx + marker.length);
    return path || null;
  }

  // New format is the raw object path already.
  return value;
}
