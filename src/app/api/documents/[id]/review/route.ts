import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { reviewDocument, calculateAverageScore } from "@/lib/ai-review";
import type { ReviewScore } from "@/lib/ai-review";
import { extractTextFromFile } from "@/lib/text-extract";
import { getVersionChain } from "@/lib/document-versions";

function safeJsonParse(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return null; }
}

function safeArray(raw: string): string[] {
  const parsed = safeJsonParse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function logError(step: string, err: unknown) {
  if (err instanceof Error) {
    console.error(`[${step}] Error:`, err.message);
    console.error(`[${step}] Name:`, err.name);
    console.error(`[${step}] Stack:`, err.stack);
  } else {
    console.error(`[${step}] Unknown error:`, err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let id: string | undefined;
  try {
    id = params.id;
    console.log("[POST] Step 1/12: Params parsed, id =", id);
    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    console.log("[POST] Step 2/12: Creating API client and authenticating user...");
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("[POST] Auth failed:", authError?.message ?? "No user");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.log("[POST] Authenticated as user:", user.id);

    console.log("[POST] Step 3/12: Finding document by id...");
    const document = await prisma.document.findUnique({
      where: { id },
      include: { parentDocument: true },
    });
    if (!document) {
      console.log("[POST] Document not found:", id);
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (document.userId !== user.id) {
      console.log("[POST] Forbidden: user", user.id, "does not own document", id);
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.log("[POST] Document found:", document.id, "type:", document.documentType, "fileUrl:", document.fileUrl?.slice(0, 80) ?? "none");

    console.log("[POST] Step 4/12: Checking user credits...");
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.reviewCredits < 1) {
      console.log("[POST] No credits for user:", user.id, "credits:", dbUser?.reviewCredits);
      return NextResponse.json({ success: false, error: "No credits", needsCredits: true }, { status: 402 });
    }
    console.log("[POST] User credits:", dbUser.reviewCredits);

    console.log("[POST] Step 5/12: Checking for existing review...");
    const existingReview = await prisma.review.findFirst({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });
    if (existingReview) {
      console.log("[POST] Existing review found, returning cached result");
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
      console.log("[POST] Document fileUrl is missing");
      return NextResponse.json({ success: false, error: "Document file URL is missing" }, { status: 400 });
    }

    console.log("[POST] Step 6/12: Getting parent score for comparison...");
    let prevScore: number | null = null;
    if (document.parentDocumentId && document.parentDocument) {
      const prevReview = await prisma.review.findFirst({
        where: { documentId: document.parentDocumentId },
        orderBy: { createdAt: "desc" },
      });
      if (prevReview) prevScore = prevReview.score;
    }

    let text: string;
    console.log("[POST] Step 7/12: Downloading file and extracting text...");
    console.log("[POST] fileUrl:", document.fileUrl);
    console.log("[POST] fileType:", document.fileType);
    try {
      text = await extractTextFromFile(document.fileUrl, document.fileType);
      console.log("[POST] Text extracted, length:", text.length);
    } catch (extractErr) {
      logError("POST extractTextFromFile", extractErr);
      const extractMsg = extractErr instanceof Error ? extractErr.message : "";
      if (extractMsg.toLowerCase().includes("cannot read") || extractMsg.toLowerCase().includes("image")) {
        return NextResponse.json({
          success: false,
          error: "This document appears to be an image-based or scanned file (no selectable text). Please upload a text-based PDF or DOCX file.",
        }, { status: 400 });
      }
      return NextResponse.json({
        success: false,
        error: `Text extraction failed: ${extractMsg}`,
      }, { status: 500 });
    }

    if (!text || text.length < 50) {
      console.log("[POST] Extracted text too short:", text?.length ?? 0);
      return NextResponse.json({
        success: false,
        error: "The document contains very little extractable text. It may be a scanned image. Please upload a text-based PDF or DOCX.",
      }, { status: 400 });
    }

    console.log("[POST] Step 8/12: Calling AI review...");
    let coaching: ReviewScore;
    try {
      coaching = await reviewDocument(text, document.documentType);
      console.log("[POST] AI review complete, overall score:", coaching.overallQuality?.score);
    } catch (aiErr) {
      logError("POST reviewDocument", aiErr);
      return NextResponse.json({
        success: false,
        error: `AI review call failed: ${aiErr instanceof Error ? aiErr.message : String(aiErr)}`,
      }, { status: 502 });
    }

    if (!coaching || typeof coaching.overallQuality?.score !== "number") {
      console.log("[POST] AI returned invalid response structure");
      return NextResponse.json({ success: false, error: "AI review returned an invalid response" }, { status: 502 });
    }

    const mainScore = coaching.overallQuality.score;
    const improvementScore = prevScore !== null ? mainScore - prevScore : null;

    console.log("[POST] Step 9/12: Decrementing user credits...");
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { reviewCredits: { decrement: 1 } },
      });
      console.log("[POST] Credits decremented");
    } catch (creditErr) {
      logError("POST decrement credits", creditErr);
      return NextResponse.json({
        success: false,
        error: `Failed to update credits: ${creditErr instanceof Error ? creditErr.message : String(creditErr)}`,
      }, { status: 500 });
    }

    const scoresData = {
      overallQuality: coaching.overallQuality,
      atsCompatibility: coaching.atsCompatibility,
      competitiveness: coaching.competitiveness,
    };

    console.log("[POST] Step 10/12: Saving review to database...");
    let review;
    try {
      review = await prisma.review.create({
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
      console.log("[POST] Review saved, id:", review.id);
    } catch (saveErr) {
      logError("POST save review", saveErr);
      return NextResponse.json({
        success: false,
        error: `Failed to save review: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`,
      }, { status: 500 });
    }

    console.log("[POST] Step 11/12: Updating improvement score...");
    if (improvementScore !== null) {
      try {
        await prisma.document.update({
          where: { id },
          data: { improvementScore },
        });
        console.log("[POST] Improvement score updated:", improvementScore);
      } catch (impErr) {
        logError("POST update improvement score", impErr);
      }
    }

    console.log("[POST] Step 12/12: Building response...");
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

    console.log("[POST] Complete. Returning success for review:", review.id);
    return NextResponse.json({ success: true, data: responseData }, { status: 201 });
  } catch (err) {
    logError("POST top-level", err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log("[GET] Step 1/6: Params parsed, id =", id);
    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    console.log("[GET] Step 2/6: Authenticating...");
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("[GET] Auth failed:", authError?.message ?? "No user");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.log("[GET] Authenticated as user:", user.id);

    console.log("[GET] Step 3/6: Finding document...");
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        parentDocument: {
          include: { reviews: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
    });
    if (!document) {
      console.log("[GET] Document not found:", id);
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (document.userId !== user.id) {
      console.log("[GET] Forbidden: user", user.id, "does not own document", id);
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    console.log("[GET] Document found:", document.id, "version:", document.version);

    console.log("[GET] Step 4/6: Finding latest review...");
    const review = await prisma.review.findFirst({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });
    console.log("[GET] Review found:", review?.id ?? "none");

    const prevReview = document.parentDocument?.reviews?.[0] ?? null;
    console.log("[GET] Previous review:", prevReview?.id ?? "none");

    console.log("[GET] Step 5/6: Getting version chain...");
    let versionChain: Awaited<ReturnType<typeof getVersionChain>> = [];
    try {
      versionChain = await getVersionChain(id);
      console.log("[GET] Version chain length:", versionChain?.length ?? 0);
    } catch (chainErr) {
      logError("GET getVersionChain", chainErr);
      versionChain = [];
    }

    console.log("[GET] Step 6/6: Building response...");
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
    logError("GET top-level", err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    }, { status: 500 });
  }
}
