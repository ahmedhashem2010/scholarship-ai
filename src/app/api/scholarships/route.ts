import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scholarshipCreateSchema, scholarshipQuerySchema } from "@/lib/validations/scholarship";
import { successResponse, handleApiError } from "@/lib/api-utils";
import { createApiClient } from "@/lib/supabase/api-auth";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = scholarshipQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );

    const where: Prisma.ScholarshipWhereInput = {};

    if (query.country) {
      where.country = query.country;
    }
    if (query.degree) {
      where.degree = query.degree;
    }
    if (query.search) {
      where.OR = [
        { nameAr: { contains: query.search } },
        { nameEn: { contains: query.search } },
      ];
    }

    const orderBy: Prisma.ScholarshipOrderByWithRelationInput = (() => {
      switch (query.sort) {
        case "deadline_desc": return { deadline: "desc" };
        case "name_asc":      return { nameEn: "asc" };
        case "name_desc":     return { nameEn: "desc" };
        default:              return { deadline: "asc" };
      }
    })();

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const [total, scholarships] = await Promise.all([
      prisma.scholarship.count({ where }),
      prisma.scholarship.findMany({ where, orderBy, skip, take: pageSize }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return successResponse({
      data: scholarships,
      metadata: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const ct = request.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    const body: unknown = await request.json();
    const data = scholarshipCreateSchema.parse(body);

    const scholarship = await prisma.scholarship.create({
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        country: data.country,
        university: data.university || null,
        degree: data.degree,
        deadline: new Date(data.deadline),
        flagUrl: data.flagUrl || null,
        requirements: data.requirements ?? null,
        benefits: data.benefits ?? null,
        sourceUrl: data.sourceUrl || null,
      },
    });

    return successResponse(scholarship, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
