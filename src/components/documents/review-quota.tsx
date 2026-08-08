"use client";

import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface ReviewQuotaProps {
  used: number;
  limit: number;
  className?: string;
}

/**
 * Free AI review quota pill shown on the documents page. Bilingual: Arabic
 * copy renders in Arabic-Indic numerals via the language context.
 */
export function ReviewQuota({ used, limit, className }: ReviewQuotaProps) {
  const { t, num } = useLanguage();
  const remaining = Math.max(0, limit - used);
  const label = t("quota.remaining")
    .replace("{remaining}", num(remaining))
    .replace("{limit}", num(limit));

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap",
        remaining > 0
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
        className
      )}
      title={label}
    >
      <Sparkles className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}
