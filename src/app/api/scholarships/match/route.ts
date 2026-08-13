export const runtime = "nodejs";

// Reads auth cookies, so it can never be static. Declaring that up front
// stops Next attempting a prerender at build time, failing, and printing a
// DYNAMIC_SERVER_USAGE stack trace that looks like a broken build but isn't.
export const dynamic = "force-dynamic";


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { unauthorized } from "@/lib/api-utils";
import { matchScholarshipsToUser } from "@/lib/scholarship-matcher";
import { visibleScholarshipWhere } from "@/lib/scholarship-filters";

const cache = new Map<string, { data: unknown; expiresAt: number; profileStamp: string }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** Cap the cache so a long-lived instance can't grow unbounded. */
const CACHE_MAX_ENTRIES = 500;

function setCache(key: string, value: { data: unknown; expiresAt: number; profileStamp: string }) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Evict expired first; if none, drop the oldest inserted key.
    const now = Date.now();
    // Snapshot the keys before deleting: mutating a Map while iterating it is
    // legal but fragile, and Array.from avoids needing downlevelIteration.
    for (const k of Array.from(cache.keys())) {
      const v = cache.get(k);
      if (v && v.expiresAt < now) cache.delete(k);
    }
    if (cache.size >= CACHE_MAX_ENTRIES) {
      const oldest = Array.from(cache.keys())[0];
      if (oldest !== undefined) cache.delete(oldest);
    }
  }
  cache.set(key, value);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return NextResponse.json({ success: false, error: "Complete your profile first" }, { status: 400 });
    }

    // Cache was previously keyed on user ID alone with a 24h TTL, so editing
    // your profile didn't change your matches for a full day. Key on the
    // profile's updatedAt so any edit invalidates it immediately.
    const profileStamp = profile.updatedAt.toISOString();
    const cached = cache.get(user.id);
    if (cached && Date.now() < cached.expiresAt && cached.profileStamp === profileStamp) {
      return NextResponse.json({ success: true, data: cached.data, cached: true });
    }

    // Previously: findMany({ take: 100, orderBy: { deadline: "asc" } }) with no
    // filter. Postgres sorts NULLs last on ASC, so this took the 100 EARLIEST
    // deadlines — i.e. the most expired records in the table — and matched
    // users against those. Filter to visible records first.
    const scholarships = await prisma.scholarship.findMany({
      where: visibleScholarshipWhere(),
      take: 200,
      orderBy: [{ isVerified: "desc" }, { deadline: "asc" }],
    });

    const results = matchScholarshipsToUser(
      {
        dateOfBirth: profile.dateOfBirth?.toISOString() ?? "",
        country: profile.country,
        educationLevel: profile.educationLevel,
        major: profile.major,
        targetDegree: profile.targetDegree,
        englishLevel: profile.englishLevel,
        hasEnglishTest: profile.hasEnglishTest,
        budget: profile.budget,
        gpa: profile.gpa,
        hasResearch: profile.hasResearch,
        hasWorkExperience: profile.hasWorkExperience,
      },
      scholarships
    );

    setCache(user.id, {
      data: results,
      expiresAt: Date.now() + CACHE_TTL_MS,
      profileStamp,
    });

    return NextResponse.json({ success: true, data: results, cached: false });
  } catch (err) {
    console.error("Match GET error:", err);
    return NextResponse.json(
      { success: false, error: "Couldn't load your matches. Please try again." },
      { status: 500 }
    );
  }
}
