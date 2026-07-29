export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { deadlineReminderHtml } from "@/lib/email-templates";

/**
 * Deadline reminder job.
 *
 * GET /api/cron/reminders   (Authorization: Bearer $CRON_SECRET)
 *
 * This is the point of the whole roadmap feature. A dated plan someone looks at
 * once is a diagram; a dated plan that emails you six weeks before your referee
 * deadline is a product. Students miss scholarships by starting late, not by
 * forgetting the final date.
 *
 * Design decisions worth knowing:
 *
 *  - **One email per user, not per milestone.** Someone tracking four
 *    scholarships would otherwise get four emails in one morning and mute us.
 *  - **`reminderSentAt` is set even on send failure.** Retrying a bounced
 *    address every hour forever is worse than dropping one reminder — and the
 *    timestamp is still there to debug with.
 *  - **Reminders only fire for milestones in a 0–14 day window.** A milestone
 *    already weeks overdue shouldn't generate a "coming up soon" email.
 *  - **The job is idempotent.** Running it twice in a day sends nothing the
 *    second time, so a flaky scheduler can't spam anyone.
 *
 * Schedule it daily. On Vercel that's vercel.json; anywhere else, any cron that
 * can issue an authenticated GET.
 */

const WINDOW_DAYS = 14;
/** Don't email about something that slipped weeks ago — that's a different message. */
const OVERDUE_GRACE_DAYS = 2;
const MAX_USERS_PER_RUN = 200;

export async function GET(request: NextRequest) {
  // Without a secret this endpoint is a free, unauthenticated way to make us
  // send email to our own users. Fail closed if it isn't configured.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/reminders] CRON_SECRET is not set — refusing to run.");
    return NextResponse.json(
      { success: false, error: "Reminders are not configured." },
      { status: 503 }
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + WINDOW_DAYS * 86_400_000);
    const windowStart = new Date(now.getTime() - OVERDUE_GRACE_DAYS * 86_400_000);

    const due = await prisma.roadmapMilestone.findMany({
      where: {
        isDone: false,
        reminderSentAt: null,
        dueDate: { gte: windowStart, lte: windowEnd },
      },
      orderBy: { dueDate: "asc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        scholarship: { select: { nameAr: true, nameEn: true } },
      },
    });

    if (due.length === 0) {
      return NextResponse.json({ success: true, users: 0, milestones: 0, sent: 0 });
    }

    // Group by user so each person gets one digest.
    const byUser = new Map<string, typeof due>();
    for (const m of due) {
      const list = byUser.get(m.userId);
      if (list) list.push(m);
      else byUser.set(m.userId, [m]);
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    const roadmapUrl = `${siteUrl}/dashboard/roadmap`;

    let sent = 0;
    let skipped = 0;
    const processedIds: string[] = [];

    for (const [, items] of Array.from(byUser).slice(0, MAX_USERS_PER_RUN)) {
      const first = items[0];
      if (!first) continue;
      const email = first.user.email;

      // No address — nothing to do, but still mark them so we don't re-scan
      // these rows on every run.
      if (!email) {
        skipped++;
        processedIds.push(...items.map((i) => i.id));
        continue;
      }

      const rows = items.map((m) => ({
        scholarshipName: m.scholarship.nameAr || m.scholarship.nameEn,
        step: STEP_LABELS_AR[m.key] ?? m.key,
        daysLeft: Math.ceil((m.dueDate.getTime() - now.getTime()) / 86_400_000),
        dueDate: m.dueDate.toLocaleDateString("ar-EG", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      }));

      const result = await sendEmail({
        to: email,
        subject:
          rows.length === 1
            ? `تذكير: ${rows[0]!.step}`
            : `لديك ${rows.length} خطوات قادمة في خطتك`,
        html: deadlineReminderHtml(first.user.name ?? "", rows, roadmapUrl),
      });

      if (result.sent) sent++;
      else skipped++;

      // Marked regardless of outcome — see the note at the top of the file.
      processedIds.push(...items.map((i) => i.id));
    }

    if (processedIds.length > 0) {
      await prisma.roadmapMilestone.updateMany({
        where: { id: { in: processedIds } },
        data: { reminderSentAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      users: byUser.size,
      milestones: due.length,
      sent,
      skipped,
    });
  } catch (err) {
    console.error("[cron/reminders] failed:", err);
    return NextResponse.json(
      { success: false, error: "Reminder job failed." },
      { status: 500 }
    );
  }
}

/**
 * Arabic labels for milestone keys.
 *
 * Duplicated from roadmap-generator's COPY rather than imported, because that
 * module builds full Roadmap objects from a deadline and we only have a key
 * here. Kept in sync manually — an unknown key falls back to the raw key
 * rather than throwing, so a new milestone type degrades instead of breaking
 * everyone's reminders.
 */
const STEP_LABELS_AR: Record<string, string> = {
  RESEARCH: "ابحث عن تفاصيل المنحة",
  ENGLISH_PREP: "ابدأ التحضير لاختبار الإنجليزية",
  ENGLISH_BOOK: "احجز موعد اختبار الإنجليزية",
  ENGLISH_SIT: "أدِّ اختبار الإنجليزية",
  ENGLISH_RESULTS: "استلام نتيجة الاختبار",
  REQUEST_LETTERS: "اطلب خطابات التوصية",
  CHASE_LETTERS: "تابع مع أساتذتك بشأن الخطابات",
  RESEARCH_PROPOSAL: "اكتب المقترح البحثي",
  DRAFT_STATEMENT: "اكتب مسودة خطاب الدوافع",
  REVIEW_1: "راجع خطاب الدوافع",
  REVISE: "عدّل بناءً على الملاحظات",
  REVIEW_2: "المراجعة النهائية",
  ORDER_TRANSCRIPT: "اطلب كشف الدرجات",
  PASSPORT: "تأكد من صلاحية جواز السفر",
  ASSEMBLE: "جمّع كل المستندات",
  SUBMIT: "قدّم الطلب",
  DEADLINE: "الموعد النهائي",
};
