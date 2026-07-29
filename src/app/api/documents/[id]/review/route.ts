import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { reviewDocument, calculateAverageScore } from "@/lib/ai-review";
import type { ReviewScore } from "@/lib/ai-review";
import { extractTextFromFile } from "@/lib/text-extract";
import { getVersionChain } from "@/lib/document-versions";


/**
 * Step tracing for the review pipeline.
 *
 * These lines were plain console.log. On Vercel that means every user ID,
 * document ID and storage URL for every review lands in production logs
 * forever — on a product whose documents are students' personal statements and
 * CVs. They're genuinely useful when a review fails, so they're kept but gated.
 *
 * Set AI_DEBUG=true locally to see them. Never in production.
 */
const REVIEW_DEBUG = process.env.AI_DEBUG === "true";
function debugLog(...args: unknown[]) {
  if (REVIEW_DEBUG) console.log(...args);
}


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
    debugLog("[POST] Step 1/12: Params parsed, id =", id);
    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    debugLog("[POST] Step 2/12: Creating API client and authenticating user...");
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      debugLog("[POST] Auth failed:", authError?.message ?? "No user");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    debugLog("[POST] Authenticated as user:", user.id);

    debugLog("[POST] Step 3/12: Finding document by id...");
    const document = await prisma.document.findUnique({
      where: { id },
      include: { parentDocument: true },
    });
    if (!document) {
      debugLog("[POST] Document not found:", id);
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (document.userId !== user.id) {
      debugLog("[POST] Forbidden: user", user.id, "does not own document", id);
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    debugLog("[POST] Document found:", document.id, "type:", document.documentType, "fileUrl:", document.fileUrl?.slice(0, 80) ?? "none");

    debugLog("[POST] Step 4/12: Checking user credits...");
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || dbUser.reviewCredits < 1) {
      debugLog("[POST] No credits for user:", user.id, "credits:", dbUser?.reviewCredits);
      return NextResponse.json({ success: false, error: "No credits", needsCredits: true }, { status: 402 });
    }
    debugLog("[POST] User credits:", dbUser.reviewCredits);

    debugLog("[POST] Step 5/12: Checking for existing review...");
    const existingReview = await prisma.review.findFirst({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });
    if (existingReview) {
      debugLog("[POST] Existing review found, returning cached result");
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
      debugLog("[POST] Document fileUrl is missing");
      return NextResponse.json({ success: false, error: "Document file URL is missing" }, { status: 400 });
    }

    debugLog("[POST] Step 6/12: Getting parent score for comparison...");
    let prevScore: number | null = null;
    if (document.parentDocumentId && document.parentDocument) {
      const prevReview = await prisma.review.findFirst({
        where: { documentId: document.parentDocumentId },
        orderBy: { createdAt: "desc" },
      });
      if (prevReview) prevScore = prevReview.score;
    }

    let text: string;
    debugLog("[POST] Step 7/12: Downloading file and extracting text...");
    debugLog("[POST] fileUrl:", document.fileUrl);
    debugLog("[POST] fileType:", document.fileType);
    try {
      text = await extractTextFromFile(document.fileUrl, document.fileType);
      debugLog("[POST] Text extracted, length:", text.length);
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
      debugLog("[POST] Extracted text too short:", text?.length ?? 0);
      return NextResponse.json({
        success: false,
        error: "The document contains very little extractable text. It may be a scanned image. Please upload a text-based PDF or DOCX.",
      }, { status: 400 });
    }

    debugLog("[POST] Step 8/12: Calling AI review...");
    let coaching: ReviewScore;
    try {
      coaching = await reviewDocument(text, document.documentType);
      debugLog("[POST] AI review complete, overall score:", coaching.overallQuality?.score);
    } catch (aiErr) {
      logError("POST reviewDocument", aiErr);
      // No credit has been charged at this point — the transaction below is
      // what consumes it — so the user loses nothing on an AI failure.
      const msg = aiErr instanceof Error ? aiErr.message : "";
      const isCapacity = /quota|rate limit|insufficient|temporarily unavailable/i.test(msg);
      return NextResponse.json(
        {
          success: false,
          error: isCapacity
            ? "Our review service is busy right now. Please try again in a few minutes — you haven't been charged."
            : "The review couldn't be completed. You haven't been charged — please try again.",
        },
        { status: 502 }
      );
    }

    if (!coaching || typeof coaching.overallQuality?.score !== "number") {
      debugLog("[POST] AI returned invalid response structure");
      return NextResponse.json({ success: false, error: "AI review returned an invalid response" }, { status: 502 });
    }

    const mainScore = coaching.overallQuality.score;
    const improvementScore = prevScore !== null ? mainScore - prevScore : null;

    const scoresData = {
      overallQuality: coaching.overallQuality,
      atsCompatibility: coaching.atsCompatibility,
      competitiveness: coaching.competitiveness,
    };

    // Charge the credit and save the review ATOMICALLY.
    //
    // Two bugs this closes:
    //  1. The credit was decremented before the review was written. If the
    //     write failed, the user paid and got nothing.
    //  2. The earlier balance check and the decrement were separate statements,
    //     so two concurrent requests could both pass the check and both
    //     decrement — one credit, two reviews.
    //
    // `updateMany` with `reviewCredits: { gte: 1 }` makes the decrement
    // conditional at the database level: count 0 means someone else got there
    // first, and we abort without writing a review.
    debugLog("[POST] Step 9/12: Charging credit and saving review...");
    let review;
    try {
      review = await prisma.$transaction(async (tx) => {
        const charged = await tx.user.updateMany({
          where: { id: user.id, reviewCredits: { gte: 1 } },
          data: { reviewCredits: { decrement: 1 } },
        });

        if (charged.count === 0) {
          throw new Error("INSUFFICIENT_CREDITS");
        }

        return tx.review.create({
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
      });
      debugLog("[POST] Review saved, id:", review.id);
    } catch (saveErr) {
      if (saveErr instanceof Error && saveErr.message === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          { success: false, error: "No credits remaining", needsCredits: true },
          { status: 402 }
        );
      }
      // The transaction rolled back, so the credit was NOT consumed.
      logError("POST save review", saveErr);
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't save your review. Your credit has not been used — please try again.",
        },
        { status: 500 }
      );
    }

    debugLog("[POST] Step 11/12: Updating improvement score...");
    if (improvementScore !== null) {
      try {
        await prisma.document.update({
          where: { id },
          data: { improvementScore },
        });
        debugLog("[POST] Improvement score updated:", improvementScore);
      } catch (impErr) {
        logError("POST update improvement score", impErr);
      }
    }

    debugLog("[POST] Step 12/12: Building response...");
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

    debugLog("[POST] Complete. Returning success for review:", review.id);
    return NextResponse.json({ success: true, data: responseData }, { status: 201 });
  } catch (err) {
    logError("POST top-level", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong generating your review. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    debugLog("[GET] Step 1/6: Params parsed, id =", id);
    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }

    debugLog("[GET] Step 2/6: Authenticating...");
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      debugLog("[GET] Auth failed:", authError?.message ?? "No user");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    debugLog("[GET] Authenticated as user:", user.id);

    debugLog("[GET] Step 3/6: Finding document...");
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        parentDocument: {
          include: { reviews: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
    });
    if (!document) {
      debugLog("[GET] Document not found:", id);
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    if (document.userId !== user.id) {
      debugLog("[GET] Forbidden: user", user.id, "does not own document", id);
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    debugLog("[GET] Document found:", document.id, "version:", document.version);

    debugLog("[GET] Step 4/6: Finding latest review...");
    const review = await prisma.review.findFirst({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });
    debugLog("[GET] Review found:", review?.id ?? "none");

    const prevReview = document.parentDocument?.reviews?.[0] ?? null;
    debugLog("[GET] Previous review:", prevReview?.id ?? "none");

    debugLog("[GET] Step 5/6: Getting version chain...");
    let versionChain: Awaited<ReturnType<typeof getVersionChain>> = [];
    try {
      versionChain = await getVersionChain(id);
      debugLog("[GET] Version chain length:", versionChain?.length ?? 0);
    } catch (chainErr) {
      logError("GET getVersionChain", chainErr);
      versionChain = [];
    }

    debugLog("[GET] Step 6/6: Building response...");
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
