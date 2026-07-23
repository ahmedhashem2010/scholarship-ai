"use client";

import { cn } from "@/lib/utils";

interface FitScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function FitScore({ score, size = "md", className, showLabel = true }: FitScoreProps) {
  const dims = { sm: 40, md: 56, lg: 72 };
  const strokes = { sm: 3, md: 4, lg: 5 };
  const fontSize = { sm: "text-xs", md: "text-base", lg: "text-xl" };
  const d = dims[size];
  const r = d / 2 - strokes[size];
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const color =
    score >= 80 ? "stroke-success" : score >= 60 ? "stroke-primary" : score >= 40 ? "stroke-warning" : "stroke-danger";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={d} height={d} className="-rotate-90">
        <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokes[size]} className="text-default-200" />
        <circle
          cx={d / 2}
          cy={d / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokes[size]}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={cn("transition-all duration-1000 ease-out", color)}
        />
      </svg>
      <span className={cn("absolute font-bold text-foreground tabular-nums", fontSize[size])}>
        {score}
        {showLabel && <span className="text-[0.5em] font-normal text-default-500">%</span>}
      </span>
    </div>
  );
}
