import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile, ensureUserRecord } from "@/lib/supabase/storage";
import { createApiClient } from "@/lib/supabase/api-auth";
import { createNewVersion } from "@/lib/document-versions";
import { documentFileUrl } from "@/lib/document-access";

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20")));
    const skip = (page - 1) * pageSize;

    const [total, documents] = await Promise.all([
      prisma.document.count({ where: { userId: user.id } }),
      prisma.document.findMany({
        where: { userId: user.id },
        orderBy: { uploadedAt: "desc" },
        skip,
        take: pageSize,
        include: {
          reviews: { orderBy: { createdAt: "desc" }, take: 1, select: { score: true } },
          _count: { select: { childVersions: true } },
        },
      }),
    ]);

    // Never expose the raw storage path/URL — map it to the authenticated,
    // ownership-checked file route so the private bucket stays private.
    const data = documents.map((doc) => ({ ...doc, fileUrl: documentFileUrl(doc) }));

    return NextResponse.json({
      success: true,
      data,
      metadata: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch documents";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = (formData.get("documentType") as string) ?? "OTHER";
    const parentDocumentId = formData.get("parentDocumentId") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File exceeds 10MB limit" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Only PDF, DOCX, and TXT files are allowed" }, { status: 400 });
    }

    await ensureUserRecord(user.id, user.email ?? undefined);

    // If this is a new version of an existing document, use the versioning system
    if (parentDocumentId) {
      const fileUrl = await uploadFile(user.id, file);
      const document = await createNewVersion(parentDocumentId, fileUrl, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      return NextResponse.json({ success: true, data: document }, { status: 201 });
    }

    // Otherwise, create a fresh document
    const fileUrl = await uploadFile(user.id, file);

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        documentType,
        version: 1,
      },
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
