"use client";

import { cn } from "@/lib/utils";

function Tabs({ children, className, ...props }: any) {
  return (
    <div data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props}>
      {children}
    </div>
  );
}

function TabsList({ children, className, ...props }: any) {
  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(
        "bg-default-100 text-default-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function TabsTrigger({ children, value, className, ...props }: any) {
  return (
    <button
      role="tab"
      data-slot="tabs-trigger"
      data-state="inactive"
      className={cn(
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ children, value, className, ...props }: any) {
  return (
    <div
      role="tabpanel"
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
