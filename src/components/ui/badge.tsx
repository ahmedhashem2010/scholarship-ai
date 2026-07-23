"use client";

import { cn } from "@/lib/utils";

const variantClasses: Record<string, string> = {
  default: "bg-primary text-white",
  secondary: "bg-default-100 text-default-700",
  destructive: "bg-danger text-white",
  outline: "border border-default-300 text-foreground",
  green: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
  blue: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
  yellow: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
  gray: "bg-default-100 text-default-600 dark:bg-default-700 dark:text-default-300",
  red: "bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300",
};

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<"span"> & { variant?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant] ?? variantClasses.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
