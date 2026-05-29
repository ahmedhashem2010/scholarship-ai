export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { calculateProgress } from "@/lib/application-progress";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.application.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { status } = await request.json();
    const data: Record<string, unknown> = {};

    // Always recalculate progress from documents
    const allDocs = await prisma.applicationDocument.findMany({
      where: { applicationId: params.id },
    });
    data.progress = calculateProgress(allDocs);

    if (status) data.status = status;
    if (status === "SUBMITTED") data.submittedAt = new Date();

    const application = await prisma.application.update({
      where: { id: params.id },
      data,
      include: { documents: true, scholarship: true },
    });

    return NextResponse.json({ success: true, data: application });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update application";
    console.error("Application PATCH error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
