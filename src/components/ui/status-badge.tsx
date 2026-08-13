"use client";

import { Chip } from "@heroui/react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  UserCheck,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const statusConfig: Record<string, { ar: string; en: string; color: "default" | "primary" | "secondary" | "success" | "warning" | "danger"; icon: React.ElementType }> = {
  NOT_STARTED: { ar: "لم تبدأ", en: "Not Started", color: "default", icon: Clock },
  IN_PROGRESS: { ar: "قيد التنفيذ", en: "In Progress", color: "primary", icon: Loader2 },
  DRAFT: { ar: "مسودة", en: "Draft", color: "warning", icon: FileText },
  SUBMITTED: { ar: "تم التقديم", en: "Submitted", color: "success", icon: Send },
  REVIEWED: { ar: "تمت المراجعة", en: "Reviewed", color: "primary", icon: UserCheck },
  COMPLETED: { ar: "مكتمل", en: "Completed", color: "success", icon: CheckCircle2 },
  REJECTED: { ar: "مرفوض", en: "Rejected", color: "danger", icon: XCircle },
  APPROVED: { ar: "مقبول", en: "Approved", color: "success", icon: CheckCircle2 },
  READY: { ar: "جاهز", en: "Ready", color: "success", icon: CheckCircle2 },
  UPLOADED: { ar: "تم الرفع", en: "Uploaded", color: "primary", icon: FileText },
  PENDING: { ar: "قيد الانتظار", en: "Pending", color: "warning", icon: Clock },
  FAILED: { ar: "فشل", en: "Failed", color: "danger", icon: AlertCircle },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function StatusBadge({ status, className, size = "sm", showIcon = true }: StatusBadgeProps) {
  const { pick } = useLanguage();
  const config = statusConfig[status] ?? {
    ar: status.replace(/_/g, " "),
    en: status.replace(/_/g, " "),
    color: "default" as const,
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <Chip
      color={config.color}
      variant="flat"
      size="sm"
      radius="md"
      startContent={showIcon ? <Icon className="h-3 w-3" /> : undefined}
      classNames={{
        base: cn("h-auto", className),
        content: cn(size === "sm" ? "text-[11px] px-1" : "text-xs px-1"),
      }}
    >
      <span className="contents">{pick(config.ar, config.en)}</span>
    </Chip>
  );
}
