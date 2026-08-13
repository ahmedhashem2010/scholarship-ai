import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { unauthorized, forbidden } from "@/lib/api-utils";
import { deleteFile } from "@/lib/supabase/storage";
import { documentFileUrl } from "@/lib/document-access";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (document.userId !== user.id) {
      return forbidden();
    }

    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        userId: document.userId,
        fileName: document.fileName,
        fileUrl: documentFileUrl(document),
        fileType: document.fileType,
        fileSize: document.fileSize,
        documentType: document.documentType,
        version: document.version ?? 1,
        parentDocumentId: document.parentDocumentId,
        improvementScore: document.improvementScore ?? null,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch document";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (document.userId !== user.id) {
      return forbidden();
    }

    await deleteFile(document.fileUrl);

    await prisma.review.deleteMany({ where: { documentId: id } });
    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Document deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete document";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
