import { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import type { Scholarship } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scholarshipUpdateSchema } from "@/lib/validations/scholarship";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Explicit return type so `"error" in result` narrows correctly. TypeScript
 * does not narrow an *inferred* union of `as const` object literals returned
 * by an async helper, which leaves the callers' return types `| undefined`.
 */
async function getOrNotFound(
  id: string
): Promise<{ error: NextResponse } | { data: Scholarship }> {
  const scholarship = await prisma.scholarship.findUnique({ where: { id } });
  if (!scholarship) {
    return { error: errorResponse("Scholarship not found", 404) };
  }
  return { data: scholarship };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getOrNotFound(params.id);
    if ("error" in result) return result.error;
    return successResponse(result.data);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gate = await requireAdmin(request);
    if ("response" in gate) return gate.response;

    const result = await getOrNotFound(params.id);
    if ("error" in result) return result.error;

    const ct = request.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      return errorResponse("Content-Type must be application/json", 415);
    }

    const body: unknown = await request.json();
    const data = scholarshipUpdateSchema.parse(body);

    const scholarship = await prisma.scholarship.update({
      where: { id: params.id },
      data: {
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.university !== undefined && { university: data.university || null }),
        ...(data.degree !== undefined && { degree: data.degree }),
        ...(data.deadline !== undefined && { deadline: new Date(data.deadline) }),
        ...(data.flagUrl !== undefined && { flagUrl: data.flagUrl || null }),
        ...(data.requirements !== undefined && { requirements: data.requirements ?? null }),
        ...(data.benefits !== undefined && { benefits: data.benefits ?? null }),
        ...(data.sourceUrl !== undefined && { sourceUrl: data.sourceUrl || null }),
        ...(data.officialWebsite !== undefined && { officialWebsite: data.officialWebsite || null }),
        ...(data.applicationUrl !== undefined && { applicationUrl: data.applicationUrl || null }),
      },
    });

    return successResponse(scholarship);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gate = await requireAdmin(request);
    if ("response" in gate) return gate.response;

    const result = await getOrNotFound(params.id);
    if ("error" in result) return result.error;

    await prisma.scholarship.delete({ where: { id: params.id } });

    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
