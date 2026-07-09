import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { reviewDocument, calculateAverageScore } from "@/lib/ai-review";
import type { ReviewScore } from "@/lib/ai-review";
import { extractTextFromFile } from "@/lib/text-extract";
import { getVersionChain } from "@/lib/document-versions";

export const runtime = "nodejs";

function safeJsonParse(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return null; }
}

function safeArray(raw: string): string[] {
  const parsed = safeJsonParse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: { parentDocument: true },
    });
    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (document.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.reviewCredits < 1) {
      return NextResponse.json({ success: false, error: "No credits", needsCredits: true }, { status: 402 });
    }

    const existingReview = await prisma.review.findFirst({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });
    if (existingReview) {
      const rawScores = safeJsonParse(existingReview.strengths);
      const isOldFormat = Array.isArray(rawScores) && rawScores.length > 0 && typeof rawScores[0] === "string";
      const scores = isOldFormat ? null : (rawScores as ReviewScore | null);
      return NextResponse.json({
        success: true,
        data: {
          id: existingReview.id,
          documentId: existingReview.documentId,
          userId: existingReview.userId,
          score: scores ? calculateAverageScore(scores) : existingReview.score,
          overallQuality: scores?.overallQuality ?? { score: existingReview.score, strengthsSummary: "", weaknessesSummary: "" },
          atsCompatibility: scores?.atsCompatibility ?? { score: existingReview.score, missingKeywords: [], improvements: [] },
          competitiveness: scores?.competitiveness ?? { score: existingReview.score, uniqueStrengths: "", differentiation: "" },
          topImprovements: safeArray(existingReview.suggestions),
          quickWins: safeArray(existingReview.grammarIssues),
          overallAssessment: existingReview.overallFeedback,
          modelUsed: existingReview.modelUsed,
          createdAt: existingReview.createdAt,
        },
      });
    }

    if (!document.fileUrl) {
      return NextResponse.json({ success: false, error: "Document file URL is missing" }, { status: 400 });
    }

    // Get parent's score for comparison
    let prevScore: number | null = null;
    if (document.parentDocumentId && document.parentDocument) {
      const prevReview = await prisma.review.findFirst({
        where: { documentId: document.parentDocumentId },
        orderBy: { createdAt: "desc" },
      });
      if (prevReview) prevScore = prevReview.score;
    }

    let text: string;
    try {
      text = await extractTextFromFile(document.fileUrl, document.fileType);
    } catch (extractErr) {
      const extractMsg = extractErr instanceof Error ? extractErr.message : "";
      if (extractMsg.toLowerCase().includes("cannot read") || extractMsg.toLowerCase().includes("image")) {
        return NextResponse.json({
          success: false,
          error: "This document appears to be an image-based or scanned file (no selectable text). Please upload a text-based PDF or DOCX file.",
        }, { status: 400 });
      }
      throw extractErr;
    }

    if (!text || text.length < 50) {
      return NextResponse.json({
        success: false,
        error: "The document contains very little extractable text. It may be a scanned image. Please upload a text-based PDF or DOCX.",
      }, { status: 400 });
    }

    const coaching = await reviewDocument(text, document.documentType);
    if (!coaching || typeof coaching.overallQuality?.score !== "number") {
      return NextResponse.json({ success: false, error: "AI review returned an invalid response" }, { status: 502 });
    }

    const mainScore = coaching.overallQuality.score;
    const improvementScore = prevScore !== null ? mainScore - prevScore : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { reviewCredits: { decrement: 1 } },
    });

    const scoresData = {
      overallQuality: coaching.overallQuality,
      atsCompatibility: coaching.atsCompatibility,
      competitiveness: coaching.competitiveness,
    };

    const review = await prisma.review.create({
      data: {
        documentId: document.id,
        userId: user.id,
        score: mainScore,
        strengths: JSON.stringify(scoresData),
        weaknesses: JSON.stringify([]),
        suggestions: JSON.stringify(coaching.topImprovements ?? []),
        grammarIssues: JSON.stringify(coaching.quickWins ?? []),
        overallFeedback: coaching.overallAssessment ?? "Review completed.",
      },
    });

    if (improvementScore !== null) {
      await prisma.document.update({
        where: { id },
        data: { improvementScore },
      });
    }

    const responseData = {
      id: review.id,
      documentId: review.documentId,
      userId: review.userId,
      score: calculateAverageScore(coaching),
      overallQuality: coaching.overallQuality,
      atsCompatibility: coaching.atsCompatibility,
      competitiveness: coaching.competitiveness,
      topImprovements: safeArray(review.suggestions),
      quickWins: safeArray(review.grammarIssues),
      overallAssessment: review.overallFeedback,
      modelUsed: review.modelUsed,
      createdAt: review.createdAt,
    };

    return NextResponse.json({ success: true, data: responseData }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed";
    console.error("Review POST error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        parentDocument: {
          include: { reviews: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
    });
    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (document.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const review = await prisma.review.findFirst({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });

    const prevReview = document.parentDocument?.reviews?.[0] ?? null;

    const versionChain = await getVersionChain(id);

    const rawScores = review ? safeJsonParse(review.strengths) : null;
    const isOldFormat = Array.isArray(rawScores) && rawScores.length > 0 && typeof rawScores[0] === "string";
    const scores = isOldFormat ? null : (rawScores as ReviewScore | null);

    return NextResponse.json({
      success: true,
      data: review ? {
        id: review.id,
        documentId: review.documentId,
        userId: review.userId,
        score: scores ? calculateAverageScore(scores) : review.score,
        overallQuality: scores?.overallQuality ?? { score: review.score, strengthsSummary: "", weaknessesSummary: "" },
        atsCompatibility: scores?.atsCompatibility ?? { score: review.score, missingKeywords: [], improvements: [] },
        competitiveness: scores?.competitiveness ?? { score: review.score, uniqueStrengths: "", differentiation: "" },
        topImprovements: safeArray(review.suggestions),
        quickWins: safeArray(review.grammarIssues),
        overallAssessment: review.overallFeedback,
        modelUsed: review.modelUsed,
        createdAt: review.createdAt,
      } : null,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileType: document.fileType,
        documentType: document.documentType,
        version: document.version ?? 1,
      },
      version: document.version ?? 1,
      improvementScore: document.improvementScore ?? null,
      prevScore: prevReview?.score ?? null,
      versionChain: versionChain ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch review";
    console.error("Review GET error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
