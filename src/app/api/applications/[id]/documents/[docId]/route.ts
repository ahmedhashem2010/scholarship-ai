export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { autoUpdateDocStatus, calculateProgress } from "@/lib/application-progress";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const appDoc = await prisma.applicationDocument.findUnique({
      where: { id: params.docId },
      include: { application: true },
    });
    if (!appDoc || appDoc.application.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { status, aiScore, uploadedDocumentId, feedback, markFinal } = await request.json();
    const data: Record<string, unknown> = {};

    // Auto-calculate status from AI score if provided
    if (typeof aiScore === "number") {
      data.aiScore = aiScore;
      if (markFinal) {
        data.status = "READY";
      } else {
        data.status = autoUpdateDocStatus(appDoc.status, aiScore);
      }
    }

    if (status) data.status = status;
    if (uploadedDocumentId) data.uploadedDocumentId = uploadedDocumentId;
    if (feedback) data.feedback = feedback;

    const updated = await prisma.applicationDocument.update({
      where: { id: params.docId },
      data,
    });

    // Recalculate application progress based on all documents
    const allDocs = await prisma.applicationDocument.findMany({
      where: { applicationId: params.id },
    });
    const newProgress = calculateProgress(allDocs);

    await prisma.application.update({
      where: { id: params.id },
      data: { progress: newProgress },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update document";
    console.error("AppDoc PATCH error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
