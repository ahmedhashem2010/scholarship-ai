"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
  color?: "primary" | "success" | "warning" | "danger";
}

const colorMap = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  animated = true,
  className,
  color,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const autoColor = pct >= 80 ? "success" : pct >= 40 ? "primary" : pct >= 20 ? "warning" : "danger";
  const barColor = color ?? autoColor;
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex-1 rounded-full bg-default-200 overflow-hidden", heights[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            colorMap[barColor],
            animated && "animate-progress-fill"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-default-500 min-w-[3ch] tabular-nums">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
