export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { unauthorized, forbidden } from "@/lib/api-utils";
import { documentFileUrl } from "@/lib/document-access";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        scholarship: true,
        documents: {
          include: {
            uploadedDocument: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }
    if (application.userId !== user.id) {
      return forbidden();
    }

    // Never expose the uploaded document's raw storage URL — map it to the
    // authenticated, ownership-checked file route (same rule as /api/documents).
    const data = {
      ...application,
      documents: application.documents.map((d) => ({
        ...d,
        uploadedDocument: d.uploadedDocument
          ? { ...d.uploadedDocument, fileUrl: documentFileUrl(d.uploadedDocument) }
          : null,
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch application";
    console.error("Application GET error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
