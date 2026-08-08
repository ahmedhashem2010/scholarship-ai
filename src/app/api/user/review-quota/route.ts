import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";
import { DAILY_REVIEW_LIMIT, currentDayKey } from "@/lib/review-quota";

/**
 * GET /api/user/review-quota
 *
 * Returns the authenticated user's free AI review usage for the current UTC
 * day. The documents page renders this as a pill so students always know how
 * many free reviews they have left before they hit the 429 limit-reached flow.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const day = currentDayKey();
    const usage = await prisma.reviewDailyUsage.findUnique({
      where: { userId_day: { userId: user.id, day } },
    });
    const used = usage?.count ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        used,
        limit: DAILY_REVIEW_LIMIT,
        remaining: Math.max(0, DAILY_REVIEW_LIMIT - used),
      },
    });
  } catch (error) {
    console.error("[review-quota] Failed to load daily review quota:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load your daily review quota." },
      { status: 500 }
    );
  }
}
