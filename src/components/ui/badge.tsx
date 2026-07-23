"use client";

import { Chip } from "@heroui/react";
import { cn } from "@/lib/utils";

const variantColorMap: Record<string, "primary" | "secondary" | "danger" | "default" | "success" | "warning"> = {
  default: "primary",
  secondary: "default",
  destructive: "danger",
  outline: "default",
  green: "success",
  blue: "primary",
  yellow: "warning",
  gray: "default",
  red: "danger",
};

const variantStyleMap: Record<string, "solid" | "bordered" | "light" | "flat" | "faded"> = {
  default: "solid",
  secondary: "flat",
  destructive: "solid",
  outline: "bordered",
  green: "flat",
  blue: "flat",
  yellow: "flat",
  gray: "flat",
  red: "flat",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"span"> & { variant?: string }) {
  return (
    <Chip
      variant={variantStyleMap[variant] ?? "flat"}
      color={variantColorMap[variant] ?? "default"}
      size="sm"
      radius="md"
      classNames={{
        base: "h-auto",
        content: "px-0 py-0 text-xs font-medium",
      }}
      className={cn("inline-flex", className)}
      {...(props as any)}
    >
      <span className="contents">{children}</span>
    </Chip>
  );
}
