export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { unauthorized, forbidden } from "@/lib/api-utils";
import { calculateProgress } from "@/lib/application-progress";
import { updateApplicationSchema } from "@/lib/validations/application";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const existing = await prisma.application.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return forbidden();
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = updateApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid application status" }, { status: 400 });
    }
    const data: Record<string, unknown> = {};

    // Always recalculate progress from documents
    const allDocs = await prisma.applicationDocument.findMany({
      where: { applicationId: params.id },
    });
    data.progress = calculateProgress(allDocs);

    if (parsed.data.status) data.status = parsed.data.status;
    if (parsed.data.status === "SUBMITTED") data.submittedAt = new Date();

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
