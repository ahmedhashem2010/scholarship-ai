"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BadgePercent,
  FileText,
  GanttChart,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Timer,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FitScore } from "@/components/ui/fit-score";
import { DeadlineIndicator } from "@/components/ui/deadline-indicator";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";

interface Scholarship {
  id: string; nameEn: string; nameAr: string; country: string;
  university: string | null; degree: string; deadline: string | null;
  requirements: string | null; benefits: string | null;
  eligibleCountries: string;
  eligibleEducation: string;
  fieldOfStudy: string;
  minimumAge: number | null;
  maximumAge: number | null;
  minimumGPA: number | null;
  englishRequirement: string | null;
  requiresResearch: boolean;
  requiresWorkExp: boolean;
  applicationFee: number | null;
  competitionLevel: string;
}

interface AppDoc { documentType: string; status: string; }
interface Application { scholarshipId: string; documents: AppDoc[]; progress: number; }

interface MatchResult {
  scholarship: Scholarship;
  fitScore: number;
  successProbability: number;
  competitionLabel: string;
  isEligible: boolean;
  reasons: string[];
  disqualifiers: string[];
}

function fmtName(n: string): string { return n.split("(")[0]?.trim() ?? n; }

function getFlag(c: string): string {
  const m: Record<string, string> = { Japan: "\u{1F1EF}\u{1F1F5}", Hungary: "\u{1F1ED}\u{1F1FA}", "United Kingdom": "\u{1F1EC}\u{1F1E7}", "United States": "\u{1F1FA}\u{1F1F8}", Canada: "\u{1F1E8}\u{1F1E6}", Germany: "\u{1F1E9}\u{1F1EA}", Netherlands: "\u{1F1F3}\u{1F1F1}", Poland: "\u{1F1F5}\u{1F1F1}" };
  return m[c] ?? "\u{1F30D}";
}

function daysLeft(d: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function fmtDate(d: string | null): string {
  if (!d) return "No deadline";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function parseJSON(s: string | null): Record<string, unknown> {
  if (!s) return {};
  try { return JSON.parse(s); } catch { return {}; }
}

function getDocTypeIcon(t: string): string {
  const m: Record<string, string> = { RESEARCH_PROPOSAL: "\u{1F4C4}", CV: "\u{1F4CB}", PERSONAL_STATEMENT: "\u270D\uFE0F", RECOMMENDATION_LETTER: "\u{1F4E9}", TRANSCRIPT: "\u{1F393}" };
  return m[t] ?? "\u{1F4CE}";
}

function parseArr(s: string): string[] {
  try { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; }
}

function getCompetitionColor(level: string): "red" | "yellow" | "green" {
  if (level === "high") return "red";
  if (level === "medium") return "yellow";
  return "green";
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids")?.split(",").filter(Boolean) ?? [];

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [schRes, matchRes, appRes] = await Promise.all([
          fetch("/api/scholarships"),
          fetch("/api/scholarships/match"),
          fetch("/api/applications"),
        ]);
        const schJson = await schRes.json();
        const matchJson = await matchRes.json();
        const appJson = await appRes.json();

        const allScholarships: Scholarship[] = schJson.success ? (schJson.data?.data ?? schJson.data ?? []) : [];
        const allMatches: MatchResult[] = matchJson.success ? (matchJson.data ?? []) : [];
        const allApps: Application[] = appJson.success ? (appJson.data ?? []) : [];

        const filtered = allScholarships.filter((s) => ids.includes(s.id));
        setScholarships(filtered);
        setMatches(allMatches.filter((m) => ids.includes(m.scholarship.id)));
        setApplications(allApps);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ids.join(",")]);

  const getMatch = useCallback((id: string) => matches.find((m) => m.scholarship.id === id), [matches]);
  const getApp = useCallback((id: string) => applications.find((a) => a.scholarshipId === id), [applications]);

  const getDocReadyCount = useCallback((scholarshipId: string) => {
    const app = getApp(scholarshipId);
    if (!app) return [0, 0] as const;
    return [app.documents.filter((d) => d.status === "READY").length, app.documents.length] as const;
  }, [getApp]);

  if (loading) {
    return (
      <div className="page-container py-6 sm:py-8 space-y-8">
        <div className="h-40 rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-primary-900 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-xl bg-slate-100 animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-48 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (scholarships.length < 2) {
    return (
      <div className="page-container py-16">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50">
            <GanttChart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Select scholarships to compare</h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Go to your dashboard, check two or more scholarships, and click <strong>Compare Selected</strong> to see them side by side.
          </p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalDocs = scholarships.map((s) => {
    const app = getApp(s.id);
    return app ? app.documents.map((d) => d.documentType) : [];
  }).flat();
  const reusableDocs = totalDocs.filter((t, i, a) => a.indexOf(t) !== i);
  const uniqueReusable = Array.from(new Set(reusableDocs));

  const bestOverall = matches.length > 0 ? matches.reduce((a, b) => a.fitScore > b.fitScore ? a : b) : null;
  const bestBenefits = scholarships.reduce((best, s) => {
    const b = parseJSON(s.benefits);
    const score = Object.keys(b).length;
    return score > Object.keys(parseJSON(best.benefits ?? null)).length ? s : best;
  }, scholarships[0]!);
  const mostUrgent = scholarships.reduce((u, s) => {
    const du = daysLeft(s.deadline);
    const duBest = daysLeft(u.deadline);
    if (du === null) return u;
    if (duBest === null) return s;
    return du < duBest ? s : u;
  }, scholarships[0]!);
  const bestChance = matches.length > 0 ? matches.reduce((a, b) => a.successProbability > b.successProbability ? a : b) : null;

  const deadlines = scholarships.map((s) => ({ id: s.id, name: s.nameEn, dl: daysLeft(s.deadline) }));
  const closeDeadlines = deadlines.filter((d) => d.dl !== null && d.dl <= 60);
  const hasDeadlineConflict = closeDeadlines.length >= 2;

  const reqTypes = scholarships.map((s) => {
    const req = parseJSON(s.requirements);
    return (req.documents as string[])?.join(",") ?? "";
  });
  const allDocTypes = Array.from(new Set(reqTypes.flat().filter(Boolean)));
  const hasDiverseDocs = allDocTypes.length > 3;

  return (
    <div className="page-container py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-700 to-primary-900 p-6 sm:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Side-by-Side Analysis</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Compare Scholarships</h1>
              <p className="mt-1 text-sm text-white/70">
                {scholarships.length} scholarships selected &middot; Detailed comparison below
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <FileText className="h-4 w-4" />
                Export
              </Button>
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Document Reusability Banner */}
      {uniqueReusable.length > 0 && (
        <div className="rounded-xl border border-success-200 bg-success-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-success-100 p-2">
              <FileText className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success-800">Documents can be reused</p>
              <p className="mt-0.5 text-sm text-success-700">
                Your <strong>{uniqueReusable.map((t) => getDocTypeIcon(t) + " " + t.replace(/_/g, " ")).join(", ")}</strong>{" "}
                can be reused across multiple scholarships with minor edits &mdash; saving you time and effort.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-primary-50 p-2">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              {bestOverall && <Badge variant="green" className="shrink-0">{bestOverall.fitScore}%</Badge>}
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Overall Fit</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {bestOverall ? fmtName(bestOverall.scholarship.nameEn) : "—"}
            </p>
            {bestOverall && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Highest match with your profile
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-success-50 p-2">
                <Award className="h-5 w-5 text-success" />
              </div>
              <Badge variant="green" className="shrink-0">Best</Badge>
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Benefits</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{fmtName(bestBenefits.nameEn)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Comprehensive coverage including tuition, stipend, and housing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-warning-50 p-2">
                <Timer className="h-5 w-5 text-warning" />
              </div>
              {(() => {
                const dl = daysLeft(mostUrgent.deadline);
                return dl !== null ? (
                  <Badge variant={dl <= 30 ? "red" : "yellow"} className="shrink-0">{dl}d left</Badge>
                ) : null;
              })()}
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Most Urgent</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{fmtName(mostUrgent.nameEn)}</p>
            {(() => {
              const dl = daysLeft(mostUrgent.deadline);
              return dl !== null ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Deadline: {fmtDate(mostUrgent.deadline)}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">No deadline set</p>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-primary-50 p-2">
                <Target className="h-5 w-5 text-primary" />
              </div>
              {bestChance && <Badge variant="green" className="shrink-0">{bestChance.successProbability}%</Badge>}
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Chance</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {bestChance ? fmtName(bestChance.scholarship.nameEn) : "—"}
            </p>
            {bestChance && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {bestChance.successProbability}% success probability
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GanttChart className="h-4 w-4 text-primary" />
            Detailed Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5 w-44">
                    Category
                  </th>
                  {scholarships.map((s) => {
                    const m = getMatch(s.id);
                    return (
                      <th key={s.id} className="text-center px-4 py-3.5 border-l border-slate-200 min-w-[200px]">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">{getFlag(s.country)}</span>
                            <span className="text-xs font-semibold leading-tight">{fmtName(s.nameEn)}</span>
                          </div>
                          {m && (
                            <FitScore score={m.fitScore} size="sm" showLabel={false} />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Basic Info */}
                <tr className="border-b border-slate-100">
                  <td colSpan={scholarships.length + 1} className="bg-primary-50/40 px-4 py-2 text-xs font-semibold text-primary">
                    Basic Information
                  </td>
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Country
                  </td>
                  {scholarships.map((s) => (
                    <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-base">{getFlag(s.country)}</span>
                        <span>{s.country}</span>
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    University
                  </td>
                  {scholarships.map((s) => (
                    <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                      {s.university ?? <span className="text-muted-foreground">Various</span>}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Degree
                  </td>
                  {scholarships.map((s) => (
                    <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                      {s.degree}
                    </td>
                  ))}
                </tr>

                {/* Requirements */}
                <tr className="border-b border-slate-100">
                  <td colSpan={scholarships.length + 1} className="bg-primary-50/40 px-4 py-2 text-xs font-semibold text-primary">
                    Requirements
                  </td>
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Education Level
                  </td>
                  {scholarships.map((s) => (
                    <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                      {parseArr(s.eligibleEducation).length > 0 ? parseArr(s.eligibleEducation).join(", ") : "Open to all"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Age Limit
                  </td>
                  {scholarships.map((s) => (
                    <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                      {s.minimumAge || s.maximumAge ? <Badge variant="gray">{s.minimumAge ?? 0}–{s.maximumAge ?? "No limit"}</Badge> : <span className="text-muted-foreground">No limit</span>}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    English Level
                  </td>
                  {scholarships.map((s) => (
                    <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                      {s.englishRequirement ?? "Not specified"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Documents
                  </td>
                  {scholarships.map((s) => {
                    const req = parseJSON(s.requirements);
                    const docs = (req.documents as string[]) ?? [];
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        <ul className="space-y-1">
                          {docs.slice(0, 4).map((d: string, i: number) => (
                            <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                              <span>{getDocTypeIcon(d)}</span>
                              <span>{d.replace(/_/g, " ")}</span>
                            </li>
                          ))}
                          {docs.length > 4 && (
                            <li className="text-xs text-muted-foreground">+{docs.length - 4} more</li>
                          )}
                        </ul>
                      </td>
                    );
                  })}
                </tr>

                {/* Benefits */}
                <tr className="border-b border-slate-100">
                  <td colSpan={scholarships.length + 1} className="bg-primary-50/40 px-4 py-2 text-xs font-semibold text-primary">
                    Benefits
                  </td>
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Tuition
                  </td>
                  {scholarships.map((s) => {
                    const b = parseJSON(s.benefits);
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        <span className="inline-flex items-center gap-1 text-success-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {(b.tuition as string) ?? "Covered"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Stipend
                  </td>
                  {scholarships.map((s) => {
                    const b = parseJSON(s.benefits);
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        {(b.allowance as string) ?? <span className="text-muted-foreground">&mdash;</span>}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Housing
                  </td>
                  {scholarships.map((s) => {
                    const b = parseJSON(s.benefits);
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        {(b.housing as string) ?? <span className="text-muted-foreground">&mdash;</span>}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Travel
                  </td>
                  {scholarships.map((s) => {
                    const b = parseJSON(s.benefits);
                    const val = (b.travel as string) ?? "\u2014";
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        {val.includes("airfare") || val.includes("travel") ? (
                          <span className="inline-flex items-center gap-1 text-success-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {val}
                          </span>
                        ) : val}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Insurance
                  </td>
                  {scholarships.map((s) => {
                    const b = parseJSON(s.benefits);
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        {(b.insurance as string) ?? <span className="text-muted-foreground">&mdash;</span>}
                      </td>
                    );
                  })}
                </tr>

                {/* Application */}
                <tr className="border-b border-slate-100">
                  <td colSpan={scholarships.length + 1} className="bg-primary-50/40 px-4 py-2 text-xs font-semibold text-primary">
                    Application Status
                  </td>
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Deadline
                  </td>
                  {scholarships.map((s) => (
                    <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                      <DeadlineIndicator deadline={s.deadline} showDate size="sm" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Competition
                  </td>
                  {scholarships.map((s) => (
                    <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                      <Badge variant={getCompetitionColor(s.competitionLevel)}>
                        {s.competitionLevel === "high" ? "Hard" : s.competitionLevel === "medium" ? "Medium" : "Easy"}
                      </Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Your Progress
                  </td>
                  {scholarships.map((s) => {
                    const [ready, total] = getDocReadyCount(s.id);
                    const app = getApp(s.id);
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        {app ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{ready}/{total} docs ready</span>
                              <StatusBadge status={app.progress >= 80 ? "IN_PROGRESS" : app.progress > 0 ? "DRAFT" : "NOT_STARTED"} />
                            </div>
                            <ProgressBar value={app.progress} size="sm" animated />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not started</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Fit & Chances */}
                <tr className="border-b border-slate-100">
                  <td colSpan={scholarships.length + 1} className="bg-primary-50/40 px-4 py-2 text-xs font-semibold text-primary">
                    Your Chances
                  </td>
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Fit Score
                  </td>
                  {scholarships.map((s) => {
                    const m = getMatch(s.id);
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        <div className="flex items-center justify-center">
                          {m ? <FitScore score={m.fitScore} size="md" /> : <span className="text-muted-foreground">&mdash;</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Success Probability
                  </td>
                  {scholarships.map((s) => {
                    const m = getMatch(s.id);
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        {m ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg font-bold tabular-nums text-primary">{m.successProbability}%</span>
                            <ProgressBar value={m.successProbability} size="sm" />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">&mdash;</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-slate-100 even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Strengths
                  </td>
                  {scholarships.map((s) => {
                    const m = getMatch(s.id);
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        {m ? (
                          <ul className="space-y-1">
                            {m.reasons.filter((r) => !r.toLowerCase().includes("may not") && !r.toLowerCase().includes("over")).slice(0, 2).map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-success-700">
                                <Zap className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                                <span>{r.replace(/^(Your|Open to|Accepts) /, "")}</span>
                              </li>
                            ))}
                          </ul>
                        ) : <span className="text-muted-foreground">&mdash;</span>}
                      </td>
                    );
                  })}
                </tr>
                <tr className="even:bg-slate-50/50">
                  <td className="text-xs font-medium text-slate-400 uppercase tracking-wider py-3 pr-4 whitespace-nowrap w-44 align-top px-4">
                    Weaknesses
                  </td>
                  {scholarships.map((s) => {
                    const m = getMatch(s.id);
                    const weaknesses = m?.reasons.filter((r) => r.toLowerCase().includes("may not") || r.toLowerCase().includes("over")) ?? [];
                    return (
                      <td key={s.id} className="px-4 py-3 text-sm border-l border-slate-100 align-top">
                        {m ? (
                          weaknesses.length > 0 ? (
                            <ul className="space-y-1">
                              {weaknesses.slice(0, 2).map((r, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-warning-700">
                                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              No major weaknesses
                            </span>
                          )
                        ) : <span className="text-muted-foreground">&mdash;</span>}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Comparison Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {bestOverall && (
              <div className="flex items-start gap-3 rounded-lg bg-primary-50 p-3">
                <div className="shrink-0 rounded-full bg-primary-100 p-1.5">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary-900">Best Overall Fit</p>
                  <p className="mt-0.5 text-primary-700">
                    <strong>{fmtName(bestOverall.scholarship.nameEn)}</strong> &mdash; {bestOverall.fitScore}% fit score, highest match with your profile.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 rounded-lg bg-success-50 p-3">
              <div className="shrink-0 rounded-full bg-success-100 p-1.5">
                <Award className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="font-semibold text-success-900">Best Benefits</p>
                <p className="mt-0.5 text-success-700">
                  <strong>{fmtName(bestBenefits.nameEn)}</strong> offers comprehensive coverage including tuition, stipend, and housing.
                </p>
              </div>
            </div>
            {(() => {
              const dl = daysLeft(mostUrgent.deadline);
              return dl !== null ? (
                <div className="flex items-start gap-3 rounded-lg bg-warning-50 p-3">
                  <div className="shrink-0 rounded-full bg-warning-100 p-1.5">
                    <Timer className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold text-warning-900">Most Urgent</p>
                    <p className="mt-0.5 text-warning-700">
                      <strong>{fmtName(mostUrgent.nameEn)}</strong> &mdash; only {dl} days remaining!
                    </p>
                  </div>
                </div>
              ) : null;
            })()}
            {bestChance && (
              <div className="flex items-start gap-3 rounded-lg bg-primary-50 p-3">
                <div className="shrink-0 rounded-full bg-primary-100 p-1.5">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary-900">Best Chance of Success</p>
                  <p className="mt-0.5 text-primary-700">
                    <strong>{fmtName(bestChance.scholarship.nameEn)}</strong> &mdash; {bestChance.successProbability}% probability.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" />
              My Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {bestOverall && bestChance && (() => {
              const top = bestOverall.fitScore >= bestChance.successProbability ? bestOverall : bestChance;
              const second = matches.filter((m) => m.scholarship.id !== top.scholarship.id).sort((a, b) => b.fitScore - a.fitScore)[0];
              return (
                <>
                  <div className="rounded-lg border border-success-200 bg-success-50 p-3">
                    <div className="flex items-start gap-2">
                      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <div>
                        <p className="font-medium text-success-900">Focus on <strong>{fmtName(top.scholarship.nameEn)}</strong> first</p>
                        <p className="mt-0.5 text-xs text-success-700">It&apos;s your best match with strong success odds.</p>
                      </div>
                    </div>
                  </div>
                  {second && (
                    <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
                      <div className="flex items-start gap-2">
                        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-medium text-primary-900">Backup option: <strong>{fmtName(second.scholarship.nameEn)}</strong></p>
                          <p className="mt-0.5 text-xs text-primary-700">{second.fitScore}% fit score.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {matches.filter((m) => m.fitScore < 60).map((m) => (
                    <div key={m.scholarship.id} className="rounded-lg border border-warning-200 bg-warning-50 p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                        <div>
                          <p className="font-medium text-warning-900">{fmtName(m.scholarship.nameEn)} may not be worth the effort</p>
                          <p className="mt-0.5 text-xs text-warning-700">Only {m.fitScore}% fit.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}

            {hasDeadlineConflict && (
              <div className="rounded-lg border border-danger-200 bg-danger-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <div>
                    <p className="font-medium text-danger-900">Deadline Conflict Warning</p>
                    <p className="mt-0.5 text-xs text-danger-700">
                      {closeDeadlines.map((d) => fmtName(d.name)).join(" and ")} have deadlines within 60 days. Prioritize these!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasDiverseDocs && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-700">Different document requirements</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      These scholarships have different document requirements. Plan your document strategy carefully to avoid last-minute scrambling.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!bestOverall && !bestChance && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                <BadgePercent className="mx-auto h-6 w-6 text-slate-400" />
                <p className="mt-2 text-sm text-slate-500">Complete your profile to get AI-powered match analysis.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>Compare up to 6 scholarships at once</span>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="page-container py-16 text-center text-muted-foreground">Loading...</div>}>
      <ComparePageContent />
    </Suspense>
  );
}
