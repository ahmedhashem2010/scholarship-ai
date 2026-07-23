"use client";

import { forwardRef } from "react";
import { Progress as HeroProgress } from "@heroui/react";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value?: number;
  className?: string;
  max?: number;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <HeroProgress
        ref={ref as any}
        value={percentage}
        className={cn("w-full", className)}
        color="primary"
        size="sm"
        radius="full"
        {...(props as any)}
      />
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
