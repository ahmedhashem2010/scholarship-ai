"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, BadgeCheck, CalendarClock, Check,
  ChevronDown, ClipboardList, FileCheck2, Flag, GraduationCap, MapPin, MessageSquare,
  Route, ScanSearch, ShieldCheck, Sparkles, UserCheck, Wallet, X,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Nav } from "@/components/nav";
import { Reveal } from "@/components/landing/reveal";
import { HeroShowcase } from "@/components/landing/hero-showcase";
import { Float3D, ThreeDObject } from "@/components/landing/three-d";
import { Magnetic } from "@/components/landing/magnetic";
import { SpotlightCard } from "@/components/landing/spotlight-card";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Landing page (v4) — full product redesign.
 *
 * Thirteen sections told in the order a student needs to decide:
 *   hero → trust → stats → how it works → AI features → showcase → roadmap →
 *   why → universities → success → testimonials → FAQ → final CTA → footer.
 *
 * Rules honoured here (unchanged from v3):
 *   - No backend, auth, payment or routing changes — every CTA points at an
 *     existing route (/auth/signup, /auth/login, /scholarships).
 *   - Brand colours only: navy, gold, white and very light gray. Mode-aware
 *     surfaces use CSS-variable tokens; the navy bands and the app screenshot
 *     are deliberately mode-independent (see globals.css).
 *   - Arabic-first content, English default. All copy flows through t()/pick().
 *
 * v4 specifics:
 *   - Inter Tight + Cairo typography; hero headlines are massive and bold.
 *   - Hand-drawn 3D objects replace generic icons as the visual language.
 *   - Motion is transform/opacity only, all killed by prefers-reduced-motion.
 */
export default function Home() {
  const { t, pick, num, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <>
      <Nav />

      <main>
        {/* 1. Hero --------------------------------------------------------- */}
        <section className="hero-band relative overflow-hidden">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="obj-glow-drift pointer-events-none absolute -top-40 start-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-secondary-500/20 blur-[120px] rtl:translate-x-1/2"
          />
          {SPARKLES.map((s, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="obj-twinkle absolute h-1.5 w-1.5 rounded-full bg-secondary-300/80"
              style={{ top: `${s.top}%`, insetInlineStart: `${s.start}%`, animationDelay: `${s.delay}s` }}
            />
          ))}

          <div className="page-container relative pb-24 pt-32 sm:pt-36 lg:pb-28 lg:pt-40">
            <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
              <div className="text-center lg:text-start">
                <span className="landing-hero-in inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/85 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.6)] backdrop-blur" style={{ animationDelay: "0.05s" }}>
                  <Sparkles className="h-3.5 w-3.5 text-secondary-300" />
                  {t("hero.badge")}
                </span>

                <h1 className="landing-hero-in font-display mt-7 text-balance text-[clamp(2.6rem,6vw,4.75rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-white sm:text-6xl lg:text-[4.75rem]" style={{ animationDelay: "0.12s" }}>
                  {t("hero.hl1")}{" "}
                  <span className="text-gold-on-navy">{t("hero.hl2")}</span>
                </h1>

                <p className="landing-hero-in mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl lg:mx-0" style={{ animationDelay: "0.2s" }}>
                  {t("hero.sub")}
                </p>

                <div className="landing-hero-in mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row lg:justify-start" style={{ animationDelay: "0.3s" }}>
                  <Magnetic strength={0.22} className="w-full max-w-sm sm:w-auto">
                    <Link
                      href="/auth/signup"
                      className="group relative inline-flex min-h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-secondary px-8 py-4 text-base font-bold text-secondary-foreground shadow-[0_18px_44px_-14px_rgb(198_161_75/0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary-600 hover:shadow-[0_24px_52px_-14px_rgb(198_161_75/0.9)] active:scale-[0.97] sm:w-auto"
                    >
                      {t("hero.cta")}
                      <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                      <span aria-hidden="true" className="btn-shine-overlay" />
                    </Link>
                  </Magnetic>
                  <Link
                    href="/scholarships"
                    className="inline-flex min-h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all duration-300 hover:border-white/40 hover:bg-white/10 active:scale-[0.97] sm:w-auto"
                  >
                    {t("hero.ctaSecondary")}
                  </Link>
                </div>

                <p className="landing-hero-in mt-4 text-sm text-white/60" style={{ animationDelay: "0.36s" }}>{t("hero.noCard")}</p>

                <ul className="landing-hero-in mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/75 lg:justify-start" style={{ animationDelay: "0.42s" }}>
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

                <div
                  className="landing-hero-in mt-9 flex items-center justify-center gap-2.5 text-xs font-medium text-white/50 lg:justify-start"
                  style={{ animationDelay: "0.48s" }}
                >
                  <span className="landing-scroll-hint flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5">
                    <ChevronDown className="h-4 w-4 text-secondary-300" />
                  </span>
                  {t("hero.scroll")}
                </div>
              </div>

              {/* Showcase + floating objects */}
              <div className="landing-hero-in relative mx-auto w-full max-w-md lg:max-w-none" style={{ animationDelay: "0.55s" }}>
                <div className="relative">
                  <HeroShowcase />

                  <div className="absolute -top-14 start-[-4%] block">
                    <Float3D variant="cap" className="h-24 w-28" duration={6.5} />
                  </div>
                  <div className="absolute bottom-[-9%] start-[-6%] hidden sm:block">
                    <Float3D variant="globe" className="h-24 w-24" delay={0.9} duration={7.2} />
                  </div>
                  <div className="absolute -top-9 end-[-3%] hidden sm:block">
                    <Float3D variant="medal" className="h-20 w-20" delay={1.7} duration={6} tilt={3} />
                  </div>
                  <div className="absolute end-[-7%] top-[40%] hidden lg:block">
                    <Float3D variant="plane" className="h-16 w-20" delay={2.4} duration={5.6} tilt={-2} />
                  </div>
                  <div className="absolute bottom-[16%] start-[-15%] hidden xl:block">
                    <Float3D variant="letter" className="h-20 w-24" delay={1.2} duration={7.6} />
                  </div>
                  <div className="absolute -bottom-6 end-[14%] block">
                    <Float3D variant="sparkle" className="h-10 w-10" delay={0.4} duration={4.8} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. How it works --------------------------------------------------- */}
        <section id="how-it-works" className="bg-background">
          <div className="page-container py-20 sm:py-24">
            <Reveal>
              <SectionHead overline={t("how.overline")} title={t("how.title")} sub={t("how.sub")} />
            </Reveal>

            <div className="relative mt-14">
              <div
                aria-hidden="true"
                className="absolute inset-x-16 top-5 hidden h-px bg-gradient-to-r from-transparent via-secondary-300/70 to-transparent lg:block"
              />
              <div role="list" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
                {STEPS.map((step, i) => (
                  <Reveal
                    key={step.key}
                    delay={i * 90}
                    className={i === STEPS.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""}
                  >
                    <div role="listitem" className="group relative flex gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                      {i < STEPS.length - 1 && (
                        <span
                          aria-hidden="true"
                          className="absolute start-[31px] top-12 h-[calc(100%-2.5rem)] w-px bg-border lg:hidden"
                        />
                      )}
                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-secondary-200 bg-card shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:border-secondary-300 group-hover:shadow-elevated">
                          <ThreeDObject variant={step.object} className="h-11 w-11" />
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary-500 text-[11px] font-extrabold text-secondary-foreground shadow-[0_6px_16px_-6px_rgb(198_161_75/0.9)]">
                          {num(i + 1)}
                        </span>
                      </div>
                      <div className="lg:mt-4">
                        <h3 className="text-base font-bold text-foreground">{t(`how.s${i + 1}.title`)}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(`how.s${i + 1}.body`)}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. AI features — bento ------------------------------------------- */}
        <section id="features" className="border-y border-border bg-muted/40">
          <div className="page-container py-20 sm:py-24">
            <Reveal>
              <SectionHead overline={t("feat.overline")} title={t("feat.title")} sub={t("feat.sub")} />
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <Reveal key={f.key} delay={(i % 3) * 90} className={f.wide ? "lg:col-span-2" : ""}>
                  <SpotlightCard className="h-full">
                    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-secondary-300 hover:shadow-elevated">
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-secondary-400 to-secondary-600 transition-transform duration-300 group-hover:scale-x-100 rtl:origin-right"
                      />
                      <div className="relative flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#12294b] text-secondary-300 ring-1 ring-inset ring-white/10 transition-transform duration-300 group-hover:scale-110">
                          <f.icon className="h-5 w-5" />
                        </span>
                        {f.wide && (
                          <ArrowUpRight className="h-5 w-5 text-muted-foreground/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-secondary-600 rtl:group-hover:-translate-x-0.5" />
                        )}
                      </div>
                      <h3 className="relative mt-5 text-lg font-bold tracking-tight text-foreground">
                        {pick(f.titleAr, f.titleEn)}
                      </h3>
                      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                        {pick(f.descAr, f.descEn)}
                      </p>
                      <FeatureVisual type={f.visual} />
                    </div>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Scholarship showcase ------------------------------------------- */}
        <section className="bg-background">
          <div className="page-container py-20 sm:py-24">
            <Reveal>
              <SectionHead overline={t("show.overline")} title={t("show.title")} sub={t("show.sub")} />
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SHOWCASE.map((s, i) => (
                <Reveal key={s.nameEn} delay={(i % 3) * 90}>
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-secondary-300 hover:shadow-elevated">
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-secondary-400 to-secondary-600 transition-transform duration-300 group-hover:scale-x-100 rtl:origin-right"
                    />
                    <div className="flex items-start justify-between gap-3 p-6 pb-0">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#12294b] text-sm font-extrabold text-white shadow-[0_8px_20px_-8px_rgb(11_31_58/0.8)] ring-1 ring-inset ring-white/10">
                          {s.monogram}
                        </span>
                        <div>
                          <h3 className="font-bold text-foreground">{pick(s.nameAr, s.nameEn)}</h3>
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
                        className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground shadow-[0_8px_20px_-10px_rgb(198_161_75/0.7)] transition-all duration-300 hover:bg-secondary-600 hover:shadow-[0_12px_28px_-10px_rgb(198_161_75/0.8)] active:scale-[0.98]"
                      >
                        {t("show.apply")}
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 rtl:group-hover/btn:-translate-x-0.5" />
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

        {/* 7. Application timeline ------------------------------------------- */}
        <section className="bg-background">
          <div className="page-container pb-20 sm:pb-24">
            <Reveal>
              <div className="brand-panel relative overflow-hidden rounded-[2rem] shadow-[0_40px_90px_-40px_rgb(11_31_58/0.6)]">
                <div className="hero-grid absolute inset-0" aria-hidden="true" />
                <div
                  aria-hidden="true"
                  className="obj-glow-drift pointer-events-none absolute -top-32 end-1/4 h-96 w-96 rounded-full bg-secondary-500/20 blur-[120px]"
                />

                <div className="absolute end-[4%] top-[5%] hidden lg:block">
                  <Float3D variant="suitcase" className="h-20 w-20" duration={7} />
                </div>
                <div className="absolute bottom-[8%] start-[3%] hidden lg:block">
                  <Float3D variant="plane" className="h-14 w-16" delay={1.4} duration={6} />
                </div>

                <div className="relative grid gap-12 p-8 sm:p-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 lg:p-16">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary-300">{t("time.overline")}</p>
                    <h2 className="font-display mt-3 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                      {t("time.title")}
                    </h2>
                    <p className="mt-4 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">{t("time.sub")}</p>

                    <ul className="mt-7 space-y-3">
                      {[t("time.f1"), t("time.f2"), t("time.f3")].map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm font-medium text-white/85">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-secondary-foreground">
                            <Check className="h-3 w-3" />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      <Magnetic strength={0.22}>
                        <Link
                          href="/auth/signup"
                          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-secondary px-7 py-3.5 text-base font-bold text-secondary-foreground shadow-[0_16px_40px_-14px_rgb(198_161_75/0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary-600 active:scale-[0.97]"
                        >
                          {t("time.cta")}
                          <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                          <span aria-hidden="true" className="btn-shine-overlay" />
                        </Link>
                      </Magnetic>
                    </div>
                  </div>

                  <div>
                    <RoadmapCard />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 8. Why SmartScholar ----------------------------------------------- */}
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
                        <span className="text-sm leading-relaxed text-muted-foreground">{pick(row.ar, row.en)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <div
                aria-hidden="true"
                className="absolute start-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:flex rtl:translate-x-1/2"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-500 text-sm font-extrabold text-secondary-foreground shadow-lg ring-4 ring-background">
                  {t("why.vs")}
                </span>
              </div>

              <Reveal delay={120}>
                <div className="brand-panel relative h-full overflow-hidden rounded-2xl p-7 shadow-elevated sm:p-8">
                  <div className="hero-grid absolute inset-0" aria-hidden="true" />
                  <div aria-hidden="true" className="absolute -end-8 -top-8">
                    <Float3D variant="medal" className="h-28 w-28" float={false} shadow={false} />
                  </div>
                  <h3 className="relative flex items-center gap-2.5 text-base font-semibold text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-500 text-secondary-foreground">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    {t("why.newTitle")}
                  </h3>
                  <ul className="relative mt-6 space-y-4">
                    {NEW_WAY.map((row) => (
                      <li key={row.en} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-secondary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-sm font-medium leading-relaxed text-white/90">{pick(row.ar, row.en)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="relative mt-7">
                    <Link
                      href="/auth/signup"
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-bold text-secondary-foreground shadow-[0_10px_28px_-12px_rgb(198_161_75/0.8)] transition-all duration-300 hover:bg-secondary-600 active:scale-[0.98] sm:w-auto"
                    >
                      {t("common.getStarted")}
                      <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 12. FAQ -------------------------------------------------------------- */}
        <section className="border-t border-border bg-muted/40">
          <div className="page-container py-20 sm:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <Reveal from="left">
                <div className="lg:sticky lg:top-24">
                  <SectionHead align="start" overline={t("faq.overline")} title={t("faq.title")} sub={t("faq.sub")} />
                  <div className="mt-8 max-w-md rounded-2xl border border-border bg-card p-6 shadow-soft">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#12294b] text-secondary-300">
                      <MessageSquare className="h-4 w-4" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-foreground">{t("faq.still")}</p>
                    <Link
                      href={`mailto:${BRAND.supportEmail}`}
                      dir="ltr"
                      className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      {BRAND.supportEmail}
                    </Link>
                  </div>
                </div>
              </Reveal>

              <Reveal from="right" delay={100}>
                <div className="space-y-3">
                  {FAQS.map((f, i) => (
                    <FaqItem key={f.qEn} index={i} q={pick(f.qAr, f.qEn)} a={pick(f.aAr, f.aEn)} defaultOpen={i === 0} />
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 13. Final CTA --------------------------------------------------------- */}
        <section className="page-container py-20 sm:py-24">
          <Reveal>
            <div className="hero-band relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-16 sm:py-24">
              <div className="hero-grid absolute inset-0" aria-hidden="true" />
              <div
                aria-hidden="true"
                className="obj-glow-drift pointer-events-none absolute -top-24 start-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-secondary-500/25 blur-[110px] rtl:translate-x-1/2"
              />
              {SPARKLES.map((s, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="obj-twinkle absolute h-1.5 w-1.5 rounded-full bg-secondary-300/80"
                  style={{ top: `${s.top}%`, insetInlineStart: `${s.start}%`, animationDelay: `${s.delay}s` }}
                />
              ))}

              <div className="absolute -top-8 start-[6%] hidden md:block">
                <Float3D variant="star" className="h-16 w-16" duration={6.5} />
              </div>
              <div className="absolute bottom-0 end-[7%] hidden md:block">
                <Float3D variant="cap" className="h-20 w-20" delay={1.2} duration={7} />
              </div>
              <div className="absolute end-[18%] top-[16%] hidden lg:block">
                <Float3D variant="medal" className="h-14 w-14" delay={2.2} duration={5.5} />
              </div>
              <div className="absolute bottom-[26%] start-[12%] hidden lg:block">
                <Float3D variant="sparkle" className="h-12 w-12" delay={0.6} duration={4.8} />
              </div>

              <div className="relative">
                <h2 className="font-display mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {t("cta.title")}
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">{t("cta.sub")}</p>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Magnetic strength={0.22}>
                    <Link
                      href="/auth/signup"
                      className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-secondary px-8 py-4 text-base font-bold text-secondary-foreground shadow-[0_18px_44px_-14px_rgb(198_161_75/0.75)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary-600 hover:shadow-[0_24px_52px_-14px_rgb(198_161_75/0.9)] active:scale-[0.97]"
                    >
                      {t("hero.cta")}
                      <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                      <span aria-hidden="true" className="btn-shine-overlay" />
                    </Link>
                  </Magnetic>
                  <Link
                    href="/scholarships"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all duration-300 hover:border-white/40 hover:bg-white/10 active:scale-[0.97]"
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

      <BackToTop />
    </>
  );
}

/* ---------------------------------------------------------------------------
   Sub-components
--------------------------------------------------------------------------- */

function SectionHead({
  overline,
  title,
  sub,
  align = "center",
}: {
  overline: string;
  title: string;
  sub?: string;
  align?: "center" | "start";
}) {
  const center = align === "center";
  return (
    <div className={cn(center ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-start")}>
      <p className={cn("text-xs font-bold uppercase tracking-[0.22em] text-secondary-600", !center && "text-secondary-700")}>
        {overline}
      </p>
      <h2 className="font-display mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      <span
        aria-hidden="true"
        className={cn(
          "section-underline mt-4 block h-1 w-16 rounded-full bg-gradient-to-r from-secondary-400 to-secondary-600",
          center && "mx-auto"
        )}
      />
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
          ].map((m, i) => (
            <div key={m.n} className="rounded-xl border border-border bg-muted/50 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{m.n}</span>
                <span className="font-bold text-secondary-700">{num(m.pct)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="progress-grow h-full rounded-full bg-secondary-500"
                  style={{ width: `${m.pct}%`, transitionDelay: `${i * 0.18}s` }}
                />
              </div>
            </div>
          ))}
        </div>
      );

    case "applications":
      return (
        <div className="relative mt-6 space-y-2">
          {[
            { n: pick("تشيفنينغ", "Chevening"), s: pick("جاري التقديم", "In progress") },
            { n: pick("إيراسموس", "Erasmus"), s: pick("المسودة جاهزة", "Draft ready") },
          ].map((m) => (
            <div key={m.n} className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-xs">
              <span className="font-medium text-foreground">{m.n}</span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success-500/15 text-success-600">
                  <Check className="h-2.5 w-2.5" />
                </span>
                {m.s}
              </span>
            </div>
          ))}
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
            <div className="progress-grow h-full w-[86%] rounded-full bg-secondary-500" />
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

/** The roadmap product — a dated plan worked back from a real deadline. */
function RoadmapCard() {
  const { pick, num } = useLanguage();

  const milestones = [
    { labelAr: "احجز الآيلتس", labelEn: "Book IELTS", date: "10 Aug", days: 88 },
    { labelAr: "اطلب التوصيات", labelEn: "Ask for letters", date: "7 Sep", days: 60 },
    { labelAr: "اكتب الخطاب", labelEn: "Draft statement", date: "7 Oct", days: 30 },
    { labelAr: "مراجعة أخيرة", labelEn: "Final review", date: "30 Oct", days: 7 },
  ];

  return (
    <div className="glass-dark relative overflow-hidden rounded-2xl p-6 shadow-[0_32px_80px_-36px_rgb(5_15_30/0.9)] sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-extrabold text-secondary-300">
            CH
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{pick("منحة تشيفنينغ", "Chevening Scholarship")}</p>
            <p className="truncate text-[11px] text-white/60">{pick("المملكة المتحدة · ماجستير", "United Kingdom · Master's")}</p>
          </div>
        </div>
        <span dir="ltr" className="shrink-0 rounded-full bg-secondary-500 px-2.5 py-1 text-[11px] font-extrabold text-secondary-foreground">
          6 Nov 2026
        </span>
      </div>

      <div className="mt-7">
        {milestones.map((m, i) => (
          <div key={m.labelEn} className="relative flex gap-4 pb-6 last:pb-0">
            {i < milestones.length - 1 && (
              <span aria-hidden="true" className="absolute start-[9px] top-7 h-[calc(100%-1rem)] w-px bg-white/20" />
            )}
            <span className="relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary-500 ring-4 ring-[#0b1f3a]">
              <Check className="h-3 w-3 text-secondary-foreground" />
            </span>
            <div className="flex flex-1 items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{pick(m.labelAr, m.labelEn)}</p>
                <p dir="ltr" className="mt-0.5 text-[11px] text-white/55">{m.date}</p>
              </div>
              <span dir="ltr" className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-secondary-300">
                T−{num(m.days)}
              </span>
            </div>
          </div>
        ))}

        <div className="mt-2 flex items-center gap-3.5 rounded-xl border border-dashed border-secondary-400/60 bg-secondary-500/10 p-3.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-500 text-secondary-foreground">
            <Flag className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-sm font-bold text-white">{pick("قدّم الطلب — الموعد النهائي", "Submit — the deadline")}</p>
            <p dir="ltr" className="mt-0.5 text-[11px] text-white/55">6 Nov 2026 · 00:00</p>
          </div>
        </div>
      </div>

      <p className="mt-5 flex items-center gap-1.5 text-[11px] text-white/50">
        <Sparkles className="h-3 w-3 text-secondary-300" />
        {pick("خطة ذكية مُنشأة تلقائياً حسب ملفك", "Smart plan auto-generated from your profile")}
      </p>
    </div>
  );
}

/** Accordion item with a smooth height animation. */
function FaqItem({ q, a, index, defaultOpen = false }: { q: string; a: string; index: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-card transition-all duration-300 ${
        open ? "border-secondary-300 shadow-elevated" : "border-border shadow-soft"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start sm:px-6"
      >
        <span className="flex items-center gap-3.5 text-sm font-bold text-foreground sm:text-base">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition-colors duration-300 ${
              open ? "bg-secondary-500 text-secondary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          {q}
        </span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            open ? "bg-secondary-500 text-secondary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:ps-[4.6rem]">{a}</p>
        </div>
      </div>
    </div>
  );
}

/** Floating back-to-top button that fades/slides in after scrolling down. */
function BackToTop() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 720);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTop() {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {show && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            aria-label={t("common.backToTop")}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-5 end-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-[0_16px_36px_-12px_rgb(198_161_75/0.9)] ring-1 ring-inset ring-secondary-600/30 transition-transform active:scale-95"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </MotionConfig>
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
      <p className="text-xs font-bold uppercase tracking-widest text-foreground">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="h-px w-0 bg-secondary-500 transition-all duration-300 group-hover:w-2.5" aria-hidden="true" />
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
      <div className="page-container pt-14 pb-[max(3.5rem,env(safe-area-inset-bottom,0px))]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <BrandMark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{t("foot.about")}</p>
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("foot.social")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {socials.map((key) => (
                  <a
                    key={key}
                    href="#"
                    className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary-300 hover:text-foreground hover:shadow-soft"
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
          <p dir="ltr" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-secondary-500" />
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

const SPARKLES = [
  { top: 18, start: 12, delay: 0 },
  { top: 30, start: 88, delay: 1.2 },
  { top: 62, start: 6, delay: 2.1 },
  { top: 70, start: 92, delay: 0.6 },
  { top: 82, start: 24, delay: 1.7 },
  { top: 14, start: 58, delay: 2.6 },
];

const STEPS = [
  { key: "profile", object: "passport" as const },
  { key: "match", object: "star" as const },
  { key: "review", object: "diploma" as const },
  { key: "roadmap", object: "books" as const },
  { key: "submit", object: "plane" as const },
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
    key: "applications",
    icon: ClipboardList,
    wide: false,
    visual: "applications",
    titleAr: "تتبع طلباتك",
    titleEn: "Application tracking",
    descAr: "اعرف أين وصلت كل منحة في خطتك — ما الذي بدأته وما الذي بقي له خطوة واحدة.",
    descEn: "See where every scholarship stands in your plan — what you've started and what's one step from done.",
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

const FAQS = [
  {
    qAr: "هل المنصة مجانية؟",
    qEn: "Is it free?",
    aAr: "نعم، المنصة مجانية بالكامل. البحث عن المنح ونسبة التطابق والخطة الزمنية ومراجعة مستنداتك بالذكاء الاصطناعي — كل ذلك مجاني، مع حد يومي معقول للمراجعات ليظل بجودة عالية.",
    aEn: "Yes, completely free. Searching scholarships, fit scores, roadmaps and AI document reviews are all free — with a sensible daily review limit so quality stays high.",
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
    qAr: "من أين تأتي بيانات المنح؟",
    qEn: "Where does your scholarship data come from?",
    aAr: "من الصفحات الرسمية للجهات المانحة، ونضع رابط المصدر مع كل منحة لتتحقق بنفسك. نراجع البيانات دورياً ونعرض تاريخ آخر تحقق. وإن وجدت خطأً، أبلغنا وسنصححه.",
    aEn: "From the providers' own official pages, and we link the source on every listing so you can check for yourself. We re-verify regularly and show when each was last checked. Found an error? Tell us and we'll fix it.",
  },
];
