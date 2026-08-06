"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, CalendarClock, Check,
  ChevronDown, FileCheck2, Flag, Globe, GraduationCap, MapPin, MessageSquare,
  Quote, Route, ScanSearch, ShieldCheck, Sparkles, Star, Target, User, UserCheck,
  Wallet, X,
} from "lucide-react";
import { Nav } from "@/components/nav";
import { Reveal } from "@/components/landing/reveal";
import { HeroShowcase } from "@/components/landing/hero-showcase";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND } from "@/lib/brand";

/**
 * Landing page (v3) — complete rebuild.
 *
 * Eleven sections, told in the order a student needs to decide:
 *   hero → proof → how it works → AI features → showcase → why → success →
 *   FAQ → final CTA → footer.
 *
 * Rules honoured here:
 *   - No backend, auth, payment or routing changes — every CTA points at an
 *     existing route (/auth/signup, /auth/login, /scholarships, /pricing).
 *   - Brand colours only: navy, gold, white and very light gray. All mode-
 *     aware surfaces use the CSS-variable tokens; the navy hero and the
 *     app screenshot are deliberately mode-independent (see globals.css).
 *   - Arabic-first content, English default. All copy flows through t()/pick()
 *     so a rename or translation edit lives in one file.
 */
export default function Home() {
  const { t, pick, num, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const stats = [
    { icon: GraduationCap, value: 250, plus: true, suffix: "", label: t("stats.scholarships") },
    { icon: Globe, value: 120, plus: true, suffix: "", label: t("stats.countries") },
    { icon: Target, value: 95, plus: false, suffix: "%", label: t("stats.accuracy") },
    { icon: FileCheck2, value: 4000, plus: true, suffix: "", label: t("stats.reviewed") },
  ];

  return (
    <>
      <Nav />

      <main>
        {/* 1. Hero ------------------------------------------------------- */}
        <section className="hero-band relative overflow-hidden">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 start-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-secondary-500/20 blur-[120px] rtl:translate-x-1/2"
          />

          <div className="page-container relative pb-20 pt-28 sm:pb-24 sm:pt-32">
            <div className="grid items-center gap-16 lg:grid-cols-[1.02fr_1fr] lg:gap-14">
              <div className="text-center lg:text-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-secondary-300" />
                  {t("hero.badge")}
                </span>

                <h1 className="font-display mt-6 text-[2.75rem] font-bold tracking-tight text-white sm:text-6xl lg:text-[4rem]">
                  {t("hero.hl1")}{" "}
                  <span className="text-gold-on-navy">{t("hero.hl2")}</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg lg:mx-0">
                  {t("hero.sub")}
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                  <Link
                    href="/auth/signup"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-7 py-3.5 text-sm font-semibold text-secondary-foreground shadow-[0_12px_32px_-12px_rgb(198_161_75/0.6)] transition-all hover:bg-secondary-600 hover:shadow-[0_16px_40px_-12px_rgb(198_161_75/0.7)] active:scale-[0.98]"
                  >
                    {t("hero.cta")}
                    <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                  <Link
                    href="/scholarships"
                    className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 active:scale-[0.98]"
                  >
                    {t("hero.ctaSecondary")}
                  </Link>
                </div>

                <p className="mt-4 text-xs text-white/60">{t("hero.noCard")}</p>

                <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/70 lg:justify-start">
                  {[
                    { icon: Check, label: t("hero.trust1") },
                    { icon: BadgeCheck, label: t("hero.trust2") },
                    { icon: ShieldCheck, label: t("hero.trust3") },
                  ].map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-secondary-300" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative">
                <HeroShowcase />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Trusted by students — stats --------------------------------- */}
        <section className="border-y border-border bg-card">
          <div className="page-container py-14 sm:py-16">
            <Reveal>
              <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-secondary-600">
                {t("stats.overline")}
              </p>
              <h2 className="font-display mt-3 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t("stats.title")}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
                {t("stats.sub")}
              </p>
            </Reveal>

            <Reveal delay={120}>
              <dl className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-10 text-center lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700 ring-1 ring-inset ring-secondary-100">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <dd className="mt-3 text-3xl font-bold tabular-nums text-foreground sm:text-4xl">
                      <StatValue value={s.value} suffix={s.suffix} plus={s.plus} />
                    </dd>
                    <dt className="mt-1.5 text-sm text-muted-foreground">{s.label}</dt>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* 3. How it works — five-step timeline ---------------------------- */}
        <section id="how-it-works" className="bg-background">
          <div className="page-container py-20 sm:py-24">
            <Reveal>
              <SectionHead overline={t("how.overline")} title={t("how.title")} sub={t("how.sub")} />
            </Reveal>

            <div className="relative mt-14">
              <div
                aria-hidden="true"
                className="absolute inset-x-12 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
              />
              <div role="list" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
                {STEPS.map((step, i) => (
                  <Reveal
                    key={step.key}
                    delay={i * 90}
                    className={i === STEPS.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""}
                  >
                    <div role="listitem" className="relative flex gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                      {i < STEPS.length - 1 && (
                        <span
                          aria-hidden="true"
                          className="absolute start-[23px] top-11 h-[calc(100%-2.5rem)] w-px bg-border lg:hidden"
                        />
                      )}
                      <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-secondary-200 bg-card shadow-sm">
                        <step.icon className="h-5 w-5 text-secondary-700" />
                      </div>
                      <div className="lg:mt-5">
                        <span className="text-xs font-bold uppercase tracking-widest text-secondary-600">
                          {num(i + 1)}
                        </span>
                        <h3 className="mt-1 text-base font-semibold text-foreground">
                          {t(`how.s${i + 1}.title`)}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {t(`how.s${i + 1}.body`)}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. AI features — bento cards ----------------------------------- */}
        <section id="features" className="border-y border-border bg-muted/40">
          <div className="page-container py-20 sm:py-24">
            <Reveal>
              <SectionHead overline={t("feat.overline")} title={t("feat.title")} sub={t("feat.sub")} />
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <Reveal key={f.key} delay={(i % 3) * 90} className={f.wide ? "lg:col-span-2" : ""}>
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-secondary-300 hover:shadow-elevated">
                    <div
                      aria-hidden="true"
                      className="absolute -top-16 -end-16 h-40 w-40 rounded-full bg-secondary-100/60 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                    />
                    <div className="relative flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700 ring-1 ring-inset ring-secondary-100 transition-transform duration-300 group-hover:scale-110">
                        <f.icon className="h-5 w-5" />
                      </span>
                      {f.wide && (
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-secondary-600 rtl:group-hover:-translate-x-0.5" />
                      )}
                    </div>
                    <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-foreground">
                      {pick(f.titleAr, f.titleEn)}
                    </h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                      {pick(f.descAr, f.descEn)}
                    </p>
                    <FeatureVisual type={f.visual} />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Scholarship showcase ----------------------------------------- */}
        <section className="bg-background">
          <div className="page-container py-20 sm:py-24">
            <Reveal>
              <SectionHead overline={t("show.overline")} title={t("show.title")} sub={t("show.sub")} />
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SHOWCASE.map((s, i) => (
                <Reveal key={s.nameEn} delay={(i % 3) * 90}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-secondary-300 hover:shadow-elevated">
                    <div className="flex items-start justify-between gap-3 p-6 pb-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
                          {s.monogram}
                        </span>
                        <div>
                          <h3 className="font-semibold text-foreground">{pick(s.nameAr, s.nameEn)}</h3>
                          <p className="text-xs text-muted-foreground">{pick(s.orgAr, s.orgEn)}</p>
                        </div>
                      </div>
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary-50 px-2.5 py-1 text-xs font-bold text-secondary-700 ring-1 ring-inset ring-secondary-200"
                        dir="ltr"
                      >
                        <Sparkles className="h-3 w-3" />
                        {num(s.match)}%
                      </span>
                    </div>

                    <dl className="mt-5 space-y-2.5 px-6">
                      {[
                        { icon: MapPin, label: pick(s.countryAr, s.countryEn) },
                        { icon: GraduationCap, label: pick(s.degreeAr, s.degreeEn) },
                        { icon: Wallet, label: pick(s.fundingAr, s.fundingEn) },
                        { icon: CalendarClock, label: s.deadline },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                          <m.icon className="h-4 w-4 shrink-0 text-secondary-600" />
                          <span className="truncate">{m.label}</span>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-6 border-t border-border p-6 pt-4">
                      <Link
                        href="/scholarships"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:bg-secondary-600 active:scale-[0.98]"
                      >
                        {t("show.apply")}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <div className="mt-10 text-center">
                <Link
                  href="/scholarships"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {t("show.viewAll")}
                  <Arrow className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 6. Why SmartScholar — comparison --------------------------------- */}
        <section className="border-y border-border bg-muted/40">
          <div className="page-container py-20 sm:py-24">
            <Reveal>
              <SectionHead overline={t("why.overline")} title={t("why.title")} sub={t("why.sub")} />
            </Reveal>

            <div className="relative mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-2 lg:gap-8">
              <Reveal>
                <div className="h-full rounded-2xl border border-border bg-card p-7 sm:p-8">
                  <h3 className="flex items-center gap-2.5 text-base font-semibold text-muted-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <X className="h-4 w-4" />
                    </span>
                    {t("why.oldTitle")}
                  </h3>
                  <ul className="mt-6 space-y-4">
                    {OLD_WAY.map((row) => (
                      <li key={row.en} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger-50 text-danger-500">
                          <X className="h-3 w-3" />
                        </span>
                        <span className="text-sm leading-relaxed text-muted-foreground">
                          {pick(row.ar, row.en)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <div
                aria-hidden="true"
                className="absolute start-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:flex rtl:translate-x-1/2"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-500 text-sm font-bold text-secondary-foreground shadow-lg ring-4 ring-background">
                  VS
                </span>
              </div>

              <Reveal delay={120}>
                <div className="relative h-full overflow-hidden rounded-2xl border-2 border-secondary-300 bg-card p-7 shadow-elevated sm:p-8">
                  <div aria-hidden="true" className="absolute -top-20 -end-20 h-52 w-52 rounded-full bg-secondary-100/70 blur-3xl" />
                  <h3 className="relative flex items-center gap-2.5 text-base font-semibold text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-500 text-secondary-foreground">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    {t("why.newTitle")}
                  </h3>
                  <ul className="relative mt-6 space-y-4">
                    {NEW_WAY.map((row) => (
                      <li key={row.en} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-700 ring-1 ring-inset ring-secondary-200">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-sm font-medium leading-relaxed text-foreground">
                          {pick(row.ar, row.en)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="relative mt-7">
                    <Link
                      href="/auth/signup"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-700 active:scale-[0.98] sm:w-auto"
                    >
                      {t("common.getStarted")}
                      <Arrow className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 7. Student success — testimonials -------------------------------- */}
        <section className="bg-background">
          <div className="page-container py-20 sm:py-24">
            <Reveal>
              <SectionHead overline={t("testi.overline")} title={t("testi.title")} sub={t("testi.sub")} />
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((item, i) => (
                <Reveal key={item.nameEn} delay={i * 90}>
                  <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5" aria-label="5 out of 5">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className="h-4 w-4 fill-secondary-500 text-secondary-500" />
                        ))}
                      </div>
                      <Quote className="h-7 w-7 text-secondary-200" />
                    </div>
                    <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-foreground">
                      {pick(item.quoteAr, item.quoteEn)}
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {item.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {pick(item.nameAr, item.nameEn)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {pick(item.roleAr, item.roleEn)}
                        </p>
                      </div>
                      <span className="ms-auto shrink-0 rounded-full bg-secondary-50 px-2.5 py-1 text-[11px] font-semibold text-secondary-700 ring-1 ring-inset ring-secondary-200">
                        {pick(item.tagAr, item.tagEn)}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 8. FAQ ----------------------------------------------------------- */}
        <section className="border-t border-border bg-muted/40">
          <div className="page-container py-20 sm:py-24">
            <Reveal>
              <SectionHead overline={t("faq.overline")} title={t("faq.title")} sub={t("faq.sub")} />
            </Reveal>

            <Reveal delay={100}>
              <div className="mx-auto mt-10 max-w-3xl space-y-3">
                {FAQS.map((f, i) => (
                  <FaqItem key={f.qEn} q={pick(f.qAr, f.qEn)} a={pick(f.aAr, f.aEn)} defaultOpen={i === 0} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* 9. Final CTA ------------------------------------------------------ */}
        <section className="page-container py-20 sm:py-24">
          <Reveal>
            <div className="hero-band relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-16 sm:py-20">
              <div className="hero-grid absolute inset-0" aria-hidden="true" />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary-500/20 blur-[100px] rtl:translate-x-1/2"
              />
              <div className="relative">
                <h2 className="font-display mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {t("cta.title")}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80">{t("cta.sub")}</p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/auth/signup"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-8 py-4 text-sm font-semibold text-secondary-foreground shadow-[0_12px_32px_-12px_rgb(198_161_75/0.6)] transition-all hover:bg-secondary-600 active:scale-[0.98]"
                  >
                    {t("hero.cta")}
                    <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                  </Link>
                  <Link
                    href="/scholarships"
                    className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 active:scale-[0.98]"
                  >
                    {t("hero.ctaSecondary")}
                  </Link>
                </div>
                <p className="mt-5 text-xs text-white/60">{t("cta.note")}</p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </>
  );
}

/* ---------------------------------------------------------------------------
   Sub-components
--------------------------------------------------------------------------- */

/** Animated stat number — counts up when scrolled into view. */
function StatValue({ value, suffix = "", plus = false }: { value: number; suffix?: string; plus?: boolean }) {
  const { num } = useLanguage();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        obs.disconnect();
        const duration = 1400;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(Math.round(value * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} dir="ltr" style={{ unicodeBidi: "isolate" }}>
      {num(display)}
      {plus && "+"}
      {suffix && <span className="text-secondary-600">{suffix}</span>}
    </span>
  );
}

function SectionHead({ overline, title, sub }: { overline: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary-600">{overline}</p>
      <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Mini product visual that sits inside each feature card. */
function FeatureVisual({ type }: { type: string }) {
  const { pick, num } = useLanguage();

  switch (type) {
    case "matches":
      return (
        <div className="relative mt-6 space-y-2.5">
          {[
            { n: pick("تشيفنينغ", "Chevening"), pct: 92 },
            { n: pick("إيراسموس موندوس", "Erasmus Mundus"), pct: 87 },
          ].map((m) => (
            <div key={m.n} className="rounded-xl border border-border bg-muted/50 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{m.n}</span>
                <span className="font-bold text-secondary-700">{num(m.pct)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-secondary-500" style={{ width: `${m.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      );

    case "chat":
      return (
        <div className="relative mt-6 space-y-2">
          <div className="ms-auto w-fit max-w-[88%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground">
            {pick("هل أنا مؤهل لمنحة DAAD؟", "Am I eligible for DAAD?")}
          </div>
          <div className="flex w-fit max-w-[88%] items-start gap-2 rounded-2xl rounded-tl-md border border-border bg-muted/50 px-3.5 py-2 text-xs text-foreground">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary-600" />
            <span>{pick("نعم — تطابق ٧٨٪. ينقصك خطاب توصية واحد فقط.", "Yes — 78% fit. You're one recommendation letter away.")}</span>
          </div>
        </div>
      );

    case "docs":
      return (
        <div className="relative mt-6 rounded-xl border border-border bg-muted/50 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">{pick("خطاب الدوافع", "Personal statement")}</span>
            <span className="text-sm font-bold text-secondary-700">
              8.6<span className="text-[10px] font-medium text-muted-foreground">/10</span>
            </span>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[86%] rounded-full bg-secondary-500" />
          </div>
          <p className="mt-2.5 text-[11px] text-muted-foreground">
            {pick("٣ تحسينات مقترحة — مرتبة بالأولوية", "3 improvements — prioritised for you")}
          </p>
        </div>
      );

    case "roadmap": {
      const items = [
        { a: pick("آيلتس", "IELTS"), n: 1 },
        { a: pick("التوصيات", "Letters"), n: 2 },
        { a: pick("المسودة", "Draft"), n: 3 },
        { a: pick("التقديم", "Submit"), n: 4 },
      ];
      return (
        <div className="relative mt-6 flex items-start">
          {items.map((s, i) => (
            <Fragment key={s.a}>
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                    i === items.length - 1
                      ? "bg-secondary-500 text-secondary-foreground"
                      : "bg-secondary-50 text-secondary-700 ring-1 ring-inset ring-secondary-200"
                  }`}
                >
                  {num(s.n)}
                </span>
                <span className="text-[10px] text-muted-foreground">{s.a}</span>
              </div>
              {i < items.length - 1 && (
                <div className="mt-3 h-px flex-1 bg-gradient-to-r from-secondary-200 to-border" />
              )}
            </Fragment>
          ))}
        </div>
      );
    }

    case "deadlines":
      return (
        <div className="relative mt-6 space-y-2">
          {[
            { n: pick("تشيفنينغ", "Chevening"), d: 6, tone: "bg-danger-500" },
            { n: pick("إيراسموس", "Erasmus"), d: 15, tone: "bg-warning-500" },
            { n: pick("DAAD", "DAAD"), d: 61, tone: "bg-success-500" },
          ].map((m) => (
            <div key={m.n} className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-xs">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <span className={`h-2 w-2 rounded-full ${m.tone}`} />
                {m.n}
              </span>
              <span className="text-muted-foreground">
                {num(m.d)} {pick("يوم", "days")}
              </span>
            </div>
          ))}
        </div>
      );

    case "profile":
      return (
        <div className="relative mt-6 flex flex-wrap gap-2">
          {[pick("القاهرة", "Cairo"), pick("هندسة", "Engineering"), "GPA 3.4", "IELTS 7.0"].map((c) => (
            <span key={c} className="rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] font-medium text-foreground">
              {c}
            </span>
          ))}
          <span className="flex items-center gap-1.5 rounded-full bg-secondary-50 px-3 py-1 text-[11px] font-semibold text-secondary-700 ring-1 ring-inset ring-secondary-200">
            <Sparkles className="h-3 w-3" />
            {pick("جاهز للمطابقة", "Ready to match")}
          </span>
        </div>
      );

    default:
      return null;
  }
}

/** Accordion item with a smooth height animation. */
function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-card transition-colors ${
        open ? "border-secondary-300 shadow-soft" : "border-border"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start sm:px-6"
      >
        <span className="text-sm font-semibold text-foreground sm:text-base">{q}</span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
            open ? "bg-secondary-500 text-secondary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">{a}</p>
        </div>
      </div>
    </div>
  );
}

function BrandMark() {
  const { pick } = useLanguage();
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold text-foreground">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white ring-1 ring-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-mark.svg" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
      </span>
      <span className="whitespace-nowrap text-[15px] tracking-tight">{pick(BRAND.nameAr, BRAND.name)}</span>
    </Link>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-foreground">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  const { pick, t } = useLanguage();
  const socials = ["foot.social.x", "foot.social.instagram", "foot.social.linkedin", "foot.social.youtube"];

  return (
    <footer className="border-t border-border bg-card">
      <div className="page-container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <BrandMark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{t("foot.about")}</p>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("foot.social")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {socials.map((key) => (
                  <a
                    key={key}
                    href="#"
                    className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-secondary-300 hover:text-foreground"
                  >
                    {t(key)}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <FooterCol
            title={t("foot.resources")}
            links={[
              { href: "/scholarships", label: t("foot.resource.browse") },
              { href: "/pricing", label: t("foot.resource.pricing") },
              { href: "/help", label: t("foot.resource.help") },
              { href: "/glossary", label: t("foot.resource.glossary") },
            ]}
          />
          <FooterCol
            title={t("foot.scholarships")}
            links={[
              { href: "/scholarships", label: t("foot.sch.chevening") },
              { href: "/scholarships", label: t("foot.sch.daad") },
              { href: "/scholarships", label: t("foot.sch.fulbright") },
              { href: "/scholarships", label: t("foot.sch.erasmus") },
            ]}
          />
          <FooterCol
            title={t("foot.tools")}
            links={[
              { href: "/auth/signup", label: t("foot.tool.matching") },
              { href: "/auth/signup", label: t("foot.tool.review") },
              { href: "/auth/signup", label: t("foot.tool.roadmap") },
              { href: "/auth/signup", label: t("foot.tool.chat") },
            ]}
          />
          <FooterCol
            title={t("foot.contact")}
            links={[
              { href: `mailto:${BRAND.supportEmail}`, label: t("foot.contact.email") },
              { href: "/privacy", label: t("foot.contact.privacy") },
              { href: "/terms", label: t("foot.contact.terms") },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {pick(BRAND.nameAr, BRAND.name)}. {t("foot.rights")}.
          </p>
          <p dir="ltr" className="text-xs text-muted-foreground">
            {BRAND.domain}
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------------------
   Content
--------------------------------------------------------------------------- */

const STEPS = [
  { key: "profile", icon: User },
  { key: "match", icon: ScanSearch },
  { key: "review", icon: FileCheck2 },
  { key: "roadmap", icon: Route },
  { key: "submit", icon: Flag },
];

const FEATURES = [
  {
    key: "matching",
    icon: ScanSearch,
    wide: true,
    visual: "matches",
    titleAr: "مطابقة ذكية للمنح",
    titleEn: "AI scholarship matching",
    descAr: "نقارن ملفك بشروط كل منحة — الجنسية، الدرجة، المعدل، العمر، الإنجليزية — ونعرض نسبة تطابق مع سبب لكل نتيجة.",
    descEn: "We compare your profile against every scholarship's stated criteria and give you a fit score with a clear reason for each one.",
  },
  {
    key: "chat",
    icon: MessageSquare,
    wide: false,
    visual: "chat",
    titleAr: "مساعد ذكي على مدار الساعة",
    titleEn: "AI chat assistant",
    descAr: "اسأل عن أي منحة أو متطلب، وستحصل على إجابة دقيقة مبنية على بيانات المنح الفعلية.",
    descEn: "Ask about any scholarship or requirement and get precise answers grounded in our real scholarship data.",
  },
  {
    key: "docs",
    icon: FileCheck2,
    wide: false,
    visual: "docs",
    titleAr: "مراجعة المستندات",
    titleEn: "AI document review",
    descAr: "ارفع سيرتك أو خطاب الدوافع واحصل على درجة وملاحظات محددة ومرتبة حسب الأولوية.",
    descEn: "Upload your CV or personal statement and get a score with specific, prioritised feedback.",
  },
  {
    key: "roadmap",
    icon: Route,
    wide: true,
    visual: "roadmap",
    titleAr: "خطة التقديم الزمنية",
    titleEn: "Application roadmap",
    descAr: "نحسب المواعيد بالعكس من آخر موعد للتقديم: متى تحجز الاختبار، تطلب التوصيات، وتكتب مسودتك.",
    descEn: "We work backwards from each deadline: when to book your test, request letters, and start drafting.",
  },
  {
    key: "deadlines",
    icon: CalendarClock,
    wide: false,
    visual: "deadlines",
    titleAr: "تتبع المواعيد النهائية",
    titleEn: "Deadline tracking",
    descAr: "لا تفوّت فرصة مجدداً — نبّهك قبل كل موعد نهائي مع عداد تنازلي لكل منحة.",
    descEn: "Never miss a window again — reminders before every deadline with a live countdown for each scholarship.",
  },
  {
    key: "profile",
    icon: UserCheck,
    wide: true,
    visual: "profile",
    titleAr: "تحليل الملف الشخصي",
    titleEn: "Profile analysis",
    descAr: "ملفك يتحول إلى خطة: نحدد نقاط قوتك والفجوات التي قد تمنعك من التقديم لمنحة معينة.",
    descEn: "Your profile becomes a plan: we surface your strengths and the gaps blocking you from a given scholarship.",
  },
];

const SHOWCASE = [
  {
    monogram: "OX",
    nameAr: "أكسفورد", nameEn: "Oxford",
    orgAr: "صندوق كلارندون", orgEn: "Clarendon Fund",
    countryAr: "المملكة المتحدة", countryEn: "United Kingdom",
    degreeAr: "ماجستير / دكتوراه", degreeEn: "Master's / PhD",
    fundingAr: "رسوم كاملة + معيشة", fundingEn: "Full tuition + living costs",
    deadline: "Jan 2027",
    match: 84,
  },
  {
    monogram: "CH",
    nameAr: "تشيفنينغ", nameEn: "Chevening",
    orgAr: "الحكومة البريطانية", orgEn: "UK Government",
    countryAr: "المملكة المتحدة", countryEn: "United Kingdom",
    degreeAr: "ماجستير", degreeEn: "Master's",
    fundingAr: "كل التكاليف + بدل", fundingEn: "Full cost + stipend",
    deadline: "6 Nov 2026",
    match: 92,
  },
  {
    monogram: "DA",
    nameAr: "DAAD", nameEn: "DAAD",
    orgAr: "ألمانيا", orgEn: "Germany",
    countryAr: "ألمانيا", countryEn: "Germany",
    degreeAr: "ماجستير / دكتوراه", degreeEn: "Master's / PhD",
    fundingAr: "تمويل كامل", fundingEn: "Full funding",
    deadline: "31 Oct 2026",
    match: 78,
  },
  {
    monogram: "FB",
    nameAr: "فولبرايت", nameEn: "Fulbright",
    orgAr: "الولايات المتحدة", orgEn: "United States",
    countryAr: "الولايات المتحدة", countryEn: "United States",
    degreeAr: "ماجستير / دكتوراه", degreeEn: "Master's / PhD",
    fundingAr: "كل التكاليف + سفر", fundingEn: "Full cost + flights",
    deadline: "8 Oct 2026",
    match: 71,
  },
  {
    monogram: "EM",
    nameAr: "إيراسموس موندوس", nameEn: "Erasmus Mundus",
    orgAr: "الاتحاد الأوروبي", orgEn: "European Union",
    countryAr: "أوروبا", countryEn: "Europe",
    degreeAr: "ماجستير", degreeEn: "Master's",
    fundingAr: "منحة كاملة", fundingEn: "Full scholarship",
    deadline: "15 Jan 2027",
    match: 87,
  },
  {
    monogram: "TB",
    nameAr: "المنح التركية", nameEn: "Türkiye Bursları",
    orgAr: "تركيا", orgEn: "Turkey",
    countryAr: "تركيا", countryEn: "Turkey",
    degreeAr: "بكالوريوس / ماجستير", degreeEn: "Bachelor's / Master's",
    fundingAr: "رسوم + سكن + بدل", fundingEn: "Tuition + housing + stipend",
    deadline: "20 Feb 2027",
    match: 64,
  },
];

const OLD_WAY = [
  { ar: "تصفّح مئات القوائم الطويلة دون أي فلترة لملفك", en: "Scroll endless listings with no filtering for your profile" },
  { ar: "تقدّم ثم تكتشف لاحقاً أنك غير مؤهل", en: "Apply, then find out you were ineligible afterwards" },
  { ar: "مواعيد نهائية متناثرة في جداول لا يقرأها أحد", en: "Deadlines scattered across spreadsheets nobody reads" },
  { ar: "لا تعرف ماذا تحسّن في مستنداتك", en: "No idea what to fix in your documents" },
  { ar: "بيانات قديمة من مصادر غير موثوقة", en: "Outdated data from unverified sources" },
];

const NEW_WAY = [
  { ar: "منح تناسب ملفك فعلاً، بدرجة تطابق وسبب لكل نتيجة", en: "Scholarships that truly fit, scored with a reason each" },
  { ar: "اعرف فرصك قبل أن تبدأ — لا مفاجآت لاحقاً", en: "Know your odds before you start — no surprises later" },
  { ar: "خطة زمنية محسوبة بالعكس من كل موعد نهائي", en: "A dated roadmap worked back from every deadline" },
  { ar: "مراجعة بالدرجات وتعديلات مرتبة بالأولوية", en: "Scored reviews with prioritised, specific fixes" },
  { ar: "مصادر رسمية مرتبطة لكل منحة، تتحقق منها بنفسك", en: "Official sources linked on every listing — verify yourself" },
];

const TESTIMONIALS = [
  {
    initials: "AH",
    nameAr: "أحمد", nameEn: "Ahmed",
    roleAr: "القاهرة، مصر", roleEn: "Cairo, Egypt",
    tagAr: "مقابلة تشيفنينغ", tagEn: "Chevening interview",
    quoteAr: "اكتشفت أن المنحة التي كنت أحضّر لها منذ سنتين لم أكن مؤهلاً لها أصلاً. خلال أسبوع أعادت لي المطابقة ترتيب أولوياتي، ووصلت لمقابلة تشيفنينغ بخطة واضحة.",
    quoteEn: "The scholarship I'd been preparing for two years — I wasn't even eligible. Within a week the matcher reordered my priorities and I reached a Chevening interview with a clear plan.",
  },
  {
    initials: "SR",
    nameAr: "سارة", nameEn: "Sara",
    roleAr: "عمّان، الأردن", roleEn: "Amman, Jordan",
    tagAr: "مراجعة 5.5 → 8.9", tagEn: "Review 5.5 → 8.9",
    quoteAr: "مراجعة المستندات غيّرت خطاب الدوافع بالكامل. الدرجة ارتفعت من 5.5 إلى 8.9 بعد التعديلات، وقدّمت بثقة لأول مرة.",
    quoteEn: "The document review transformed my statement. The score jumped from 5.5 to 8.9 after the edits, and for the first time I submitted with real confidence.",
  },
  {
    initials: "OM",
    nameAr: "عمر", nameEn: "Omar",
    roleAr: "الدار البيضاء، المغرب", roleEn: "Casablanca, Morocco",
    tagAr: "قدّم على DAAD", tagEn: "Applied to DAAD",
    quoteAr: "الخطة الزمنية كانت كل الفرق. عرفت متى أحجز الآيلتس ومتى أطلب التوصيات. قدّمت على DAAD بطلب مكتمل قبل الموعد بأسبوعين.",
    quoteEn: "The roadmap made all the difference — I knew when to book IELTS and when to ask for letters. I submitted a complete DAAD application two weeks early.",
  },
];

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
];
