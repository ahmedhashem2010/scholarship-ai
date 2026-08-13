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

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type DocumentOwnershipResult<T extends Prisma.DocumentInclude | undefined = undefined> =
  | {
      status: "ok";
      document: T extends Prisma.DocumentInclude
        ? Prisma.DocumentGetPayload<{ include: T }>
        : Prisma.DocumentGetPayload<{}>;
    }
  | { status: "missing" }
  | { status: "forbidden" };

/**
 * Load a document and check it belongs to `userId` in one step.
 *
 * Every route that touches a single document used to repeat the same three
 * lines: findUnique → 404 if absent → 403 if not yours. Centralizing keeps the
 * 404-not-found / 403-not-yours contract identical everywhere — in particular
 * the two statuses are never collapsed, so a caller can't probe which document
 * ids exist. `include` is passed straight through to the query so callers that
 * need relations (e.g. the review route's `parentDocument`) stay one query.
 */
export async function findDocumentWithOwnership<T extends Prisma.DocumentInclude | undefined = undefined>(
  id: string,
  userId: string,
  include?: T
): Promise<DocumentOwnershipResult<T>> {
  const document = include
    ? await prisma.document.findUnique({ where: { id }, include })
    : await prisma.document.findUnique({ where: { id } });
  if (!document) return { status: "missing" };
  if (document.userId !== userId) return { status: "forbidden" };
  return { status: "ok", document } as DocumentOwnershipResult<T>;
}
