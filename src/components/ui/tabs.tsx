"use client";

import {
  Tabs as HeroTabs,
  Tab as HeroTab,
} from "@heroui/react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <HeroTabs
      selectedKey={value}
      onSelectionChange={(key) => onValueChange?.(String(key))}
      variant="light"
      color="primary"
      classNames={{
        tabList: "gap-1 w-full relative rounded-xl p-1 bg-default-100",
        cursor: "w-full bg-white shadow-md rounded-xl",
        tab: "max-w-fit px-4 h-9",
        tabContent: "group-data-[selected=true]:text-primary",
      }}
      className={cn("", className)}
    >
      {children}
    </HeroTabs>
  );
}

function TabsList(_props: any) {
  return null;
}

function TabsTrigger({ children, value, ...props }: any) {
  return (
    <HeroTab key={value} title={children} {...props} />
  );
}

function TabsContent({ children, value, className, ...props }: any) {
  return (
    <div
      role="tabpanel"
      className={cn("mt-2 outline-none", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
