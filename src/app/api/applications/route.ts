export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { unauthorized } from "@/lib/api-utils";
import { createApplicationSchema } from "@/lib/validations/application";

const DEFAULT_DOC_TYPES = ["CV", "PERSONAL_STATEMENT", "TRANSCRIPT"];

function getRequiredDocTypes(requiredDocuments: string | string[], requirements: string | null): string[] {
  if (Array.isArray(requiredDocuments)) {
    if (requiredDocuments.length > 0) return requiredDocuments;
  } else if (requiredDocuments && requiredDocuments !== "[]") {
    try {
      const docs = JSON.parse(requiredDocuments);
      if (Array.isArray(docs) && docs.length > 0) return docs;
    } catch {
      // fall through
    }
  }

  // Fallback: infer from requirements JSON
  if (!requirements) return DEFAULT_DOC_TYPES;
  try {
    const parsed = JSON.parse(requirements);
    const docs: string[] = parsed.documents ?? [];
    const text = JSON.stringify(docs).toLowerCase();
    const types: string[] = [];
    if (text.includes("research") || text.includes("thesis") || text.includes("abstract")) types.push("RESEARCH_PROPOSAL");
    if (text.includes("cv") || text.includes("resume") || text.includes("curriculum")) types.push("CV");
    if (text.includes("statement") || text.includes("purpose") || text.includes("motivation") || text.includes("personal")) types.push("PERSONAL_STATEMENT");
    if (text.includes("recommendation") || text.includes("reference") || text.includes("letter")) types.push("RECOMMENDATION_LETTER");
    if (text.includes("transcript") || text.includes("certificate") || text.includes("diploma") || text.includes("academic record")) types.push("TRANSCRIPT");
    if (text.includes("medical") || text.includes("health")) types.push("MEDICAL_CERTIFICATE");
    if (types.length === 0) types.push("OTHER");
    return Array.from(new Set(types));
  } catch {
    return DEFAULT_DOC_TYPES;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        scholarship: true,
        documents: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Orphan detection: an application whose scholarship no longer exists
    // (e.g. it was deleted during the MVP 250 → 50 database freeze) resolves
    // `scholarship` to null. The UI renders these as "no longer available" —
    // never crash — but the orphan itself must stay visible in server logs so
    // we can decide whether to clean it up.
    for (const app of applications) {
      if (!app.scholarship) {
        console.warn(
          `[applications] ORPHANED application "${app.id}" references missing scholarship "${app.scholarshipId}" (user "${app.userId}"). Rendered as no-longer-available.`
        );
      }
    }

    return NextResponse.json({ success: true, data: applications });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch applications";
    console.error("Applications list error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const body: unknown = await request.json().catch(() => null);
    const parsed = createApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Missing scholarshipId" }, { status: 400 });
    }
    const { scholarshipId } = parsed.data;

    const existing = await prisma.application.findUnique({
      where: { userId_scholarshipId: { userId: user.id, scholarshipId } },
      include: { scholarship: true, documents: true },
    });
    if (existing) {
      if (!existing.scholarship) {
        console.warn(
          `[applications] POST returned an orphaned application "${existing.id}" — scholarship "${scholarshipId}" no longer exists.`
        );
      }
      return NextResponse.json({ success: true, data: existing });
    }

    const scholarship = await prisma.scholarship.findUnique({ where: { id: scholarshipId } });
    if (!scholarship) {
      return NextResponse.json({ success: false, error: "Scholarship not found" }, { status: 404 });
    }

    const docTypes = getRequiredDocTypes(scholarship.requiredDocuments, scholarship.requirements);

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        scholarshipId,
        status: "IN_PROGRESS",
        progress: 5,
        documents: {
          create: docTypes.map((type) => ({
            documentType: type,
            status: "NOT_STARTED",
          })),
        },
      },
      include: { scholarship: true, documents: true },
    });

    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start application";
    console.error("Application start error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
