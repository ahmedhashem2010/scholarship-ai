"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Target,
  FileText,
  Sparkles,
  Clock,
  CalendarDays,
  MapPin,
  GraduationCap,
  Medal,
  FileCheck,
  Star,
  Rocket,
  ArrowUpRight,
  Trophy,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useProfile } from "@/lib/profile-context";
import { CountUp } from "@/components/dashboard/count-up";
import { ThreeDObject } from "@/components/landing/three-d";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

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
  createdAt: string;
}

interface Application {
  id: string;
  scholarshipId: string;
  status: string;
  progress: number;
  updatedAt: string;
  scholarship: { nameEn: string; nameAr: string; country: string } | null;
  documents: { documentType: string; status: string }[];
}

function greeting(isRTL: boolean): string {
  const h = new Date().getHours();
  if (h < 12) return isRTL ? "صباح الخير" : "Good morning";
  if (h < 17) return isRTL ? "مساء الخير" : "Good afternoon";
  return isRTL ? "مساء الخير" : "Good evening";
}

function timeAgo(ts: number, isRTL: boolean, num: (n: number | string) => string): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return isRTL ? "الآن" : "just now";
  if (m < 60) return isRTL ? `قبل ${num(m)} دقيقة` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return isRTL ? `قبل ${num(h)} ساعة` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d <= 1) return isRTL ? "أمس" : "yesterday";
  return isRTL ? `قبل ${num(d)} يوم` : `${d}d ago`;
}

function fitColor(score: number): string {
  if (score >= 80) return "text-[rgb(var(--success))]";
  if (score >= 60) return "text-secondary-700 dark:text-secondary-400";
  return "text-muted-foreground";
}

/* ------------------------------------------------------------------ */

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted/80", className)} />;
}

function SectionHeader({
  eyebrow,
  title,
  href,
  hrefLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  const { pick } = useLanguage();
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary-700 dark:text-secondary-400">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary-700 transition-colors hover:text-primary-900 dark:text-primary-300 dark:hover:text-primary-200"
        >
          {hrefLabel ?? pick("عرض الكل", "View all")}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  caption,
  value,
  decimals = 0,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  caption: string;
  value: number;
  decimals?: number;
  loading?: boolean;
}) {
  const { isRTL } = useLanguage();
  return (
    <div
      className="dash-scale-in rounded-2xl border border-border bg-card p-4 shadow-[0_14px_36px_-18px_rgb(22_44_76_/_0.35)] sm:p-5"
      style={{ "--dash-delay": "80ms" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-500/12 text-secondary-700 dark:text-secondary-400">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      {loading ? (
        <>
          <SkeletonBlock className="mt-4 h-9 w-16" />
          <SkeletonBlock className="mt-2 h-3 w-24" />
        </>
      ) : (
        <>
          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <CountUp value={value} decimals={decimals} locale={isRTL ? "ar-EG" : "en-US"} />
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{caption}</p>
        </>
      )}
    </div>
  );
}

function MiniCard({
  icon: Icon,
  value,
  label,
  tone = "white",
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  tone?: "gold" | "white";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_16px_36px_-16px_rgb(22_44_76_/_0.35)]",
        tone === "gold"
          ? "border border-secondary-500/40 bg-gradient-to-br from-[#f6e7bd] to-[#e7cb85] text-[#162C4C]"
          : "border border-border bg-card text-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          tone === "gold" ? "bg-[#162C4C]/10" : "bg-secondary-500/12 text-secondary-700 dark:text-secondary-400"
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight">{value}</p>
        <p className="truncate text-[11px] font-medium opacity-75">{label}</p>
      </div>
    </div>
  );
}

function JourneyHero({
  firstName,
  matchCount,
  bestFit,
  docsReady,
  docsTotal,
  nextDeadline,
  loading,
}: {
  firstName: string;
  matchCount: number;
  bestFit: number | null;
  docsReady: number;
  docsTotal: number;
  nextDeadline: Match | null;
  loading: boolean;
}) {
  const { pick, num } = useLanguage();
  const floating: {
    icon: React.ElementType;
    value: string;
    label: string;
    tone: "gold" | "white";
    className: string;
    tilt: number;
  }[] = [
    {
      icon: Target,
      value:
        bestFit !== null
          ? `${num(Math.round(bestFit))}% ${pick("تطابق", "match")}`
          : pick("لا توجد نتائج بعد", "No matches yet"),
      label: pick("أفضل خيار لك", "Your top pick"),
      tone: "gold",
      className: "-top-7 -start-4",
      tilt: -3,
    },
    {
      icon: Clock,
      value: nextDeadline
        ? pick(`${num(nextDeadline.daysLeft!)} يوم متبقي`, `${nextDeadline.daysLeft}d left`)
        : pick("لا مواعيد قادمة", "No deadlines"),
      label: nextDeadline
        ? pick("الموعد الأقرب", "Next deadline")
        : pick("بحث محفوظ", "Saved search"),
      tone: "white",
      className: "-top-8 -end-4",
      tilt: 3,
    },
    {
      icon: FileCheck,
      value: `${num(docsReady)}/${num(docsTotal)} ${pick("جاهز", "ready")}`,
      label: pick("المستندات", "Documents"),
      tone: "white",
      className: "bottom-14 -start-6",
      tilt: -2,
    },
    {
      icon: Sparkles,
      value:
        matchCount > 0
          ? `${num(matchCount)} ${pick("منحة متطابقة", "matches")}`
          : pick("احصل على تطابق", "Get matched"),
      label: pick("منسّقة لك بالذكاء الاصطناعي", "AI curated for you"),
      tone: "white",
      className: "-bottom-8 -end-5",
      tilt: 2,
    },
  ];

  return (
    <section className="relative" style={{ marginTop: "3.5rem", marginBottom: "4.5rem" }}>
      {/* Floating composition — desktop only. Sits on top of the navy panel
          edges, layered like cards on a table. */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {floating.map((c) => (
          <div
            key={c.label}
            className={cn("dash-float absolute z-10 w-52", c.className)}
            style={{ "--dash-tilt": `${c.tilt}deg` } as React.CSSProperties}
          >
            <MiniCard icon={c.icon} value={c.value} label={c.label} tone={c.tone} />
          </div>
        ))}
      </div>

      <div className="dash-journey dash-breathe relative overflow-hidden rounded-3xl">
        {/* Decorative 2.5D globe, low opacity, bottom-start corner */}
        <div className="pointer-events-none absolute -bottom-10 -start-8 h-52 w-52 opacity-[0.16]">
          <ThreeDObject variant="globe" />
        </div>
        <div className="pointer-events-none absolute -top-14 -end-14 h-64 w-64 opacity-[0.10]">
          <ThreeDObject variant="cap" />
        </div>

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary-300">
              <Sparkles className="h-3.5 w-3.5" />
              {pick("رحلتك مع المنح", "Your scholarship journey")}
            </p>
            <h1 className="mt-4 max-w-xl text-2xl font-bold leading-tight text-white sm:text-[2rem] sm:leading-[1.2]">
              {loading
                ? pick("نبحث عن المنح المناسبة لك…", "Finding the right scholarships for you…")
                : pick(
                    `حوّل حلمك إلى طلب منحة، ${firstName || "طالب"}.`,
                    `Turn your dream into an application, ${firstName || "student"}.`
                  )}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
              {loading
                ? pick(
                    "نطابق ملفك مع مئات المنح الموثقة.",
                    "We're matching your profile against hundreds of verified scholarships."
                  )
                : matchCount > 0
                  ? pick(
                      `طابقنا ${num(matchCount)} منحة مع ملفك. خطوتك التالية بضغطة واحدة.`,
                      `We matched ${matchCount} scholarships to your profile. Your next move is one click away.`
                    )
                  : pick(
                      "أكمل ملفك الشخصي وسنطابق لك مئات المنح الموثقة.",
                      "Complete your profile and we'll match hundreds of verified scholarships to you."
                    )}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/scholarships/matches"
                className="inline-flex items-center gap-2 rounded-xl bg-secondary-500 px-5 py-3 text-sm font-semibold text-[#162C4C] shadow-[0_12px_28px_-10px_rgb(198_161_75_/_0.65)] transition hover:bg-secondary-400"
              >
                {pick("استكشف تطابقاتي", "Explore my matches")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Compact stats inside the panel — mobile gets these instead of the
                floating cards. */}
            <div className="mt-7 grid max-w-lg grid-cols-3 gap-3 border-t border-white/15 pt-5">
              {[
                { label: pick("التطابقات", "Matches"), value: loading ? "…" : num(matchCount) },
                {
                  label: pick("مستندات جاهزة", "Docs ready"),
                  value: loading ? "…" : `${num(docsReady)}/${num(docsTotal)}`,
                },
                {
                  label: pick("أفضل تطابق", "Best fit"),
                  value: loading ? "…" : bestFit !== null ? `${num(Math.round(bestFit))}%` : "—",
                },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold tabular-nums text-secondary-200">{s.value}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Big fit ring — desktop accent */}
          <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-3">
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 176 176" className="h-full w-full -rotate-90">
                <circle cx="88" cy="88" r="76" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="12" />
                {!loading && bestFit !== null && (
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    fill="none"
                    stroke="#c6a14b"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 76}
                    strokeDashoffset={2 * Math.PI * 76 * (1 - bestFit / 100)}
                    className="transition-all duration-1000 ease-out"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {loading ? (
                  <SkeletonBlock className="h-10 w-20" />
                ) : (
                  <>
                    <p className="text-4xl font-bold tabular-nums text-white">
                      {bestFit !== null ? num(Math.round(bestFit)) : "—"}
                      <span className="text-xl text-white/60">%</span>
                    </p>
                    <p className="mt-1 text-xs font-medium text-secondary-300">
                      {pick("أفضل تطابق", "top match fit")}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile chips — static grid instead of floating (no overlap on small
          screens). Hidden on lg where the floating cards take over. */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:hidden">
        {floating.map((c) => (
          <MiniCard key={c.label} icon={c.icon} value={c.value} label={c.label} tone={c.tone} />
        ))}
      </div>
    </section>
  );
}

function RecommendedCard({ match, index }: { match: Match; index: number }) {
  const { pick, num } = useLanguage();
  const pct = Math.round(match.fitScore);
  return (
    <Link
      href={`/scholarships/${match.id}`}
      className="dash-scale-in group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-[0_14px_34px_-18px_rgb(22_44_76_/_0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-18px_rgb(22_44_76_/_0.42)]"
      style={{ "--dash-delay": `${index * 90}ms` } as React.CSSProperties}
    >
      <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-500/12 text-secondary-700 dark:text-secondary-400 sm:flex">
        <GraduationCap className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{pick(match.nameAr, match.nameEn)}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {match.country}
          {match.daysLeft !== null && (
            <span className="inline-flex items-center gap-1 text-secondary-700 dark:text-secondary-400">
              · <Clock className="h-3 w-3" />{" "}
              {pick(`${num(match.daysLeft)} يوم متبقي`, `${match.daysLeft}d left`)}
            </span>
          )}
        </p>
        <div className="mt-2 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "dash-grow h-full rounded-full",
              pct >= 80
                ? "bg-gradient-to-r from-secondary-500 to-secondary-300"
                : "bg-gradient-to-r from-primary-500 to-primary-300"
            )}
            style={{ "--dash-delay": `${200 + index * 90}ms` } as React.CSSProperties}
          />
        </div>
      </div>
      <div className="shrink-0 text-end">
        <p className={cn("text-2xl font-bold tabular-nums", fitColor(pct))}>{num(pct)}%</p>
        <p className="text-[11px] font-medium text-muted-foreground">
          {pick("نسبة التطابق", "fit score")}
        </p>
      </div>
    </Link>
  );
}

function DeadlineRow({ match }: { match: Match }) {
  const { pick, num } = useLanguage();
  return (
    <Link
      href={`/scholarships/${match.id}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-secondary-500/40"
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-[#162C4C]",
          match.daysLeft !== null && match.daysLeft <= 14
            ? "bg-gradient-to-br from-[#f0d88e] to-[#d5b45c]"
            : "bg-secondary-500/12 text-secondary-700 dark:text-secondary-400"
        )}
      >
        {match.daysLeft !== null ? (
          <>
            <span className="text-base font-bold leading-none tabular-nums">{num(match.daysLeft)}</span>
            <span className="text-[9px] font-semibold uppercase leading-none">{pick("يوم", "days")}</span>
          </>
        ) : (
          <Clock className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary-700">
          {pick(match.nameAr, match.nameEn)}
        </p>
        <p className="text-xs text-muted-foreground">{match.country}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
    </Link>
  );
}

function AppProgressRow({ app }: { app: Application }) {
  const { pick, num } = useLanguage();
  const pct = Math.min(Math.max(app.progress || 0, 0), 100);

  // Orphaned application (its scholarship was deleted in the MVP freeze).
  // Render a safe card instead of crashing on app.scholarship.nameEn.
  if (!app.scholarship) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-muted-foreground">
            {pick("المنحة لم تعد متاحة", "Scholarship no longer available")}
          </p>
          <StatusBadge status={app.status} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {pick("أُزيلت هذه المنحة من قائمة المنح.", "This scholarship was removed from the catalog.")}
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/dashboard/applications/${app.scholarshipId}`}
      className="group rounded-xl border border-border bg-card p-4 transition hover:border-secondary-500/40"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-foreground">
          {pick(app.scholarship.nameAr, app.scholarship.nameEn)}
        </p>
        <StatusBadge status={app.status} />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "dash-grow h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
          )}
          style={{ "--dash-delay": "150ms" } as React.CSSProperties}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{pick(`${num(pct)}% مكتمل`, `${pct}% complete`)}</span>
        <span className="inline-flex items-center gap-1 text-secondary-700 dark:text-secondary-400">
          {pick("متابعة", "Continue")} <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function AchievementTile({
  icon: Icon,
  label,
  hint,
  locked,
}: {
  icon: React.ElementType;
  label: string;
  hint: string;
  locked: boolean;
}) {
  const { pick } = useLanguage();
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition",
        locked && "opacity-55 grayscale-[0.4]"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          locked
            ? "bg-muted text-muted-foreground"
            : "bg-gradient-to-br from-[#f0d88e] to-[#d5b45c] text-[#162C4C] shadow-[0_10px_22px_-8px_rgb(198_161_75_/_0.6)]"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {locked ? hint : `${hint} · ${pick("مفتوح", "unlocked")}`}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const router = useRouter();
  const { pick, num, isRTL } = useLanguage();
  const { profile, isLoading: profileLoading, hasProfile } = useProfile();

  const [matches, setMatches] = useState<Match[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const redirecting = useRef(false);

  // Only redirect when the API *confirmed* there is no profile. A profile that
  // failed to load (hasProfile === undefined) must never bounce the student
  // into onboarding — that turns a slow DB into an onboarding loop.
  useEffect(() => {
    if (profileLoading) return;
    if (hasProfile === false && !redirecting.current) {
      redirecting.current = true;
      router.replace("/onboarding");
    }
  }, [hasProfile, profileLoading, router]);

  useEffect(() => {
    if (!profile?.displayName) return;
    let cancelled = false;

    (async () => {
      try {
        const [docRes, matchRes, appRes] = await Promise.all([
          fetch("/api/documents"),
          fetch("/api/scholarships/match"),
          fetch("/api/applications"),
        ]);
        const [docJson, matchJson, appJson] = await Promise.all([
          docRes.json(),
          matchRes.json(),
          appRes.json(),
        ]);

        if (cancelled) return;

        if (docJson.success) {
          setDocs(
            (docJson.data ?? []).map((d: any) => ({
              id: d.id,
              name: d.fileName || d.documentType || pick("مستند", "Document"),
              score: d.reviews?.[0]?.score ?? null,
              createdAt: d.createdAt ?? "",
            }))
          );
        }

        if (matchJson.success) {
          setMatches(
            (matchJson.data ?? [])
              .filter((m: any) => m.isEligible !== false)
              .slice(0, 6)
              .map((m: any) => {
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
              .sort((a: Match, b: Match) => b.fitScore - a.fitScore)
          );
        }

        if (appJson.success) {
          setApps((appJson.data ?? []).slice(0, 3));
        }
      } catch {
        /* Empty states cover the failure case. */
      } finally {
        if (!cancelled) setSectionsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  const firstName = profile?.displayName?.split(" ")[0] ?? "";
  const bestFit = matches.length > 0 ? matches[0]!.fitScore : null;
  const docsReady = docs.filter((d) => d.score !== null).length;
  const upcoming = useMemo(
    () =>
      matches
        .filter((m) => m.daysLeft !== null && m.daysLeft > 0)
        .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0)),
    [matches]
  );
  const nextDeadline = upcoming[0] ?? null;

  const avgScore = useMemo(() => {
    const scored = docs.filter((d) => d.score !== null) as (Doc & { score: number })[];
    if (scored.length === 0) return 0;
    return scored.reduce((sum, d) => sum + d.score, 0) / scored.length;
  }, [docs]);

  const achievements = useMemo(
    () => [
      {
        icon: FileCheck,
        label: pick("ملف جاهز", "Profile ready"),
        hint: pick("أخبرنا عن أهدافك", "Tell us about your goals"),
        unlocked: !!(profile?.displayName && profile?.country),
      },
      {
        icon: Target,
        label: pick("تم التطابق", "Matched"),
        hint: pick("اعثر على أول منحك", "Find your first matches"),
        unlocked: matches.length > 0,
      },
      {
        icon: Sparkles,
        label: pick("أول مراجعة ذكاء اصطناعي", "First AI review"),
        hint: pick("احصل على تقييم لمستند", "Get a document scored"),
        unlocked: docs.some((d) => d.score !== null),
      },
      {
        icon: Rocket,
        label: pick("على المسار", "On track"),
        hint: pick("أكمل ٥٠٪ من طلب", "Reach 50% on an application"),
        unlocked: apps.some((a) => a.progress >= 50),
      },
      {
        icon: Medal,
        label: pick("صائد المواعيد", "Deadline hunter"),
        hint: pick("تابع موعداً قادماً", "Track an upcoming deadline"),
        unlocked: upcoming.length > 0,
      },
      {
        icon: Star,
        label: pick("تقييم ٨+", "8+ scorer"),
        hint: pick("احصل على ٨/١٠ في مراجعة", "Score 8/10 on a review"),
        unlocked: docs.some((d) => (d.score ?? 0) >= 8),
      },
    ],
    [profile, matches, docs, apps, upcoming, pick, isRTL]
  );

  const activities = useMemo(() => {
    const events: { id: string; icon: React.ElementType; title: string; time: number }[] = [];
    for (const app of apps) {
      events.push({
        id: `app-${app.id}`,
        icon: FileText,
        title: pick(
          `بدأت طلباً لـ ${app.scholarship?.nameAr ?? "منحة أُزيلت"}`,
          `Started application for ${app.scholarship?.nameEn ?? "a removed scholarship"}`
        ),
        time: new Date(app.updatedAt).getTime(),
      });
    }
    for (const doc of docs) {
      events.push({
        id: `doc-${doc.id}`,
        icon: FileCheck,
        title: pick(`رفعت ${doc.name}`, `Uploaded ${doc.name}`),
        time: doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now(),
      });
      if (doc.score !== null) {
        events.push({
          id: `rev-${doc.id}`,
          icon: Sparkles,
          title: pick(
            `مراجعة الذكاء الاصطناعي: ${num(doc.score.toFixed(1))}/10`,
            `AI review scored ${doc.score.toFixed(1)}/10`
          ),
          time: doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now(),
        });
      }
    }
    if (matches.length > 0) {
      events.push({
        id: "match-ready",
        icon: Target,
        title: pick(
          `${num(matches.length)} منحة مخصصة جاهزة`,
          `${matches.length} personalized matches ready`
        ),
        time: Date.now(),
      });
    }
    return events.sort((a, b) => b.time - a.time).slice(0, 5);
  }, [apps, docs, matches, pick, num, isRTL]);

  return (
    <div className="space-y-12">
      {/* Welcome --------------------------------------------------------- */}
      <section className="dash-in">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary-700 dark:text-secondary-400">
              <CalendarDays className="me-1 inline h-3.5 w-3.5" />
              {new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {greeting(isRTL)}, {profileLoading ? "…" : firstName || pick("طالب", "student")}.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {sectionsLoading
                ? pick("جارٍ تحميل ملخصك الشخصي…", "Loading your personalized summary…")
                : upcoming.length > 0
                  ? pick(
                      `أمامك ${num(upcoming.length)} موعد نهائي و${num(matches.length)} منحة منسّقة.`,
                      `You have ${upcoming.length} deadline${upcoming.length === 1 ? "" : "s"} ahead and ${matches.length} curated matches.`
                    )
                  : pick(
                      `لديك ${num(matches.length)} منحة منسّقة جاهزة.`,
                      `You have ${matches.length} curated matches ready.`
                    )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/documents"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-secondary-500/40"
            >
              <FileText className="h-4 w-4 text-secondary-700 dark:text-secondary-400" />
              {pick("ارفع مستنداً", "Upload document")}
            </Link>
          </div>
        </div>
      </section>

      {/* Floating hero ---------------------------------------------------- */}
      <JourneyHero
        firstName={firstName}
        matchCount={matches.length}
        bestFit={bestFit}
        docsReady={docsReady}
        docsTotal={docs.length}
        nextDeadline={nextDeadline}
        loading={sectionsLoading}
      />

      {/* Cozy statistics --------------------------------------------------- */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label={pick("منح منسّقة", "Curated matches")}
          caption={pick("مطابقة لملفك", "matched to your profile")}
          value={matches.length}
          loading={sectionsLoading}
        />
        <StatCard
          icon={FileCheck}
          label={pick("المستندات", "Documents")}
          caption={pick(
            `${num(docs.length)} مرفوع · ${num(docsReady)} مراجع`,
            `${docs.length} uploaded · ${docsReady} reviewed`
          )}
          value={docs.length}
          loading={sectionsLoading}
        />
        <StatCard
          icon={Sparkles}
          label={pick("متوسط تقييم الذكاء الاصطناعي", "Avg AI review")}
          caption={pick("أحدث درجات المستندات", "latest document scores")}
          value={avgScore}
          decimals={1}
          loading={sectionsLoading}
        />
        <StatCard
          icon={Clock}
          label={pick("المواعيد القادمة", "Deadlines ahead")}
          caption={
            upcoming[0]
              ? pick(`الأقرب خلال ${num(upcoming[0].daysLeft!)} يوم`, `soonest in ${upcoming[0].daysLeft} days`)
              : pick("لا شيء عاجل", "nothing urgent")
          }
          value={upcoming.length}
          loading={sectionsLoading}
        />
      </section>

      {/* Main grid --------------------------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-8 lg:col-span-2">
          {/* Recommended */}
          <section>
            <SectionHeader
              eyebrow={pick("موصى بها", "Recommended")}
              title={pick("أفضل المنح لك", "Your best matches")}
              href="/scholarships/matches"
            />
            <div className="mt-4 space-y-3">
              {sectionsLoading ? (
                [0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-[86px]" />)
              ) : matches.length === 0 ? (
                <div className="dash-scale-in rounded-2xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
                  <Target className="mx-auto h-8 w-8 text-secondary-500" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {pick("لا توجد نتائج بعد", "No matches yet")}
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    {pick(
                      "أكمل ملفك الشخصي وسنقيم مئات المنح مقابله خلال ثوانٍ.",
                      "Complete your profile and we will score hundreds of scholarships against it in seconds."
                    )}
                  </p>
                  <Link
                    href="/dashboard/profile"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-700"
                  >
                    {pick("أكمل ملفي", "Complete my profile")}
                  </Link>
                </div>
              ) : (
                matches.slice(0, 3).map((m, i) => <RecommendedCard key={m.id} match={m} index={i} />)
              )}
            </div>
          </section>

          {/* Application progress */}
          <section>
            <SectionHeader
              eyebrow={pick("التقدم", "Progress")}
              title={pick("طلباتي", "My applications")}
              href="/dashboard/applications"
              hrefLabel={pick("كل الطلبات", "All applications")}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {sectionsLoading ? (
                [0, 1].map((i) => <SkeletonBlock key={i} className="h-[96px]" />)
              ) : apps.length === 0 ? (
                <div className="dash-scale-in col-span-full rounded-2xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
                  <Trophy className="mx-auto h-8 w-8 text-secondary-500" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {pick("لا توجد طلبات بدأت بعد", "No applications started yet")}
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    {pick(
                      "اختر منحة مطابقة وابدأ طلبك الأول — سنتتبع مستنداتك ونبقيك على الموعد.",
                      "Pick a match and start your first application — we will track your documents and keep you on schedule."
                    )}
                  </p>
                  <Link
                    href="/scholarships"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-700"
                  >
                    {pick("تصفّح المنح", "Browse scholarships")}
                  </Link>
                </div>
              ) : (
                apps.map((app) => <AppProgressRow key={app.id} app={app} />)
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-8">
          {/* Deadlines */}
          <section>
            <SectionHeader
              eyebrow={pick("الأقرب أولاً", "Soonest first")}
              title={pick("أقرب المواعيد", "Upcoming deadlines")}
            />
            <div className="mt-4 space-y-2.5">
              {sectionsLoading ? (
                [0, 1, 2].map((i) => <SkeletonBlock key={i} className="h-[68px]" />)
              ) : upcoming.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 text-center">
                  <Clock className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {pick("لا توجد مواعيد قادمة", "No deadlines ahead")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pick("ستظهر مواعيد منحك المطابقة هنا.", "Deadlines from your matches will appear here.")}
                  </p>
                </div>
              ) : (
                upcoming.slice(0, 3).map((m) => <DeadlineRow key={m.id} match={m} />)
              )}
            </div>
          </section>

          {/* AI Coach */}
          {/* Achievements */}
          <section>
            <SectionHeader
              eyebrow={pick("الشارات", "Badges")}
              title={pick("الإنجازات", "Achievements")}
            />
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {achievements.map((a) => (
                <AchievementTile key={a.label} icon={a.icon} label={a.label} hint={a.hint} locked={!a.unlocked} />
              ))}
            </div>
          </section>

          {/* Recent activity */}
          <section>
            <SectionHeader
              eyebrow={pick("الأحدث", "Latest")}
              title={pick("النشاط الأخير", "Recent activity")}
            />
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              {sectionsLoading ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <SkeletonBlock className="h-9 w-9 rounded-full" />
                      <div className="flex-1">
                        <SkeletonBlock className="h-3 w-3/4" />
                        <SkeletonBlock className="mt-1.5 h-2.5 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  {pick(
                    "سيظهر نشاطك هنا أثناء استكشافك.",
                    "Your activity will show up here as you explore."
                  )}
                </p>
              ) : (
                <ol className="relative space-y-5 before:absolute before:inset-y-1 before:start-[17px] before:w-px before:bg-border">
                  {activities.map((a) => {
                    const Icon = a.icon;
                    return (
                      <li key={a.id} className="relative flex items-start gap-3">
                        <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-secondary-500/30 bg-secondary-500/10 text-secondary-700 dark:text-secondary-400">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 pt-1">
                          <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo(a.time, isRTL, num)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom CTA -------------------------------------------------------- */}
      {!sectionsLoading && matches.length === 0 && docs.length === 0 && (
        <section className="dash-journey dash-scale-in relative overflow-hidden rounded-3xl p-8 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary-400/70 to-transparent" />
          <Sparkles className="mx-auto h-8 w-8 text-secondary-300" />
          <h2 className="mt-3 text-xl font-bold text-white">
            {pick("منحتك تبدأ من هنا", "Your scholarship starts here")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
            {pick(
              "أكمل ملفك لفتح المنح المطابقة ومراجعات المستندات وخطة زمنية خطوة بخطوة.",
              "Set up your profile to unlock curated matches, document reviews and a step-by-step roadmap."
            )}
          </p>
          <Link
            href="/dashboard/profile"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-secondary-500 px-5 py-3 text-sm font-semibold text-[#162C4C] transition hover:bg-secondary-400"
          >
            <CheckCircle2 className="h-4 w-4" />
            {pick("أكمل ملفي", "Complete my profile")}
          </Link>
        </section>
      )}
    </div>
  );
}
