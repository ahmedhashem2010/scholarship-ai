export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { unauthorized, forbidden } from "@/lib/api-utils";
import { autoUpdateDocStatus, calculateProgress } from "@/lib/application-progress";
import { updateApplicationDocumentSchema } from "@/lib/validations/application";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const appDoc = await prisma.applicationDocument.findUnique({
      where: { id: params.docId },
      include: { application: true },
    });
    if (!appDoc || appDoc.application.userId !== user.id) {
      return forbidden();
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = updateApplicationDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid document update" }, { status: 400 });
    }
    const { status, aiScore, uploadedDocumentId, feedback, markFinal } = parsed.data;
    const data: Record<string, unknown> = {};

    // Auto-calculate status from AI score if provided
    if (aiScore !== null && aiScore !== undefined) {
      data.aiScore = aiScore;
      if (markFinal) {
        data.status = "READY";
      } else {
        data.status = autoUpdateDocStatus(appDoc.status, aiScore);
      }
    }

    if (status) data.status = status;
    if (uploadedDocumentId) {
      // A user may only link their own document to their application. Without
      // this check an attacker could attach a victim's document row to their
      // own application (data integrity) or, conversely, force their own file
      // to appear inside a victim's application.
      const doc = await prisma.document.findUnique({ where: { id: uploadedDocumentId } });
      if (!doc) {
        return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
      }
      if (doc.userId !== user.id) {
        return forbidden();
      }
      data.uploadedDocumentId = uploadedDocumentId;
    }
    if (feedback) data.feedback = feedback;

    const updated = await prisma.applicationDocument.update({
      where: { id: params.docId },
      data,
    });

    // Recalculate application progress based on all documents. Always target
    // the application the document actually belongs to (appDoc.applicationId),
    // never the id from the URL — a caller-supplied params.id could point at a
    // different user's application and mutate its progress cross-account.
    const allDocs = await prisma.applicationDocument.findMany({
      where: { applicationId: appDoc.applicationId },
    });
    const newProgress = calculateProgress(allDocs);

    await prisma.application.update({
      where: { id: appDoc.applicationId },
      data: { progress: newProgress },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update document";
    console.error("AppDoc PATCH error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
