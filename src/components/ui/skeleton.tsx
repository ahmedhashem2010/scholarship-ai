import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = "text", width, height }: SkeletonProps) {
  const variants = {
    text: "h-4 rounded",
    card: "h-32 rounded-xl",
    circle: "rounded-full aspect-square",
    rect: "rounded-lg",
  };

  return (
    <div
      className={cn("skeleton", variants[variant], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page-container py-8 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-5 w-80" />
      </div>
      <Skeleton className="h-28 rounded-2xl" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8 circle" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        ))}
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
          <div key={i} className="flex items-center gap-4 rounded-xl border bg-white p-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-lg" />
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
        <Skeleton className="h-9 w-44 rounded-lg" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
        <div className="space-y-6">
          <div className="flex items-center gap-6 rounded-xl border bg-white p-6">
            <Skeleton className="h-24 w-24 circle" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-6 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="rounded-xl border bg-white p-4 space-y-2">
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
