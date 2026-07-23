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

const statusConfig: Record<string, { label: string; color: "default" | "primary" | "secondary" | "success" | "warning" | "danger"; icon: React.ElementType }> = {
  NOT_STARTED: { label: "Not Started", color: "default", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "primary", icon: Loader2 },
  DRAFT: { label: "Draft", color: "warning", icon: FileText },
  SUBMITTED: { label: "Submitted", color: "success", icon: Send },
  REVIEWED: { label: "Reviewed", color: "primary", icon: UserCheck },
  COMPLETED: { label: "Completed", color: "success", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "danger", icon: XCircle },
  APPROVED: { label: "Approved", color: "success", icon: CheckCircle2 },
  READY: { label: "Ready", color: "success", icon: CheckCircle2 },
  UPLOADED: { label: "Uploaded", color: "primary", icon: FileText },
  PENDING: { label: "Pending", color: "warning", icon: Clock },
  FAILED: { label: "Failed", color: "danger", icon: AlertCircle },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function StatusBadge({ status, className, size = "sm", showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status.replace(/_/g, " "),
    color: "default" as const,
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <Chip
      color={config.color}
      variant="flat"
      size="sm"
      startContent={showIcon ? <Icon className="h-3 w-3" /> : undefined}
      classNames={{
        base: cn("h-auto", className),
        content: cn(size === "sm" ? "text-[11px] px-1" : "text-xs px-1"),
      }}
    >
      {config.label}
    </Chip>
  );
}
