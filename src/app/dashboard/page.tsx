"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload, Clock, ArrowLeft, ArrowRight, FileText, Target,
  AlertTriangle, Sparkles,
} from "lucide-react";
import { Nav } from "@/components/nav";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/lib/profile-context";
import { useCredits } from "@/lib/credits-context";

/**
 * Dashboard.
 *
 * Rebuilt around a single question: "what do I do next?"
 *
 * The previous version opened with a row of stat tiles — documents uploaded,
 * average score, deadline count. Stats describe the past. A student arriving
 * here wants to know what to do now, so the first thing on the page is one
 * action, chosen from their actual state.
 */

interface Match {
  id: string;
  nameEn: string;
  nameAr: string;
  country: string;
  deadlineType: string | null;
  daysLeft: number | null;
  fitScore: number;
  dataCompleteness: number;
}

interface Doc {
  id: string;
  name: string;
  score: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, pick, num } = useLanguage();
  const { profile, isLoading: profileLoading } = useProfile();
  const { credits } = useCredits();

  const [matches, setMatches] = useState<Match[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const redirecting = useRef(false);

  useEffect(() => {
    if (profileLoading) return;
    if (!profile?.displayName && !redirecting.current) {
      redirecting.current = true;
      router.replace("/onboarding");
    }
  }, [profile, profileLoading, router]);

  useEffect(() => {
    if (!profile?.displayName) return;
    (async () => {
      try {
        const [docRes, matchRes] = await Promise.all([
          fetch("/api/documents"),
          fetch("/api/scholarships/match"),
        ]);
        const docJson = await docRes.json();
        const matchJson = await matchRes.json();

        if (docJson.success) {
          setDocs(
            (docJson.data ?? []).map((d: any, i: number) => ({
              id: d.id,
              name: d.fileName || d.documentType || `Document ${i + 1}`,
              score: d.reviews?.[0]?.score ?? null,
            }))
          );
        }

        if (matchJson.success) {
          setMatches(
            (matchJson.data ?? []).slice(0, 6).map((m: any) => {
              const s = m.scholarship;
              const days = s.deadline
                ? Math.ceil((new Date(s.deadline).getTime() - Date.now()) / 86_400_000)
                : null;
              return {
                id: s.id,
                nameEn: s.nameEn,
                nameAr: s.nameAr,
                country: s.country,
                deadlineType: s.deadlineType ?? null,
                daysLeft: days,
                fitScore: m.fitScore,
                dataCompleteness: m.dataCompleteness ?? 0,
              };
            })
          );
        }
      } catch {
        /* Empty states below cover the failure case. */
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  if (loading) return <DashboardSkeleton />;

  const upcoming = matches
    .filter((m) => m.daysLeft !== null && m.daysLeft > 0)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
    .slice(0, 3);

  const next = decideNextAction({ matches, docs, credits: credits ?? 0, num });

  return (
    <>
      <Nav />
      <main className="page-container py-8">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          {t("dash.greeting")}
          {profile?.displayName ? `، ${profile.displayName.split(" ")[0]}` : ""}
        </h1>

        {/* THE primary action. One per screen. */}
        <section className="mt-5">
          <NextActionCard action={next} />
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeader title={t("dash.matches")} href="/scholarships" />
            {matches.length === 0 ? (
              <EmptyState
                icon={Target}
                title={t("empty.noMatches.title")}
                body={t("empty.noMatches.body")}
                cta={t("empty.noMatches.cta")}
                href="/dashboard/profile"
              />
            ) : (
              <div className="mt-3 space-y-3">
                {matches.slice(0, 4).map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <SectionHeader title={t("dash.deadlines")} />
              {upcoming.length === 0 ? (
                <p className="mt-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  {pick(
                    "لا توجد مواعيد قريبة في منحك المطابقة.",
                    "No upcoming deadlines in your matches."
                  )}
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {upcoming.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/scholarships/${m.id}`}
                        className="card-raised flex items-center justify-between gap-3 p-3.5"
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-foreground">
                          {pick(m.nameAr, m.nameEn)}
                        </span>
                        <DeadlinePill days={m.daysLeft!} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <SectionHeader title={t("dash.documents")} href="/dashboard/documents" />
              {docs.length === 0 ? (
                <EmptyState
                  icon={Upload}
                  title={t("empty.noDocs.title")}
                  body={t("empty.noDocs.body")}
                  cta={t("empty.noDocs.cta")}
                  href="/dashboard/documents"
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {docs.slice(0, 4).map((d) => (
                    <li
                      key={d.id}
                      className="card-raised flex items-center justify-between gap-3 p-3.5"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm text-foreground">{d.name}</span>
                      </span>
                      {d.score !== null && <ScoreBadge score={d.score} />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------------- */
/* Next action                                                                */
/* ------------------------------------------------------------------------- */

type NextAction = {
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  ctaAr: string;
  ctaEn: string;
  href: string;
  urgent?: boolean;
};

/**
 * Picks the single most useful thing this student could do right now.
 *
 * Order matters: an imminent deadline beats everything else, because it's the
 * only item on the list that expires.
 */
function decideNextAction({
  matches,
  docs,
  credits,
  num,
}: {
  matches: Match[];
  docs: Doc[];
  credits: number;
  num: (n: number | string) => string;
}): NextAction {
  const urgent = matches.find((m) => m.daysLeft !== null && m.daysLeft > 0 && m.daysLeft <= 30);
  if (urgent) {
    return {
      titleAr: `موعد نهائي بعد ${num(urgent.daysLeft!)} يوماً`,
      titleEn: `A deadline in ${urgent.daysLeft} days`,
      bodyAr: `${urgent.nameAr} — ابدأ الآن، فالتحضير يستغرق أسابيع لا أياماً.`,
      bodyEn: `${urgent.nameEn} — start now. Preparation takes weeks, not days.`,
      ctaAr: "افتح المنحة",
      ctaEn: "Open scholarship",
      href: `/scholarships/${urgent.id}`,
      urgent: true,
    };
  }

  if (docs.length === 0) {
    return {
      titleAr: "ارفع سيرتك الذاتية",
      titleEn: "Upload your CV",
      bodyAr: "احصل على تقييم بدرجات وتحسينات محددة. أول مراجعة مجانية.",
      bodyEn: "Get a scored review with specific fixes. Your first review is free.",
      ctaAr: "ارفع مستنداً",
      ctaEn: "Upload a document",
      href: "/dashboard/documents",
    };
  }

  const unreviewed = docs.find((d) => d.score === null);
  if (unreviewed && credits > 0) {
    return {
      titleAr: "لديك مستند بلا مراجعة",
      titleEn: "You have an unreviewed document",
      bodyAr: `${unreviewed.name} — لديك ${num(credits)} رصيد. استخدمه.`,
      bodyEn: `${unreviewed.name} — you have ${credits} credit${credits === 1 ? "" : "s"}. Use one.`,
      ctaAr: "راجع الآن",
      ctaEn: "Review it now",
      href: "/dashboard/documents",
    };
  }

  const weak = docs.find((d) => d.score !== null && d.score < 7);
  if (weak) {
    return {
      titleAr: "حسّن أضعف مستنداتك",
      titleEn: "Improve your weakest document",
      bodyAr: `${weak.name} حصل على ${num(weak.score!)}/${num(10)}. راجع الملاحظات وارفع نسخة محسّنة.`,
      bodyEn: `${weak.name} scored ${weak.score}/10. Work through the feedback and upload a revision.`,
      ctaAr: "افتح المراجعة",
      ctaEn: "Open the review",
      href: "/dashboard/documents",
    };
  }

  if (matches.length === 0) {
    return {
      titleAr: "أكمل ملفك الشخصي",
      titleEn: "Complete your profile",
      bodyAr: "كلما اكتمل ملفك، كانت نتائج المطابقة أدق.",
      bodyEn: "The more complete your profile, the more accurate your matches.",
      ctaAr: "أكمل الملف",
      ctaEn: "Complete profile",
      href: "/dashboard/profile",
    };
  }

  return {
    titleAr: "تصفّح منحك المطابقة",
    titleEn: "Browse your matches",
    bodyAr: "مستنداتك في حالة جيدة. اختر منحة وابدأ التقديم.",
    bodyEn: "Your documents are in good shape. Pick a scholarship and start applying.",
    ctaAr: "اعرض المنح",
    ctaEn: "View scholarships",
    href: "/scholarships",
  };
}

function NextActionCard({ action }: { action: NextAction }) {
  const { pick, t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${
        action.urgent
          ? "border-[rgb(var(--accent-warm))]/40 bg-[rgb(var(--accent-warm))]/[0.07]"
          : "border-primary/30 bg-primary/[0.06]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            action.urgent
              ? "bg-[rgb(var(--accent-warm))]/15 text-[rgb(var(--accent-warm))]"
              : "bg-primary/15 text-primary"
          }`}
        >
          {action.urgent ? <AlertTriangle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{t("dash.nextStep")}</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
            {pick(action.titleAr, action.titleEn)}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {pick(action.bodyAr, action.bodyEn)}
          </p>
          <Link href={action.href} className="mt-4 inline-block">
            <button
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] ${
                action.urgent
                  ? "bg-[rgb(var(--accent-warm))] hover:opacity-90"
                  : "bg-primary hover:opacity-90"
              }`}
            >
              {pick(action.ctaAr, action.ctaEn)}
              <Arrow className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* ------------------------------------------------------------------------- */

const MatchRow = memo(function MatchRow({ match }: { match: Match }) {
  const { pick, num } = useLanguage();

  return (
    <Link href={`/scholarships/${match.id}`} className="card-raised block p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {pick(match.nameAr, match.nameEn)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{match.country}</p>
        </div>
        <span
          dir="ltr"
          style={{ unicodeBidi: "isolate" }}
          className="shrink-0 text-lg font-semibold text-primary"
        >
          {num(match.fitScore)}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${match.fitScore}%` }} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {match.daysLeft !== null && match.daysLeft > 0 ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {pick(`متبقٍ ${num(match.daysLeft)} يوماً`, `${match.daysLeft} days left`)}
          </span>
        ) : match.deadlineType === "ONGOING" ? (
          <span className="text-muted-foreground">
            {pick("مفتوحة باستمرار", "Rolling — always open")}
          </span>
        ) : (
          <span className="text-muted-foreground">
            {pick("الموعد غير محدد", "Deadline not listed")}
          </span>
        )}

        {/* Honest data signal — a thin scraped record shouldn't look as
            authoritative as a fully verified one. */}
        {match.dataCompleteness < 50 && (
          <span className="text-[rgb(var(--accent-warm))]">
            {pick("بيانات غير مكتملة", "Details incomplete")}
          </span>
        )}
      </div>
    </Link>
  );
});

function DeadlinePill({ days }: { days: number }) {
  const { num, pick } = useLanguage();
  const urgent = days <= 30;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
        urgent
          ? "bg-[rgb(var(--accent-warm))]/15 text-[rgb(var(--accent-warm))]"
          : "bg-primary/10 text-primary"
      }`}
    >
      {pick(`${num(days)} يوم`, `${days}d`)}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const { num } = useLanguage();
  const tone =
    score >= 8
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      : score >= 6
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  return (
    <span
      dir="ltr"
      style={{ unicodeBidi: "isolate" }}
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      {num(score)}/{num(10)}
    </span>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {href && (
        <Link href={href} className="text-xs font-medium text-primary hover:underline">
          {t("dash.viewAll")}
        </Link>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
  href,
}: {
  icon: typeof Upload;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-border bg-card p-6 text-center">
      <Icon className="mx-auto h-8 w-8 text-muted-foreground/50" />
      <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      <Link href={href} className="mt-4 inline-block">
        <button className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
          {cta}
        </button>
      </Link>
    </div>
  );
}

/** Skeleton mirrors the real layout so nothing jumps when data lands. */
function DashboardSkeleton() {
  return (
    <>
      <Nav />
      <main className="page-container animate-pulse py-8">
        <div className="h-8 w-56 rounded-lg bg-muted" />
        <div className="mt-5 h-40 rounded-2xl bg-muted" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <div className="h-5 w-40 rounded bg-muted" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-muted" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-5 w-32 rounded bg-muted" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
