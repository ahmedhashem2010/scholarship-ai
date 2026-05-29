export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { matchScholarshipsToUser } from "@/lib/scholarship-matcher";

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const cached = cache.get(user.id);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json({ success: true, data: cached.data, cached: true });
    }

    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return NextResponse.json({ success: false, error: "Complete your profile first" }, { status: 400 });
    }

    const scholarships = await prisma.scholarship.findMany({ take: 100, orderBy: { deadline: "asc" } });

    const results = matchScholarshipsToUser(
      {
        dateOfBirth: profile.dateOfBirth?.toISOString() ?? "",
        country: profile.country,
        educationLevel: profile.educationLevel,
        major: profile.major,
        targetDegree: profile.targetDegree,
        englishLevel: profile.englishLevel,
        budget: profile.budget,
        gpa: profile.gpa,
        hasResearch: profile.hasResearch,
        hasWorkExperience: profile.hasWorkExperience,
      },
      scholarships
    );

    cache.set(user.id, { data: results, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json({ success: true, data: results, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Matching failed";
    console.error("Match GET error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
