"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: any;
  className?: string;
}

function Select({ value, onValueChange, children, className }: SelectProps) {
  const items: { value: string; label: string }[] = [];

  const extractItems = (node: any): void => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(extractItems);
      return;
    }
    if (node?.props?.value !== undefined) {
      items.push({ value: node.props.value, label: String(node.props.children ?? node.props.value) });
    }
  };

  extractItems(children);

  return (
    <div className={cn("relative", className)}>
      <select
        value={value ?? ""}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="flex h-12 w-full appearance-none items-center rounded-xl border border-default-200 bg-default-100 px-4 py-3 pr-10 text-sm text-foreground shadow-sm transition-colors hover:bg-default-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-default-400" />
    </div>
  );
}

function SelectItem(_props: any) {
  return null;
}

export { Select, SelectItem };
