"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { Divider as HeroDivider } from "@heroui/react";
import { cn } from "@/lib/utils";

interface SeparatorProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

const Separator = forwardRef<HTMLHRElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <HeroDivider
      ref={ref as any}
      orientation={orientation}
      className={cn(
        orientation === "horizontal" ? "w-full h-px" : "h-full w-px",
        className
      )}
      {...(props as any)}
    />
  )
);
Separator.displayName = "Separator";

export { Separator };
