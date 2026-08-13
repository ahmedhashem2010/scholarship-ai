import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { unauthorized, forbidden } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";
import { resolveStoragePath } from "@/lib/supabase/storage-paths";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (document.userId !== user.id) {
      return forbidden();
    }

    const filePath = resolveStoragePath(document.fileUrl);
    if (!filePath) {
      return NextResponse.json({ error: "Could not resolve file path" }, { status: 400 });
    }

    const storageClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error: downloadError } = await storageClient.storage
      .from("documents")
      .download(filePath);

    if (downloadError || !data) {
      return NextResponse.json({ error: "Failed to fetch file from storage" }, { status: 502 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    // fileName is whatever the user named their upload. Interpolating it raw
    // into a header lets a filename containing a quote or CRLF break out of
    // the header value, so strip anything that isn't safe and keep the real
    // name in the RFC 5987 form alongside it.
    const asciiName = document.fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    const utf8Name = encodeURIComponent(document.fileName);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": document.fileType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to serve file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
