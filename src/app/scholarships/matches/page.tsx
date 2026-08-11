"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Target, Search, ArrowLeft } from "lucide-react";
import { Header } from "@/components/scholarship/header";
import { ScholarshipCard } from "@/components/ui/scholarship-card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { MatchResult } from "@/lib/scholarship-matcher";

/**
 * Your Matches — the full personalized, ranked list.
 *
 * The dashboard shows the top 6; this page shows every eligible match in rank
 * order, using the same `/api/scholarships/match` pipeline (which is the single
 * source of truth for scoring). It never re-scores, never pads with ineligible
 * rows, and renders each match's deterministic "why this fits you" reasons.
 *
 * `/scholarships/matches` is deliberately NOT in the middleware matcher (the
 * general `/scholarships` catalogue is public). Auth and profile are enforced
 * here by the API itself: 401 → sign in, 400 (no profile) → onboarding.
 */
export default function MatchesPage() {
  const router = useRouter();
  const { pick } = useLanguage();
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/scholarships/match");
        if (res.status === 401) {
          if (!cancelled) {
            router.replace(
              `/auth/login?redirectTo=${encodeURIComponent("/scholarships/matches")}`
            );
          }
          return;
        }
        if (res.status === 400) {
          if (!cancelled) router.replace("/onboarding");
          return;
        }
        const json = await res.json();
        if (!res.ok || !json.success) {
          if (!cancelled) setError(json.error ?? "Couldn't load your matches.");
          return;
        }
        if (!cancelled) setResults(json.data ?? []);
      } catch {
        if (!cancelled) setError("Couldn't load your matches. Please try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <>
      <Header />
      <main className="page-container py-8 space-y-8">
        <Link
          href="/scholarships"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {pick("تصفّح كل المنح", "Browse all scholarships")}
        </Link>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-6 sm:p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-white/80" />
              <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                {pick("مطابقة مخصصة", "Personalized matching")}
              </span>
            </div>
            <h1 className="text-h2 sm:text-h1 mt-2">
              {pick("منحك المطابقة", "Your matches")}
            </h1>
            <p className="mt-2 text-white/80 max-w-2xl">
              {results === null
                ? pick("جارٍ مطابقة ملفك…", "Matching your profile…")
                : results.length === 0
                  ? pick("لا توجد منح مطابقة حتى الآن", "No matching scholarships yet")
                  : pick(
                      `${results.length} منحة مطابقة لملفك، مرتبة حسب الأفضلية`,
                      `${results.length} scholarships matched to your profile, ranked best first`
                    )}
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-10 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl border-primary/20 hover:bg-primary/5"
              onClick={() => window.location.reload()}
            >
              {pick("أعد المحاولة", "Try again")}
            </Button>
          </div>
        ) : results === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-10 text-center">
            <Target className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">
              {pick("لا توجد منح مطابقة بعد", "No matches yet")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {pick(
                "أكمل ملفك حتى نتمكن من مطابقة مئات المنح معه في ثوانٍ. كلما كانت بياناتك أدق، كانت النتائج أدق.",
                "Complete your profile and we'll score hundreds of scholarships against it in seconds. The more accurate your data, the better your matches."
              )}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/dashboard/profile">
                <Button className="gap-2 rounded-xl">
                  {pick("أكمل ملفك", "Complete my profile")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href="/scholarships">
                <Button variant="outline" className="gap-2 rounded-xl border-primary/20 hover:bg-primary/5">
                  {pick("تصفّح كل المنح", "Browse all scholarships")}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((m, i) => (
              <ScholarshipCard key={m.scholarship.id} match={m} index={i} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
