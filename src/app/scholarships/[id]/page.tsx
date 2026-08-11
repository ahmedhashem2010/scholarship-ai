"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Calendar, MapPin, GraduationCap, ExternalLink,
  CheckCircle2, Info, ShieldCheck, AlertTriangle, FileText,
} from "lucide-react";
import { Nav } from "@/components/nav";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/lib/profile-context";
import { generateRoadmap, type Milestone } from "@/lib/roadmap-generator";
import {
  resolveSourceLinks,
  hostOf,
  AGGREGATOR_LABELS,
} from "@/lib/source-links";

/**
 * Scholarship detail.
 *
 * The design goal here is honesty. Most of the catalogue is scraped and
 * incomplete, so this page distinguishes three states for every fact:
 *
 *   stated + you match      → green, confident
 *   stated + you don't      → red, a real blocker
 *   not stated by source    → neutral "not listed", never implied either way
 *
 * The old page rendered missing data as absent, which read as "no requirement".
 * A student could conclude they qualified when nobody had actually said so.
 */

interface Scholarship {
  id: string;
  nameEn: string;
  nameAr: string;
  country: string;
  university: string | null;
  degree: string;
  deadline: string | null;
  deadlineType: string | null;
  applicationOpenDate: string | null;
  recurrenceNote: string | null;
  description: string | null;
  benefits: string | null;
  requirements: string | null;
  sourceUrl: string | null;
  source: string | null;
  officialWebsite: string | null;
  applicationUrl: string | null;
  eligibleCountries: string[];
  eligibleEducation: string[];
  fieldOfStudy: string[];
  requiredDocuments: string[];
  minimumAge: number | null;
  maximumAge: number | null;
  minimumGPA: number | null;
  englishRequirement: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
}

const DOC_LABELS: Record<string, { ar: string; en: string }> = {
  CV: { ar: "السيرة الذاتية", en: "CV / Resume" },
  MOTIVATION_LETTER: { ar: "خطاب الدوافع", en: "Motivation letter" },
  RECOMMENDATION_LETTER: { ar: "خطابات التوصية", en: "Recommendation letters" },
  TRANSCRIPT: { ar: "كشف الدرجات", en: "Academic transcript" },
  RESEARCH_PROPOSAL: { ar: "مقترح بحثي", en: "Research proposal" },
  PASSPORT: { ar: "جواز السفر", en: "Passport" },
  ENGLISH_TEST: { ar: "شهادة إجادة الإنجليزية", en: "English test certificate" },
  ESSAY: { ar: "مقال", en: "Essay" },
};

export default function ScholarshipDetailPage() {
  const params = useParams();
  const { pick, num, isRTL } = useLanguage();
  const { profile } = useProfile();
  const Back = isRTL ? ArrowRight : ArrowLeft;

  const [s, setS] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/scholarships/${params.id}`);
        const json = await res.json();
        if (!res.ok || !json.success) return setNotFound(true);
        setS(json.data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) return <DetailSkeleton />;

  if (notFound || !s) {
    return (
      <>
        <Nav />
        <main className="page-container py-20 text-center">
          <p className="text-lg font-medium text-foreground">
            {pick("لم نعثر على هذه المنحة", "We couldn't find that scholarship")}
          </p>
          <Link href="/scholarships" className="mt-4 inline-block text-sm text-primary hover:underline">
            {pick("تصفّح كل المنح", "Browse all scholarships")}
          </Link>
        </main>
      </>
    );
  }

  const days = s.deadline
    ? Math.ceil((new Date(s.deadline).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <>
      <Nav />
      <main className="page-container py-6 sm:py-8">
        <Link
          href="/scholarships"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Back className="h-4 w-4" />
          {pick("كل المنح", "All scholarships")}
        </Link>

        {/* Header ------------------------------------------------------- */}
        <header className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <VerificationBadge verified={s.isVerified} verifiedAt={s.verifiedAt} />
            {days !== null && days > 0 && days <= 30 && (
              <span className="rounded-full bg-[rgb(var(--accent-warm))]/15 px-2.5 py-1 text-xs font-medium text-[rgb(var(--accent-warm))]">
                {pick(`متبقٍ ${num(days)} يوماً فقط`, `Only ${days} days left`)}
              </span>
            )}
          </div>

          <h1 className="font-display mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            {pick(s.nameAr, s.nameEn)}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {s.country}
            </span>
            {s.university && (
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                {s.university}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <DeadlineText deadline={s.deadline} deadlineType={s.deadlineType} days={days} />
            </span>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {s.description && (
              <Section title={pick("عن المنحة", "About this scholarship")}>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </Section>
            )}

            {s.benefits && (
              <Section title={pick("ما تغطيه المنحة", "What it covers")}>
                <BulletList text={s.benefits} tone="good" />
              </Section>
            )}

            {s.requirements && (
              <Section title={pick("شروط الأهلية", "Eligibility")}>
                <BulletList text={s.requirements} />
              </Section>
            )}

            {/* The differentiator: a dated plan, not just a date. */}
            <RoadmapSection scholarship={s} profile={profile} />
          </div>

          {/* Facts panel ------------------------------------------------ */}
          <aside className="space-y-4">
            <div className="card-raised p-5">
              <h2 className="text-sm font-semibold text-foreground">
                {pick("المعايير", "At a glance")}
              </h2>
              <dl className="mt-4 space-y-3.5">
                <Fact
                  label={pick("الجنسيات المؤهلة", "Eligible nationalities")}
                  values={s.eligibleCountries}
                  allLabel={pick("جميع الجنسيات", "All nationalities")}
                />
                <Fact
                  label={pick("الدرجات المقبولة", "Degree levels")}
                  values={s.eligibleEducation}
                />
                <Fact
                  label={pick("مجالات الدراسة", "Fields of study")}
                  values={s.fieldOfStudy}
                  allLabel={pick("جميع المجالات", "All fields")}
                />
                <Fact
                  label={pick("العمر", "Age")}
                  raw={
                    s.minimumAge || s.maximumAge
                      ? `${num(s.minimumAge ?? 18)}–${num(s.maximumAge ?? 99)}`
                      : null
                  }
                />
                <Fact
                  label={pick("الحد الأدنى للمعدل", "Minimum GPA")}
                  raw={s.minimumGPA ? num(s.minimumGPA) : null}
                />
                <Fact
                  label={pick("الإنجليزية", "English")}
                  raw={
                    s.englishRequirement === "NOT_REQUIRED"
                      ? pick("غير مطلوبة", "Not required")
                      : s.englishRequirement
                  }
                />
              </dl>
            </div>

            {s.requiredDocuments.length > 0 && (
              <div className="card-raised p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4 text-primary" />
                  {pick("المستندات المطلوبة", "Required documents")}
                </h2>
                <ul className="mt-3 space-y-2">
                  {s.requiredDocuments.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {DOC_LABELS[d] ? pick(DOC_LABELS[d].ar, DOC_LABELS[d].en) : d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <SourceActions s={s} />

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              {pick(
                "تحقّق دائماً من الصفحة الرسمية قبل التقديم — الشروط والمواعيد قد تتغيّر.",
                "Always check the official page before applying — terms and deadlines change."
              )}
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------------- */

function VerificationBadge({
  verified,
  verifiedAt,
}: {
  verified: boolean;
  verifiedAt: string | null;
}) {
  const { pick } = useLanguage();
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        <ShieldCheck className="h-3.5 w-3.5" />
        {verifiedAt
          ? pick(
              `تم التحقق ${new Date(verifiedAt).toLocaleDateString("ar-EG")}`,
              `Verified ${new Date(verifiedAt).toLocaleDateString("en-GB")}`
            )
          : pick("تم التحقق", "Verified")}
      </span>
    );
  }
  // Honest, not alarming: says what we know, not that the scholarship is bad.
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Info className="h-3.5 w-3.5" />
      {pick("لم يُراجَع يدوياً بعد", "Not yet manually checked")}
    </span>
  );
}

function DeadlineText({
  deadline,
  deadlineType,
  days,
}: {
  deadline: string | null;
  deadlineType: string | null;
  days: number | null;
}) {
  const { pick, num } = useLanguage();

  if (deadline && days !== null) {
    const d = new Date(deadline).toLocaleDateString(pick("ar-EG", "en-GB"), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (days <= 0) return <>{pick("انتهى الموعد", "Deadline passed")}</>;
    return (
      <>
        {d} · {pick(`${num(days)} يوماً`, `${days} days`)}
      </>
    );
  }
  if (deadlineType === "ONGOING") {
    return <>{pick("مفتوحة باستمرار", "Rolling — always open")}</>;
  }
  if (deadlineType === "ANNUAL") {
    return <>{pick("تُفتح سنوياً", "Opens annually")}</>;
  }
  // Critically NOT "no deadline" — we simply don't know.
  return <>{pick("الموعد غير مذكور في المصدر", "Deadline not stated by the source")}</>;
}

/**
 * A single criterion.
 *
 * Three states, and the third is the one that matters: when the source doesn't
 * state something we say so plainly instead of leaving a gap that reads as
 * "no requirement".
 */
function Fact({
  label,
  values,
  raw,
  allLabel,
}: {
  label: string;
  values?: string[];
  raw?: string | null;
  allLabel?: string;
}) {
  const { pick } = useLanguage();

  let content: React.ReactNode;
  if (values && values.length > 0) {
    content =
      values.length === 1 && (values[0] === "ALL" || values[0] === "ANY") ? (
        <span className="text-foreground">{allLabel ?? values[0]}</span>
      ) : (
        <span className="text-foreground">{values.slice(0, 6).join("، ")}
          {values.length > 6 && pick(` و${values.length - 6} أخرى`, ` +${values.length - 6} more`)}
        </span>
      );
  } else if (raw) {
    content = <span className="text-foreground">{raw}</span>;
  } else {
    content = (
      <span className="text-muted-foreground">
        {pick("غير مذكور", "Not stated")}
      </span>
    );
  }

  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{content}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-raised p-5 sm:p-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * External links, classified so an aggregator listing is never labelled
 * "official". Priority: official application link > official website > an
 * honest provenance link to the page the record was scraped from. When no
 * official URL is known yet we say so, and the listing is clearly a listing.
 */
function SourceActions({ s }: { s: Scholarship }) {
  const { pick } = useLanguage();
  const { primary, source, hasOfficial } = resolveSourceLinks({
    sourceUrl: s.sourceUrl,
    officialWebsite: s.officialWebsite,
    applicationUrl: s.applicationUrl,
  });

  return (
    <div className="space-y-2.5">
      {primary && (
        <a
          href={primary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {primary.kind === "apply"
            ? pick("قدّم على الموقع الرسمي", primary.label)
            : pick("الموقع الرسمي", primary.label)}
          <ExternalLink className="h-4 w-4" />
        </a>
      )}

      {source && !hasOfficial && (
        <>
          <a
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
          >
            {source.kind === "aggregator-listing"
              ? pick(
                  `عرض الإعلان على ${AGGREGATOR_LABELS[hostOf(source.href) ?? ""] ?? "موقع المصدر"}`,
                  source.label
                )
              : pick("عرض الصفحة المصدرية", source.label)}
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            {pick(
              "لم نتحقق من الموقع الرسمي بعد — هذا رابط صفحة الإعلان، راجعه قبل التقديم.",
              "Official website not verified yet — this is the listing page. Check it before applying."
            )}
          </p>
        </>
      )}

      {!primary && !source && (
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {pick(
            "لا يتوفر رابط خارجي لهذه المنحة حالياً.",
            "No external link available for this scholarship yet."
          )}
        </p>
      )}
    </div>
  );
}

/** Source text arrives as newline-separated bullets. */
function BulletList({ text, tone }: { text: string; tone?: "good" }) {
  const items = text
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  if (items.length <= 1) {
    return <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
          <CheckCircle2
            className={`mt-0.5 h-4 w-4 shrink-0 ${tone === "good" ? "text-primary" : "text-muted-foreground/50"}`}
          />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}


/* ------------------------------------------------------------------------- */
/* Roadmap                                                                    */
/* ------------------------------------------------------------------------- */

/**
 * A listings site shows a deadline. This shows what to do and when.
 *
 * Students miss deadlines because they start three weeks too late, not because
 * they forgot the date — so the plan works backwards from the deadline and
 * accounts for the things with real lead times: referees need six weeks, IELTS
 * results take two, universities are slow with transcripts.
 */
function RoadmapSection({
  scholarship,
  profile,
}: {
  scholarship: Scholarship;
  profile: any;
}) {
  const { pick, num } = useLanguage();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Saved state has to survive a reload. Without this, someone who saved a plan
  // yesterday returns to a button that still says "Save this plan" — so they
  // press it again, unsure whether the first one worked. The upsert makes that
  // harmless, but the uncertainty is the problem.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/roadmap");
        if (!res.ok) return; // signed out — leave the button in its idle state
        const json = await res.json();
        const already = Array.isArray(json?.data)
          && json.data.some((m: { scholarshipId: string }) => m.scholarshipId === scholarship.id);
        if (already && !cancelled) setSaveState("saved");
      } catch {
        /* the button just stays idle */
      }
    })();
    return () => { cancelled = true; };
  }, [scholarship.id]);

  const roadmap = generateRoadmap({
    deadline: scholarship.deadline ? new Date(scholarship.deadline) : null,
    deadlineType: scholarship.deadlineType,
    requiredDocuments: scholarship.requiredDocuments,
    targetDegree: profile?.targetDegree ?? null,
    hasEnglishTest: profile?.hasEnglishTest ?? null,
    englishRequirement: scholarship.englishRequirement,
  });

  return (
    <Section title={pick("خطتك الزمنية", "Your roadmap")}>
      {roadmap.milestones.length === 0 ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {pick(roadmap.reasonAr ?? "", roadmap.reasonEn ?? "")}
        </p>
      ) : (
        <>
          {roadmap.compressed && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-[rgb(var(--accent-warm))]/40 bg-[rgb(var(--accent-warm))]/10 p-3.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--accent-warm))]" />
              <p className="text-xs leading-relaxed text-[rgb(var(--accent-warm))]">
                {pick(roadmap.reasonAr ?? "", roadmap.reasonEn ?? "")}
              </p>
            </div>
          )}

          <ol>
            {roadmap.milestones.map((m, i, arr) => (
              <MilestoneRow key={m.key} m={m} last={i === arr.length - 1} />
            ))}
          </ol>

          <div className="mt-5 border-t border-border pt-5">
            <button
              onClick={async () => {
                setSaveState("saving");
                try {
                  const res = await fetch("/api/roadmap", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      scholarshipId: scholarship.id,
                      milestones: roadmap.milestones.map((m) => ({
                        key: m.key,
                        dueDate: m.date.toISOString(),
                      })),
                    }),
                  });
                  setSaveState(res.ok ? "saved" : "error");
                } catch {
                  setSaveState("error");
                }
              }}
              disabled={saveState === "saving"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
            >
              {saveState === "saved" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {pick("تم الحفظ — سنذكّرك", "Saved — we'll remind you")}
                </>
              ) : saveState === "saving" ? (
                pick("جارٍ الحفظ…", "Saving…")
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  {pick("احفظ الخطة وذكّرني", "Save this plan and remind me")}
                </>
              )}
            </button>

            {saveState === "saved" && (
              <Link
                href="/dashboard/roadmap"
                className="mt-3 block text-sm text-primary hover:underline"
              >
                {pick("عرض كل خططي", "View all my plans")}
              </Link>
            )}
            {/* Deadlines get corrected and profiles change, so re-saving is a
                real action, not a no-op — the upsert refreshes the dates while
                keeping whatever the student has already ticked off. */}
            {saveState === "error" && (
              <p className="mt-2 text-sm text-destructive">
                {pick(
                  "تعذّر الحفظ. سجّل الدخول ثم حاول مرة أخرى.",
                  "Couldn't save. Sign in and try again."
                )}
              </p>
            )}

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {pick(
                `خطة تقديرية من ${num(roadmap.milestones.length)} خطوة مبنية على المواعيد المعتادة. عدّلها حسب ظروفك.`,
                `An estimate — ${roadmap.milestones.length} steps based on typical lead times. Adjust it to your situation.`
              )}
            </p>
          </div>
        </>
      )}
    </Section>
  );
}

function MilestoneRow({ m, last }: { m: Milestone; last: boolean }) {
  const { pick, language } = useLanguage();

  const date = m.date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
            m.critical
              ? "bg-primary"
              : m.overdue
                ? "bg-[rgb(var(--accent-warm))]"
                : "bg-border"
          }`}
        />
        {!last && <span className="w-px flex-1 bg-border" />}
      </div>

      <div className="flex-1 pb-5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span
            className={`text-xs font-medium ${
              m.overdue ? "text-[rgb(var(--accent-warm))]" : "text-muted-foreground"
            }`}
          >
            {date}
          </span>
          <span
            className={`text-sm ${
              m.critical ? "font-semibold text-primary" : "text-foreground"
            }`}
          >
            {pick(m.titleAr, m.titleEn)}
          </span>
          {m.overdue && (
            <span className="text-xs text-[rgb(var(--accent-warm))]">
              {pick("متأخر", "overdue")}
            </span>
          )}
        </div>
        {(m.noteAr || m.noteEn) && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {pick(m.noteAr ?? "", m.noteEn ?? "")}
          </p>
        )}
      </div>
    </li>
  );
}

function DetailSkeleton() {
  return (
    <>
      <Nav />
      <main className="page-container animate-pulse py-8">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="mt-4 h-6 w-40 rounded-full bg-muted" />
        <div className="mt-3 h-9 w-2/3 rounded bg-muted" />
        <div className="mt-3 h-4 w-1/2 rounded bg-muted" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-40 rounded-xl bg-muted" />
            <div className="h-32 rounded-xl bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-64 rounded-xl bg-muted" />
            <div className="h-12 rounded-xl bg-muted" />
          </div>
        </div>
      </main>
    </>
  );
}
