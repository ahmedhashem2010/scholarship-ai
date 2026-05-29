import * as React from "react"
import { cn } from "@/lib/utils"

const variants: Record<string, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  outline: "border text-foreground",
  green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  gray: "bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant] ?? variants.default,
        className
      )}
      {...props}
    />
  )
}
