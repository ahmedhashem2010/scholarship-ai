import { cn } from "@/lib/utils";
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  NOT_STARTED: { label: "Not Started", color: "bg-slate-100 text-slate-600", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Loader2 },
  DRAFT: { label: "Draft", color: "bg-yellow-100 text-yellow-700", icon: FileText },
  SUBMITTED: { label: "Submitted", color: "bg-green-100 text-green-700", icon: Send },
  REVIEWED: { label: "Reviewed", color: "bg-indigo-100 text-indigo-700", icon: UserCheck },
  COMPLETED: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  READY: { label: "Ready", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  UPLOADED: { label: "Uploaded", color: "bg-blue-100 text-blue-700", icon: FileText },
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700", icon: AlertCircle },
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
    color: "bg-slate-100 text-slate-600",
    icon: Clock,
  };
  const Icon = config.icon;
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px] gap-1" : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span className={cn("inline-flex items-center rounded-full font-medium", config.color, sizeClasses, className)}>
      {showIcon && <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />}
      {config.label}
    </span>
  );
}
