/**
 * The client-facing URL for a document's bytes.
 *
 * Documents live in a private bucket and must NEVER be addressed by their raw
 * Supabase storage URL — a public URL would bypass the ownership check in the
 * file route. The only way to read a file is the authenticated route below,
 * which verifies `document.userId === session user` on every request. Every
 * API response exposing a document maps its stored path through this helper so
 * no storage URL ever reaches the client.
 */
export function documentFileUrl(document: { id: string; fileUrl: string | null }): string | null {
  return document.fileUrl ? `/api/documents/${document.id}/file` : null;
}
