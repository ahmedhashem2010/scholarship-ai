export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { unauthorized } from "@/lib/api-utils";

/**
 * PATCH /api/roadmap/[id]  — tick a milestone off, or un-tick it.
 *
 * Body: { isDone: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Milestone ID is required" }, { status: 400 });
    }

    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    if (typeof body?.isDone !== "boolean") {
      return NextResponse.json(
        { success: false, error: "isDone must be true or false" },
        { status: 400 }
      );
    }
    const isDone: boolean = body.isDone;

    // updateMany with userId in the WHERE, rather than findUnique-then-update:
    // it's a single query and it makes it impossible to tick off a milestone
    // belonging to someone else. count === 0 covers both "no such row" and
    // "not yours" — deliberately indistinguishable to the caller.
    const { count } = await prisma.roadmapMilestone.updateMany({
      where: { id, userId: user.id },
      data: {
        isDone,
        doneAt: isDone ? new Date() : null,
        // A completed milestone shouldn't generate a reminder. Marking it as
        // already-sent is how it leaves the reminder queue.
        ...(isDone ? { reminderSentAt: new Date() } : {}),
      },
    });

    if (count === 0) {
      return NextResponse.json({ success: false, error: "Milestone not found" }, { status: 404 });
    }

    const updated = await prisma.roadmapMilestone.findUnique({ where: { id } });
    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Roadmap PATCH error:", err);
    return NextResponse.json(
      { success: false, error: "Couldn't update that step." },
      { status: 500 }
    );
  }
}
