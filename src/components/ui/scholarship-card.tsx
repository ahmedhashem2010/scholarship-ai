"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FitScore } from "@/components/ui/fit-score";
import { DeadlineIndicator } from "@/components/ui/deadline-indicator";
import { HelpTooltip } from "@/components/help-tooltip";
import {
  ArrowRight,
  GraduationCap,
  Building2,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/lib/scholarship-matcher";

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    Japan: "🇯🇵", Hungary: "🇭🇺", "United Kingdom": "🇬🇧", "United States": "🇺🇸",
    Canada: "🇨🇦", Germany: "🇩🇪", Netherlands: "🇳🇱", Poland: "🇵🇱",
    France: "🇫🇷", Italy: "🇮🇹", China: "🇨🇳", Turkey: "🇹🇷",
    Russia: "🇷🇺", Australia: "🇦🇺",
  };
  return flags[country] ?? "🌍";
}

function parseBenefitValue(benefits: string | null, key: string): string | null {
  if (!benefits) return null;
  try {
    const parsed = JSON.parse(benefits);
    return parsed[key] ?? null;
  } catch { return null; }
}

function getTotalValue(benefits: string | null): string {
  if (!benefits) return "Varies";
  try {
    const parsed = JSON.parse(benefits);
    const text = JSON.stringify(parsed).toLowerCase();
    if (text.includes("full tuition")) return "Full Tuition + Stipend";
    if (text.includes("tuition")) return "Tuition Covered";
    return "Full Scholarship";
  } catch { return "Full Scholarship"; }
}

/**
 * Reasons carry a status prefix from the matcher ("✓", "⚠", "🔥"). Render the
 * prefix as a coloured icon and show the bare evidence text, so the card never
 * invents a fact — the wording is exactly what the matcher emitted.
 */
type ReasonTone = "good" | "warn" | "hot" | "neutral";

function reasonTone(reason: string): ReasonTone {
  if (reason.startsWith("🔥")) return "hot";
  if (reason.startsWith("⚠")) return "warn";
  if (reason.startsWith("✓")) return "good";
  return "neutral";
}

function reasonText(reason: string): string {
  return reason
    .replace(/^[✓⚠🔥✗]\s*/, "")
    .replace(/^(Your|Open to|Accepts) /, "");
}

function ReasonIcon({ tone }: { tone: ReasonTone }) {
  const cls =
    tone === "good"
      ? "text-success"
      : tone === "warn"
        ? "text-[rgb(var(--accent-warm))]"
        : tone === "hot"
          ? "text-[rgb(var(--accent-warm))]"
          : "text-muted-foreground/60";
  if (tone === "hot") return <Flame className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", cls)} />;
  if (tone === "warn") return <AlertTriangle className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", cls)} />;
  return <CheckCircle2 className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", cls)} />;
}

/** Reasons shown before "Show all": keeps cards short on mobile. */
const DEFAULT_REASON_COUNT = 3;

interface ScholarshipCardProps {
  match: MatchResult;
  index: number;
  showCompare?: boolean;
  isSelected?: boolean;
  onToggleCompare?: (id: string) => void;
  className?: string;
}

export function ScholarshipCard({
  match,
  index,
  showCompare = false,
  isSelected = false,
  onToggleCompare,
  className,
}: ScholarshipCardProps) {
  const sch = match.scholarship;
  const rankEmojis = ["🥇", "🥈", "🥉"];
  const [showAllReasons, setShowAllReasons] = useState(false);
  const visibleReasons =
    showAllReasons ? match.reasons : match.reasons.slice(0, DEFAULT_REASON_COUNT);

  return (
    <Card className={cn("flex flex-col card-hover group", isSelected && "ring-2 ring-primary", className)}>
      <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{rankEmojis[index] ?? `#${index + 1}`}</span>
              <div className="flex items-center gap-1">
                <FitScore score={match.fitScore} size="sm" />
                <HelpTooltip text="Fit Score measures how well this scholarship matches your profile based on education, major, country eligibility, age, and English level." side="top" />
              </div>
            </div>
            <Badge variant={match.fitScore >= 80 ? "green" : match.fitScore >= 60 ? "blue" : "yellow"}>
              {match.fitScore}% fit
            </Badge>
        </div>
        <CardTitle className="text-base mt-2 leading-snug">{sch.nameEn}</CardTitle>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span>{getCountryFlag(sch.country)}</span>
            <span>{sch.country}</span>
          </span>
          {sch.university && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate max-w-[160px]">{sch.university}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>{sch.degree}</span>
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Award className="h-3 w-3" />
            Why this fits you
          </p>
          <ul className="space-y-1.5">
            {visibleReasons.map((r, i) => (
              <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                <ReasonIcon tone={reasonTone(r)} />
                <span>{reasonText(r)}</span>
              </li>
            ))}
          </ul>
          {match.reasons.length > DEFAULT_REASON_COUNT && (
            <button
              type="button"
              onClick={() => setShowAllReasons((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              {showAllReasons ? (
                <>
                  Show fewer
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Show all reasons ({match.reasons.length})
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {[parseBenefitValue(sch.benefits, "tuition"), parseBenefitValue(sch.benefits, "allowance")].filter(Boolean).slice(0, 2).map((b, i) => (
              <span key={i} className="text-[11px] bg-muted text-muted-foreground rounded-md px-2 py-0.5">{b}</span>
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">{getTotalValue(sch.benefits)}</span>
        </div>

        <div className="flex items-center justify-between">
          <DeadlineIndicator deadline={sch.deadline} showDate={false} />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            ~{match.successProbability}% success
            <HelpTooltip text="Estimated chance of acceptance based on your fit score and the scholarship's competition level. Higher fit + lower competition = better odds." side="top" />
          </span>
        </div>
      </CardContent>

      <div className="border-t px-4 py-3 flex items-center gap-2">
        {showCompare && onToggleCompare && (
          <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleCompare(sch.id)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-[11px] text-muted-foreground">Compare</span>
          </label>
        )}
        {match.isEligible && (
          <Link href={`/dashboard/applications/${sch.id}`} className="flex-1">
            <Button size="sm" className="w-full gap-1.5 text-xs group/btn">
              Start Application
              <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          </Link>
        )}
        <Link href={`/scholarships/${sch.id}`}>
          <Button variant="outline" size="sm" className="text-xs">Details</Button>
        </Link>
      </div>
    </Card>
  );
}
