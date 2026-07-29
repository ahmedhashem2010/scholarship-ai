"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, ShieldCheck, Target,
  CalendarClock, ChevronDown, Sparkles,
} from "lucide-react";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND, VALUE_PROPS } from "@/lib/brand";
import { CREDIT_PACKAGES, formatEGP, FREE_CREDITS_ON_SIGNUP } from "@/lib/pricing";

/**
 * Landing page.
 *
 * Rebuilt from 569 lines. The old version led with "AI-Powered Scholarship
 * Platform" — that describes the technology, not what the student gets, and
 * every competitor says the same sentence.
 *
 * Order follows what a student needs in order to decide:
 *   hero → proof → how it works → why we're different → pricing → FAQ
 */
export default function Home() {
  const { t, pick, num, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <>
      <Nav />

      <main>
        {/* Hero ----------------------------------------------------------
            Deep teal band, not a white page. Large areas of brand colour are
            what stop a layout reading as "dry" — accents alone on white can be
            perfectly balanced and still feel cold.                          */}
        <section className="brand-band relative overflow-hidden">
          <div className="page-container relative pb-14 pt-24 sm:pb-20 sm:pt-28">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
              <div className="text-center lg:text-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/25 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  {pick("للطلاب العرب حول العالم", "For Arab students worldwide")}
                </span>

                <h1 className="font-display mt-6 text-[2rem] font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
                  {t("hero.headline")}
                </h1>

                <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg lg:mx-0">
                  {t("hero.sub")}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[rgb(var(--brand-deep))] shadow-lg transition hover:bg-white/90 active:scale-[0.98] sm:w-auto">
                      {t("hero.cta")}
                      <Arrow className="h-4 w-4" />
                    </button>
                  </Link>
                  <Link href="/scholarships" className="w-full sm:w-auto">
                    <button className="inline-flex w-full items-center justify-center rounded-xl border-2 border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98] sm:w-auto">
                      {t("hero.ctaSecondary")}
                    </button>
                  </Link>
                </div>

                <p className="mt-4 text-xs text-white/60">{t("hero.noCard")}</p>
              </div>

              <HeroPreview />
            </div>
          </div>
        </section>

        {/* Proof --------------------------------------------------------- */}
        <section className="border-b border-border bg-card">
          <div className="page-container py-10">
            <dl className="grid grid-cols-3 gap-4 text-center">
              <Stat value={num(200)} label={t("proof.scholarships")} plus />
              <Stat value={num(30)} label={t("proof.countries")} plus />
              <Stat
                value={pick("مجاناً", "Free")}
                label={pick("للبحث والمطابقة", "to search and match")}
              />
            </dl>
          </div>
        </section>

        {/* How it works -------------------------------------------------- */}
        <section className="page-container py-16 sm:py-20">
          <h2 className="font-display text-center text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("how.title")}
          </h2>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: Target, n: 1, title: t("how.step1.title"), body: t("how.step1.body") },
              { icon: ShieldCheck, n: 2, title: t("how.step2.title"), body: t("how.step2.body") },
              { icon: CalendarClock, n: 3, title: t("how.step3.title"), body: t("how.step3.body") },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <li key={step.n} className="card-raised p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {num(step.n)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Differentiator ------------------------------------------------ */}
        <section className="brand-band-soft border-y border-border">
          <div className="page-container py-16 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                {pick("لماذا هذه المنصة مختلفة", "Why this isn't just another listings site")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                {pick(
                  "مواقع المنح تعطيك قائمة. نحن نعطيك إجابة.",
                  "Scholarship sites give you a list. We give you an answer."
                )}
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {VALUE_PROPS.map((vp) => (
                <div key={vp.key} className="card-raised p-6">
                  <h3 className="text-base font-semibold text-foreground">
                    {pick(vp.titleAr, vp.titleEn)}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {pick(vp.bodyAr, vp.bodyEn)}
                  </p>
                </div>
              ))}
            </div>

            {/* Concrete beats abstract — show the roadmap, don't describe it */}
            <div className="card-raised mx-auto mt-12 max-w-2xl p-5 sm:p-7">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarClock className="h-4 w-4 text-primary" />
                {pick("مثال على خطتك الزمنية", "A sample roadmap")}
              </div>
              <ul className="mt-5">
                {ROADMAP_SAMPLE.map((row, i, arr) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          row.highlight ? "bg-primary" : "bg-border"
                        }`}
                      />
                      {i < arr.length - 1 && <span className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="flex-1 pb-5">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {pick(row.dAr, row.dEn)}
                        </span>
                        <span
                          className={`text-sm ${
                            row.highlight ? "font-semibold text-primary" : "text-foreground"
                          }`}
                        >
                          {pick(row.aAr, row.aEn)}
                        </span>
                      </div>
                      {(row.nAr || row.nEn) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {pick(row.nAr, row.nEn)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing ------------------------------------------------------- */}
        <section id="pricing" className="page-container py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("section.pricing")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              {t("section.pricingSub")}
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-xl border bg-card p-6 ${
                  pkg.popular ? "border-primary shadow-md" : "border-border"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 start-6 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    {pick("الأكثر اختياراً", "Most popular")}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-foreground">
                  {pick(pkg.nameAr, pkg.name)}
                </h3>
                {/* Currency is always LTR, even inside an RTL layout */}
                <p dir="ltr" className="mt-3 text-start text-3xl font-bold text-foreground rtl:text-end">
                  ${pkg.price}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">≈ {formatEGP(pkg.price)}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {num(pkg.credits)}{" "}
                  {pick(
                    pkg.credits > 2 ? "مراجعات" : "مراجعة",
                    `review${pkg.credits > 1 ? "s" : ""}`
                  )}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {(pick(pkg.featuresAr, pkg.features) as readonly string[])
                    .slice(0, 3)
                    .map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {pick(
              `كل حساب جديد يبدأ بـ ${num(FREE_CREDITS_ON_SIGNUP)} مراجعة مجانية.`,
              `Every new account starts with ${FREE_CREDITS_ON_SIGNUP} free review.`
            )}
          </p>
        </section>

        {/* FAQ ----------------------------------------------------------- */}
        <section className="border-t border-border bg-card">
          <div className="page-container py-16 sm:py-20">
            <h2 className="font-display text-center text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("section.faq")}
            </h2>
            <div className="mx-auto mt-8 max-w-2xl divide-y divide-border">
              {FAQS.map((f, i) => (
                <Faq key={i} q={pick(f.qAr, f.qEn)} a={pick(f.aAr, f.aEn)} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA ----------------------------------------------------- */}
        <section className="page-container py-16 text-center sm:py-20">
          <h2 className="font-display mx-auto max-w-xl text-2xl font-bold text-foreground sm:text-3xl">
            {pick("ابدأ الآن — الأمر يستغرق دقيقتين", "Start now — it takes two minutes")}
          </h2>
          <Link href="/auth/signup" className="mt-7 inline-block">
            <Button size="lg" className="gap-2">
              {t("hero.cta")}
              <Arrow className="h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}

/**
 * Sample match results. Showing the product's actual output does more work
 * than any amount of hero copy — a visitor sees a fit score and a deadline
 * countdown before they've signed up for anything.
 *
 * Deliberately real scholarship names, not lorem. If a student recognises
 * Chevening or DAAD, the whole page becomes credible.
 */
function HeroPreview() {
  const { pick, num } = useLanguage();

  const rows = [
    { nameAr: "منحة تشيفنينغ البريطانية", nameEn: "Chevening Scholarship", meta: pick("المملكة المتحدة · ماجستير", "United Kingdom · Master's"), score: 92, days: 34 },
    { nameAr: "منحة DAAD الألمانية", nameEn: "DAAD Scholarship", meta: pick("ألمانيا · ماجستير / دكتوراه", "Germany · Master's / PhD"), score: 78, days: 61 },
    { nameAr: "المنحة التركية", nameEn: "Türkiye Bursları", meta: pick("تركيا · بكالوريوس", "Turkey · Bachelor's"), score: 64, days: 12 },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between pb-3">
        <span className="text-sm font-medium text-foreground">
          {pick("أفضل المنح لك", "Your best matches")}
        </span>
        <span className="text-xs text-muted-foreground">
          {pick("محدَّث اليوم", "Updated today")}
        </span>
      </div>

      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.nameEn} className="rounded-xl border border-border p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {pick(r.nameAr, r.nameEn)}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.meta}</p>
              </div>
              <span
                dir="ltr"
                style={{ unicodeBidi: "isolate" }}
                className="shrink-0 text-lg font-semibold text-primary"
              >
                {num(r.score)}%
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${r.score}%` }} />
            </div>

            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              {pick(
                `متبقٍ ${num(r.days)} يوماً على الموعد النهائي`,
                `${r.days} days until the deadline`
              )}
            </p>
          </div>
        ))}
      </div>

      <p className="pt-3 text-center text-xs text-muted-foreground">
        {pick("مثال — سجّل لترى نتائجك أنت", "Sample — sign up to see your own")}
      </p>
    </div>
  );
}

function Stat({ value, label, plus }: { value: string; label: string; plus?: boolean }) {
  return (
    <div>
      {/* The "+" must follow the digits visually. Rendering {value}{"+"} in an
          RTL container flips it to "+٢٠٠"; an isolated LTR span keeps "٢٠٠+". */}
      <dd className="text-2xl font-semibold text-foreground sm:text-3xl">
        <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
          {value}
          {plus && "+"}
        </span>
      </dd>
      <dt className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</dt>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-start"
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{a}</p>}
    </div>
  );
}

function Footer() {
  const { pick } = useLanguage();
  return (
    <footer className="border-t border-border">
      <div className="page-container py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-start">
            <p className="text-sm font-semibold text-foreground">
              {pick(BRAND.nameAr, BRAND.name)}
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {pick(BRAND.descriptionAr, BRAND.description)}
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <Link href="/scholarships" className="hover:text-foreground">
              {pick("المنح", "Scholarships")}
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              {pick("الأسعار", "Pricing")}
            </Link>
            <Link href="/help" className="hover:text-foreground">
              {pick("المساعدة", "Help")}
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              {pick("الخصوصية", "Privacy")}
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              {pick("الشروط", "Terms")}
            </Link>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {pick(BRAND.nameAr, BRAND.name)}
        </p>
      </div>
    </footer>
  );
}

interface RoadmapSampleRow {
  dAr: string; dEn: string;
  aAr: string; aEn: string;
  nAr: string; nEn: string;
  /** Optional: only the final row is emphasised. */
  highlight?: boolean;
}

// Typed rather than `as const`: with `as const` TypeScript infers a union of
// five distinct object types, and `highlight` exists on only one of them, so
// `row.highlight` fails to compile even though it's valid at runtime.
const ROADMAP_SAMPLE: readonly RoadmapSampleRow[] = [
  { dAr: "١٥ نوفمبر", dEn: "15 Nov", aAr: "ابدأ التحضير للآيلتس", aEn: "Start IELTS prep", nAr: "قبل ١٢ أسبوعاً من الموعد", nEn: "12 weeks out" },
  { dAr: "٢٠ ديسمبر", dEn: "20 Dec", aAr: "أدِّ اختبار الآيلتس", aEn: "Take IELTS", nAr: "احجز قبل ١ ديسمبر", nEn: "book by 1 Dec" },
  { dAr: "٥ يناير", dEn: "5 Jan", aAr: "اطلب خطابات التوصية", aEn: "Request recommendation letters", nAr: "امنح أساتذتك ٦ أسابيع", nEn: "give referees 6 weeks" },
  { dAr: "١٥ يناير", dEn: "15 Jan", aAr: "اكتب مسودة خطاب الدوافع", aEn: "Draft your personal statement", nAr: "", nEn: "" },
  { dAr: "٨ مارس", dEn: "8 Mar", aAr: "قدّم الطلب", aEn: "Submit", nAr: "قبل أسبوع من الموعد النهائي", nEn: "a week before the deadline", highlight: true },
];

/**
 * FAQ content.
 *
 * Replace these with the real questions you collect from the Arabic scholarship
 * Facebook groups. Real questions convert better than invented ones, and
 * they're free keyword research for SEO.
 */
const FAQS = [
  {
    qAr: "هل المنصة مجانية؟",
    qEn: "Is it free?",
    aAr: "البحث عن المنح ونسبة التطابق والخطة الزمنية مجانية بالكامل ودائماً. تدفع فقط إذا أردت مراجعة مفصّلة لمستنداتك، وكل حساب جديد يحصل على مراجعة مجانية أولى.",
    aEn: "Searching, fit scores and roadmaps are completely free, always. You only pay if you want a detailed review of your documents — and every new account gets one free review.",
  },
  {
    qAr: "هل توجد منح لا تتطلب الآيلتس أو التوفل؟",
    qEn: "Are there scholarships that don't require IELTS or TOEFL?",
    aAr: "نعم، وكثيرة. منح حكومية في ألمانيا وتركيا والصين ومصر لا تشترط اختبار إنجليزية، أو تقبل خطاباً من جامعتك بدلاً منه. يمكنك تصفية النتائج لعرض هذه المنح فقط.",
    aEn: "Yes, plenty. Government scholarships in Germany, Turkey, China and Egypt often don't require an English test, or accept a letter from your university instead. You can filter to show only these.",
  },
  {
    qAr: "كيف تُحسب نسبة التطابق؟",
    qEn: "How is the fit score calculated?",
    aAr: "نقارن ملفك — الجنسية والدرجة العلمية والتخصص والمعدل والعمر ومستوى الإنجليزية — بشروط كل منحة، ونوضح لك سبب كل نتيجة. وإذا كانت معلومة غير مذكورة في المصدر، نقول ذلك صراحةً بدلاً من التخمين.",
    aEn: "We compare your profile — nationality, degree, field, GPA, age, English level — against each scholarship's stated criteria, and show you the reasoning. Where the source doesn't state something, we say so rather than guessing.",
  },
  {
    qAr: "هل تضمنون الحصول على المنحة؟",
    qEn: "Do you guarantee I'll get a scholarship?",
    aAr: "لا، ولا يستطيع أحد أن يضمن ذلك بصدق. ما نفعله هو توفير وقتك بعدم إضاعته على منح لست مؤهلاً لها أصلاً، ومساعدتك على تقديم طلب أقوى في المنح المناسبة.",
    aEn: "No, and nobody honestly can. What we do is save you from wasting time on scholarships you were never eligible for, and help you submit a stronger application to the ones that do fit.",
  },
  {
    qAr: "كيف أدفع من مصر؟",
    qEn: "How do I pay from Egypt?",
    aAr: "فودافون كاش أو إنستاباي أو تحويل بنكي. ترسل لنا صورة إيصال التحويل ونضيف رصيدك يدوياً — عادةً خلال ساعات. الدفع بالبطاقة متاح أيضاً في بعض الدول.",
    aEn: "Vodafone Cash, InstaPay or bank transfer. Send us a screenshot of the transfer and we add your credits manually — usually within a few hours. Card payment is available in some countries too.",
  },
  {
    qAr: "من أين تأتي بيانات المنح؟",
    qEn: "Where does your scholarship data come from?",
    aAr: "من الصفحات الرسمية للجهات المانحة، ونضع رابط المصدر مع كل منحة لتتحقق بنفسك. نراجع البيانات دورياً ونعرض تاريخ آخر تحقق. وإن وجدت خطأً، أبلغنا وسنصححه.",
    aEn: "From the providers' own official pages, and we link the source on every listing so you can check for yourself. We re-verify regularly and show when each was last checked. Found an error? Tell us and we'll fix it.",
  },
] as const;
