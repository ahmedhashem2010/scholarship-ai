"use client";

import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function ScrollArea({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="scroll-area"
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ScrollBar(_props: HTMLAttributes<HTMLDivElement> & { orientation?: string }) {
  return null;
}

export { ScrollArea, ScrollBar };
