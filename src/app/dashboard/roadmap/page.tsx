"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Circle, MapPin } from "lucide-react";
import { Nav } from "@/components/nav";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * "What do I actually need to do next?"
 *
 * The per-scholarship roadmap answers that for one application. A student
 * applying to five needs the merged view, sorted by date — otherwise they have
 * to open five pages and do the merging in their head, which is exactly the
 * work we're claiming to remove.
 */

interface Milestone {
  id: string;
  key: string;
  dueDate: string;
  isDone: boolean;
  scholarshipId: string;
  scholarship: {
    id: string;
    nameEn: string;
    nameAr: string;
    country: string;
  };
}

const STEP_LABELS: Record<string, { ar: string; en: string }> = {
  RESEARCH: { ar: "ابحث عن تفاصيل المنحة", en: "Research the scholarship" },
  ENGLISH_PREP: { ar: "ابدأ التحضير للاختبار", en: "Start English prep" },
  ENGLISH_BOOK: { ar: "احجز موعد الاختبار", en: "Book the English test" },
  ENGLISH_SIT: { ar: "أدِّ الاختبار", en: "Sit the English test" },
  ENGLISH_RESULTS: { ar: "استلام النتيجة", en: "Results arrive" },
  REQUEST_LETTERS: { ar: "اطلب خطابات التوصية", en: "Request recommendation letters" },
  CHASE_LETTERS: { ar: "تابع مع أساتذتك", en: "Chase your referees" },
  RESEARCH_PROPOSAL: { ar: "اكتب المقترح البحثي", en: "Write the research proposal" },
  DRAFT_STATEMENT: { ar: "اكتب مسودة خطاب الدوافع", en: "Draft your statement" },
  REVIEW_1: { ar: "راجع خطاب الدوافع", en: "First review" },
  REVISE: { ar: "عدّل بناءً على الملاحظات", en: "Revise" },
  REVIEW_2: { ar: "المراجعة النهائية", en: "Final review" },
  ORDER_TRANSCRIPT: { ar: "اطلب كشف الدرجات", en: "Order your transcript" },
  PASSPORT: { ar: "تحقق من جواز السفر", en: "Check your passport" },
  ASSEMBLE: { ar: "جمّع المستندات", en: "Assemble documents" },
  SUBMIT: { ar: "قدّم الطلب", en: "Submit" },
  DEADLINE: { ar: "الموعد النهائي", en: "Deadline" },
};

export default function RoadmapPage() {
  const { pick, num, isRTL } = useLanguage();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/roadmap");
      const json = await res.json();
      if (json.success) setMilestones(json.data ?? []);
    } catch {
      /* leave the list empty; the empty state explains itself */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(m: Milestone) {
    setBusy(m.id);
    // Optimistic: ticking a checkbox should feel instant. Reverted on failure.
    const previous = milestones;
    setMilestones((list) =>
      list.map((x) => (x.id === m.id ? { ...x, isDone: !x.isDone } : x))
    );
    try {
      const res = await fetch(`/api/roadmap/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !m.isDone }),
      });
      if (!res.ok) setMilestones(previous);
    } catch {
      setMilestones(previous);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <RoadmapSkeleton />;

  const pending = milestones.filter((m) => !m.isDone);
  const done = milestones.filter((m) => m.isDone);
  const visible = showDone ? milestones : pending;

  const now = Date.now();
  const overdue = pending.filter((m) => new Date(m.dueDate).getTime() < now);

  if (milestones.length === 0) {
    return (
      <>
        <Nav />
        <main className="page-container py-16 text-center">
          <CalendarClock className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="font-display mt-4 text-xl font-bold text-foreground">
            {pick("لا توجد خطط محفوظة بعد", "No saved plans yet")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {pick(
              "افتح أي منحة لها موعد نهائي واحفظ خطتها. سنذكّرك بكل خطوة قبل موعدها.",
              "Open any scholarship with a deadline and save its plan. We'll remind you before each step is due."
            )}
          </p>
          <Link href="/scholarships">
            <button className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              {pick("تصفّح المنح", "Browse scholarships")}
            </button>
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="page-container py-6 sm:py-8">
        <header>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {pick("خطتي", "My plan")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {pick(
              `${num(pending.length)} خطوة متبقية عبر ${num(new Set(milestones.map((m) => m.scholarshipId)).size)} منحة`,
              `${pending.length} steps remaining across ${new Set(milestones.map((m) => m.scholarshipId)).size} scholarships`
            )}
          </p>
        </header>

        {overdue.length > 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {pick(
                  `${num(overdue.length)} خطوة تأخّرت عن موعدها`,
                  `${overdue.length} steps are past due`
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pick(
                  "التأخير في هذه الخطوات هو السبب الأول لضياع المنح. ابدأ بأقدمها.",
                  "Falling behind here is the single biggest reason applications fail. Start with the oldest."
                )}
              </p>
            </div>
          </div>
        )}

        {done.length > 0 && (
          <button
            onClick={() => setShowDone((v) => !v)}
            className="mt-5 text-sm text-primary hover:underline"
          >
            {showDone
              ? pick("إخفاء المكتمل", "Hide completed")
              : pick(`عرض المكتمل (${num(done.length)})`, `Show completed (${done.length})`)}
          </button>
        )}

        <ol className="mt-6 space-y-2">
          {visible.map((m) => {
            const label = STEP_LABELS[m.key];
            const dueMs = new Date(m.dueDate).getTime();
            const days = Math.ceil((dueMs - now) / 86_400_000);
            const isOverdue = !m.isDone && dueMs < now;

            return (
              <li key={m.id}>
                <div
                  className={`card-raised flex items-start gap-3 p-4 transition ${
                    m.isDone ? "opacity-60" : ""
                  }`}
                >
                  <button
                    onClick={() => void toggle(m)}
                    disabled={busy === m.id}
                    aria-label={
                      m.isDone
                        ? pick("إلغاء الإتمام", "Mark as not done")
                        : pick("تمّت", "Mark as done")
                    }
                    // h-11 w-11 keeps this at the ~44px minimum touch target on
                    // phones; a bare 16px checkbox is very hard to hit.
                    className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                  >
                    {m.isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-[rgb(var(--success))]" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        m.isDone ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                    >
                      {label ? pick(label.ar, label.en) : m.key}
                    </p>

                    <Link
                      href={`/scholarships/${m.scholarshipId}`}
                      className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span className="truncate">
                        {pick(m.scholarship.nameAr, m.scholarship.nameEn)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {m.scholarship.country}
                      </span>
                    </Link>
                  </div>

                  <div className="shrink-0 text-end">
                    <p
                      className={`text-xs font-semibold ${
                        isOverdue
                          ? "text-destructive"
                          : days <= 7
                            ? "text-[rgb(var(--accent-warm))]"
                            : "text-muted-foreground"
                      }`}
                    >
                      {m.isDone
                        ? pick("تمّت", "Done")
                        : isOverdue
                          ? pick(`متأخر ${num(Math.abs(days))} يوم`, `${Math.abs(days)}d late`)
                          : days === 0
                            ? pick("اليوم", "Today")
                            : pick(`${num(days)} يوم`, `${days}d`)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(m.dueDate).toLocaleDateString(isRTL ? "ar-EG" : "en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}

function RoadmapSkeleton() {
  return (
    <>
      <Nav />
      <main className="page-container animate-pulse py-8">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="mt-3 h-4 w-64 rounded bg-muted" />
        <div className="mt-8 space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted" />
          ))}
        </div>
      </main>
    </>
  );
}
