"use client";

import { Skeleton as HeroSkeleton } from "@heroui/react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = "text", width, height }: SkeletonProps) {
  const variants = {
    text: "h-4 rounded-md",
    card: "h-32 rounded-2xl",
    circle: "rounded-full aspect-square",
    rect: "rounded-xl",
  };

  return (
    <HeroSkeleton
      className={cn(variants[variant], className)}
      style={{ width, height }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-full max-w-md" />
      </div>

      <div className="relative rounded-3xl bg-muted/40 p-8">
        <div className="max-w-xl space-y-4">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-40 rounded-xl" />
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
          <div className="grid max-w-lg grid-cols-3 gap-4 pt-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-divider bg-content1 p-5 space-y-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-divider bg-content1 p-4">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-14" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
          <div className="rounded-2xl bg-muted/50 p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DocumentSkeleton() {
  return (
    <div className="page-container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-divider bg-content1 p-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-44 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="space-y-6">
          <div className="flex items-center gap-6 rounded-2xl border border-divider bg-content1 p-6">
            <Skeleton className="h-24 w-24 circle" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-divider bg-content1 p-6 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-divider bg-content1 p-4 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="rounded-2xl border border-divider bg-content1 p-4 space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
