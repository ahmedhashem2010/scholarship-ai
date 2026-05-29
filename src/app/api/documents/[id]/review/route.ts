export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { reviewDocument } from "@/lib/ai-review";
import { extractTextFromFile } from "@/lib/text-extract";
import { getVersionChain } from "@/lib/document-versions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
      return NextResponse.json({
        success: true,
        data: {
          id: existingReview.id,
          documentId: existingReview.documentId,
          userId: existingReview.userId,
          score: existingReview.score,
          strengths: JSON.parse(existingReview.strengths),
          weaknesses: JSON.parse(existingReview.weaknesses),
          suggestions: JSON.parse(existingReview.suggestions),
          grammarIssues: JSON.parse(existingReview.grammarIssues),
          overallFeedback: existingReview.overallFeedback,
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
    if (!coaching || typeof coaching.score !== "number") {
      return NextResponse.json({ success: false, error: "AI review returned an invalid response" }, { status: 502 });
    }

    const improvementScore = prevScore !== null ? coaching.score - prevScore : null;

    await prisma.user.update({
      where: { id: user.id },
      data: { reviewCredits: { decrement: 1 } },
    });

    const review = await prisma.review.create({
      data: {
        documentId: document.id,
        userId: user.id,
        score: coaching.score,
        strengths: JSON.stringify(coaching.strongPoints ?? []),
        weaknesses: JSON.stringify(coaching.weakSentences ?? []),
        suggestions: JSON.stringify(coaching.improvements ?? []),
        grammarIssues: JSON.stringify(coaching.quickWins ?? []),
        overallFeedback: coaching.assessment ?? "Review completed.",
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
      score: review.score,
      reasoning: coaching.reasoning ?? "",
      strongPoints: JSON.parse(review.strengths),
      weakSentences: JSON.parse(review.weaknesses),
      improvements: JSON.parse(review.suggestions),
      quickWins: JSON.parse(review.grammarIssues),
      assessment: review.overallFeedback,
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    const rawWeaknesses = review ? JSON.parse(review.weaknesses) : []
    const weakSentences = Array.isArray(rawWeaknesses) && rawWeaknesses.length > 0 && typeof rawWeaknesses[0] === "object"
      ? rawWeaknesses
      : (rawWeaknesses as string[]).map((w: string) => ({ quote: w, issue: "Consider revising this section" }))

    return NextResponse.json({
      success: true,
      data: review ? {
        id: review.id,
        documentId: review.documentId,
        userId: review.userId,
        score: review.score,
        reasoning: "",
        strongPoints: JSON.parse(review.strengths),
        weakSentences,
        improvements: JSON.parse(review.suggestions),
        quickWins: JSON.parse(review.grammarIssues),
        assessment: review.overallFeedback,
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
