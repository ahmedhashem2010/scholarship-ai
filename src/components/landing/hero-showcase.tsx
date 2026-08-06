"use client";

import { CalendarClock, FileCheck2, Sparkles, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Hero showcase — a "screenshot" of the product's match dashboard.
 *
 * Deliberately mode-independent: it is a fixed photograph of the app (white
 * window, navy text) sitting on the fixed navy hero, so it uses the literal
 * `app-frame` classes from globals.css rather than the mode-inverting tokens.
 * The floating cards are dark glass, so they pop against both.
 */
export function HeroShowcase() {
  const { pick, num } = useLanguage();

  const rows = [
    {
      nameAr: "منحة تشيفنينغ البريطانية",
      nameEn: "Chevening Scholarship",
      meta: pick("المملكة المتحدة · ماجستير", "United Kingdom · Master's"),
      score: 92,
      days: 34,
    },
    {
      nameAr: "منحة إيراسموس موندوس",
      nameEn: "Erasmus Mundus",
      meta: pick("أوروبا · ماجستير", "Europe · Master's"),
      score: 87,
      days: 15,
    },
    {
      nameAr: "منحة DAAD الألمانية",
      nameEn: "DAAD Scholarship",
      meta: pick("ألمانيا · ماجستير / دكتوراه", "Germany · Master's / PhD"),
      score: 78,
      days: 61,
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* Gold bloom behind the window ------------------------------------- */}
      <div
        aria-hidden="true"
        className="obj-glow-drift pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(circle,rgb(198_161_75/0.22),transparent_65%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] border border-white/10 bg-white/[0.03]"
      />

      {/* Main dashboard window ------------------------------------------- */}
      <div className="app-frame relative overflow-hidden rounded-2xl border border-[#e6e0d3] shadow-[0_32px_80px_-28px_rgb(4_12_26/0.8)] ring-1 ring-white/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d5b45c]/70 to-transparent"
        />
        {/* Window chrome */}
        <div className="app-frame-line flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d48f84]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#d5b45c]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#8fbcae]" />
          </div>
          <span dir="ltr" className="app-frame-muted text-[11px]">
            app.smartscholar.org
          </span>
          <span className="app-frame-success app-frame-success-soft inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2e7d62]" />
            {pick("محدَّث اليوم", "Updated today")}
          </span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold sm:text-base">
              {pick("أفضل المنح لك", "Your best matches")}
            </h3>
            <span className="app-frame-gold app-frame-gold-soft inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
              <Sparkles className="h-3 w-3" />
              {pick("تطابق بالذكاء الاصطناعي", "AI matched")}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {rows.map((row, i) => (
              <div key={row.nameEn} className="app-frame-row rounded-xl border p-3.5 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {pick(row.nameAr, row.nameEn)}
                    </p>
                    <p className="app-frame-muted mt-0.5 truncate text-xs">
                      {row.meta}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <span dir="ltr" className="app-frame-gold block text-lg font-bold leading-none tabular-nums">
                      {num(row.score)}%
                    </span>
                    <span className="app-frame-muted text-[10px]">
                      {pick("تطابق", "fit")}
                    </span>
                  </div>
                </div>

                <div className="app-frame-track mt-3 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="app-frame-gold-fill h-full rounded-full landing-progress-fill"
                    style={{
                      width: `${row.score}%`,
                      animationDelay: `${400 + i * 220}ms`,
                      animationFillMode: "both",
                    }}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="app-frame-muted flex items-center gap-1.5 text-[11px]">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                    {pick(`متبقٍ ${num(row.days)} يوماً`, `${row.days} days left`)}
                  </span>
                  <span className="app-frame-success flex items-center gap-1 text-[11px] font-medium">
                    <TrendingUp className="h-3 w-3 shrink-0" />
                    {pick("احتمال مرتفع", "high probability")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* AI insight strip */}
          <div className="app-frame-ai mt-4 flex items-start gap-3 rounded-xl border border-[#e8e4dc] p-3.5">
            <span className="app-frame-gold-fill flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs leading-relaxed">
              {pick(
                "بناءً على ملفك، تشيفنينغ هي أنسب منحة لك. ابدأ التحضير للآيلتس — أمامك ٣٤ يوماً.",
                "Based on your profile, Chevening is your strongest match. Start IELTS prep now — 34 days to the deadline."
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Floating card — AI document review ------------------------------- */}
      <div
        className="absolute -top-8 -start-2 landing-fade-in sm:-start-8"
        style={{ animationDelay: "250ms", animationFillMode: "both" }}
      >
        <div className="glass-dark flex landing-float items-center gap-3 rounded-xl p-3 pe-4" style={{ animationDelay: "900ms" }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <FileCheck2 className="h-4 w-4 text-[#d5b45c]" />
          </span>
          <div>
            <p className="text-[11px] font-medium text-white/70">
              {pick("مراجعة المستندات", "Document review")}
            </p>
            <p className="text-sm font-semibold text-white">
              {pick("الدرجة ٨٫٦ من ١٠", "Score 8.6/10")}
            </p>
            <p className="text-[10px] text-white/50">
              {pick("٣ تحسينات مقترحة", "3 improvements found")}
            </p>
          </div>
        </div>
      </div>

      {/* Floating card — success probability ------------------------------ */}
      <div
        className="absolute -bottom-8 -end-2 landing-fade-in sm:-end-6"
        style={{ animationDelay: "450ms", animationFillMode: "both" }}
      >
        <div className="glass-dark flex landing-float items-center gap-3 rounded-xl p-3 pe-5" style={{ animationDelay: "1400ms" }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <TrendingUp className="h-4 w-4 text-[#8fbcae]" />
          </span>
          <div>
            <p dir="ltr" className="text-lg font-bold leading-none text-white">
              {num(92)}%
            </p>
            <p className="mt-1 text-[11px] text-white/60">
              {pick("احتمال النجاح", "success probability")}
            </p>
          </div>
        </div>
      </div>

      {/* Floating card — roadmap next step -------------------------------- */}
      <div
        className="absolute -end-4 top-1/2 hidden -translate-y-1/2 landing-fade-in md:block lg:-end-8"
        style={{ animationDelay: "600ms", animationFillMode: "both" }}
      >
        <div className="glass-dark w-44 landing-float rounded-xl p-3.5" style={{ animationDelay: "1200ms" }}>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
            {pick("الخطوة التالية", "Next step")}
          </p>
          <p className="mt-1.5 text-sm font-semibold text-white">
            {pick("احجز اختبار الآيلتس", "Book IELTS")}
          </p>
          <p className="mt-1 text-[11px] text-white/60">
            {pick("قبل ١٥ نوفمبر", "by 15 Nov")}
          </p>
          <div className="app-frame-track mt-2.5 h-1 overflow-hidden rounded-full">
            <div className="app-frame-gold-fill h-full w-2/3 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
