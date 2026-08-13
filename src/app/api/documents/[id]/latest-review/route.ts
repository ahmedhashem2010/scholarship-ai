import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const review = await prisma.review.findFirst({
      where: { documentId: params.id, userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        score: true,
        overallFeedback: true,
        strengths: true,
        suggestions: true,
        signatureRequired: true,
        signatureStatus: true,
        signatureNote: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: review });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch review";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
