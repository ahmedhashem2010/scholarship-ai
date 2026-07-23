"use client";

import { Chip } from "@heroui/react";
import { CalendarDays, AlertTriangle, Timer, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeadlineIndicatorProps {
  deadline: Date | string | null;
  className?: string;
  showDate?: boolean;
  size?: "sm" | "md";
}

export function DeadlineIndicator({ deadline, className, showDate = true, size = "md" }: DeadlineIndicatorProps) {
  if (!deadline) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-default-500", size === "sm" ? "text-xs" : "text-sm", className)}>
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

  let color: "default" | "success" | "warning" | "danger";
  let Icon: typeof CalendarDays;
  let label: string;

  if (isPast) {
    color = "default";
    Icon = XCircle;
    label = `Closed ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
  } else if (isToday) {
    color = "danger";
    Icon = AlertTriangle;
    label = "Due today!";
  } else if (isUrgent) {
    color = "danger";
    Icon = AlertTriangle;
    label = `${days} day${days !== 1 ? "s" : ""} left`;
  } else if (isSoon) {
    color = "warning";
    Icon = Timer;
    label = `${days} day${days !== 1 ? "s" : ""} left`;
  } else {
    color = "success";
    Icon = CalendarDays;
    label = `${days} day${days !== 1 ? "s" : ""} left`;
  }

  const dateStr = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (size === "sm") {
    return (
      <span className={cn("inline-flex items-center gap-1 font-medium text-sm", className)}>
        <Icon className={cn("h-3 w-3", {
          "text-default-400": color === "default",
          "text-success": color === "success",
          "text-warning": color === "warning",
          "text-danger": color === "danger",
        })} />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <Chip
      variant="flat"
      color={color}
      startContent={<Icon className="h-3.5 w-3.5" />}
      className={cn("h-auto", className)}
      classNames={{
        content: "px-0",
      }}
    >
      {label}
      {showDate && <span className="ml-1.5 text-default-400 text-xs">· {dateStr}</span>}
    </Chip>
  );
}
