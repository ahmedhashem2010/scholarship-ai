export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiClient } from "@/lib/supabase/api-auth";

/**
 * Saved roadmaps.
 *
 * The roadmap is generated deterministically from the deadline, so it doesn't
 * need storing to be *displayed*. What we store is the student's relationship
 * to it — which scholarships they're working on, what they've ticked off, and
 * whether we've already emailed them about a date.
 *
 * GET    /api/roadmap                     → every saved milestone, soonest first
 * POST   /api/roadmap                     → save/refresh a scholarship's roadmap
 * DELETE /api/roadmap?scholarshipId=xxx   → stop tracking a scholarship
 */

const MAX_MILESTONES = 40;

async function requireUser(request: NextRequest) {
  const supabase = createApiClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const milestones = await prisma.roadmapMilestone.findMany({
      where: { userId: user.id },
      orderBy: [{ dueDate: "asc" }],
      include: {
        scholarship: {
          select: { id: true, nameEn: true, nameAr: true, deadline: true, country: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: milestones });
  } catch (err) {
    console.error("Roadmap GET error:", err);
    return NextResponse.json(
      { success: false, error: "Couldn't load your roadmaps." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const scholarshipId = typeof body?.scholarshipId === "string" ? body.scholarshipId : null;
    const raw = Array.isArray(body?.milestones) ? body.milestones : null;

    if (!scholarshipId || !raw) {
      return NextResponse.json(
        { success: false, error: "scholarshipId and milestones are required" },
        { status: 400 }
      );
    }
    if (raw.length === 0 || raw.length > MAX_MILESTONES) {
      return NextResponse.json(
        { success: false, error: `Expected 1–${MAX_MILESTONES} milestones` },
        { status: 400 }
      );
    }

    // The client sends dates it computed. Validate rather than trust: a bad
    // date here would sit in the reminder queue forever, or fire immediately.
    const milestones: { key: string; dueDate: Date }[] = [];
    for (const m of raw) {
      const key = typeof m?.key === "string" ? m.key.trim() : "";
      const due = m?.dueDate ? new Date(m.dueDate) : null;
      if (!key || key.length > 40) {
        return NextResponse.json({ success: false, error: "Invalid milestone key" }, { status: 400 });
      }
      if (!due || Number.isNaN(due.getTime())) {
        return NextResponse.json({ success: false, error: `Invalid date for ${key}` }, { status: 400 });
      }
      milestones.push({ key, dueDate: due });
    }

    // Must exist AND be visible — otherwise someone could pin a roadmap to a
    // scholarship we've retired, and the reminder job would email about it.
    const scholarship = await prisma.scholarship.findUnique({
      where: { id: scholarshipId },
      select: { id: true },
    });
    if (!scholarship) {
      return NextResponse.json({ success: false, error: "Scholarship not found" }, { status: 404 });
    }

    // Upsert per milestone so re-saving after a deadline change updates dates
    // WITHOUT clearing the student's completed ticks. Deleting and recreating
    // would silently wipe their progress.
    await prisma.$transaction(
      milestones.map((m) =>
        prisma.roadmapMilestone.upsert({
          where: {
            userId_scholarshipId_key: { userId: user.id, scholarshipId, key: m.key },
          },
          create: {
            userId: user.id,
            scholarshipId,
            key: m.key,
            dueDate: m.dueDate,
          },
          update: {
            // If the date moved, the old "we already reminded you" no longer
            // applies — clear it so the new date gets its own reminder.
            dueDate: m.dueDate,
            reminderSentAt: null,
          },
        })
      )
    );

    const saved = await prisma.roadmapMilestone.findMany({
      where: { userId: user.id, scholarshipId },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (err) {
    console.error("Roadmap POST error:", err);
    return NextResponse.json(
      { success: false, error: "Couldn't save this roadmap." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const scholarshipId = request.nextUrl.searchParams.get("scholarshipId");
    if (!scholarshipId) {
      return NextResponse.json(
        { success: false, error: "scholarshipId is required" },
        { status: 400 }
      );
    }

    // Scoped to userId as well as scholarshipId — never trust the client to
    // only delete its own rows.
    const { count } = await prisma.roadmapMilestone.deleteMany({
      where: { userId: user.id, scholarshipId },
    });

    return NextResponse.json({ success: true, deleted: count });
  } catch (err) {
    console.error("Roadmap DELETE error:", err);
    return NextResponse.json(
      { success: false, error: "Couldn't remove this roadmap." },
      { status: 500 }
    );
  }
}
