import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { unauthorized } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

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
