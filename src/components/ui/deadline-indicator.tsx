import { cn } from "@/lib/utils";
import { CalendarDays, AlertTriangle, Timer, XCircle } from "lucide-react";

interface DeadlineIndicatorProps {
  deadline: Date | string | null;
  className?: string;
  showDate?: boolean;
  size?: "sm" | "md";
}

export function DeadlineIndicator({ deadline, className, showDate = true, size = "md" }: DeadlineIndicatorProps) {
  if (!deadline) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-muted-foreground", size === "sm" ? "text-xs" : "text-sm", className)}>
        <CalendarDays className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>No deadline</span>
      </span>
    );
  }

  const d = new Date(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  const isPast = days < 0;
  const isToday = days === 0;
  const isUrgent = days > 0 && days <= 15;
  const isSoon = days > 0 && days <= 30;

  let color: string;
  let bg: string;
  let Icon: typeof CalendarDays;
  let label: string;

  if (isPast) {
    color = "text-slate-400";
    bg = "bg-slate-50";
    Icon = XCircle;
    label = `Closed ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
  } else if (isToday) {
    color = "text-danger";
    bg = "bg-danger-50";
    Icon = AlertTriangle;
    label = "Due today!";
  } else if (isUrgent) {
    color = "text-danger";
    bg = "bg-danger-50";
    Icon = AlertTriangle;
    label = `${days} day${days !== 1 ? "s" : ""} left`;
  } else if (isSoon) {
    color = "text-warning";
    bg = "bg-warning-50";
    Icon = Timer;
    label = `${days} day${days !== 1 ? "s" : ""} left`;
  } else {
    color = "text-success";
    bg = "bg-success-50";
    Icon = CalendarDays;
    label = `${days} day${days !== 1 ? "s" : ""} left`;
  }

  const dateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (size === "sm") {
    return (
      <span className={cn("inline-flex items-center gap-1 font-medium", color, className)}>
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm", bg, className)}>
      <Icon className={cn("h-4 w-4", color)} />
      <div>
        <span className={cn("font-medium", color)}>{label}</span>
        {showDate && <span className="ml-1.5 text-muted-foreground text-xs">· {dateStr}</span>}
      </div>
    </div>
  );
}
