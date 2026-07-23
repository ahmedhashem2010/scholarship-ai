"use client";

import { createContext, useContext, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = createContext<SelectContextType>({});

function Select({ children, value, onValueChange, ...props }: any) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div data-slot="select" className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function SelectGroup({ children, ...props }: any) {
  return <div data-slot="select-group" {...props}>{children}</div>;
}

const SelectValue = forwardRef<HTMLSpanElement, any>(
  ({ placeholder, className }, _ref) => {
    const { value } = useContext(SelectContext);
    return (
      <span className={cn("block truncate", !value && "text-default-400", className)}>
        {value || placeholder}
      </span>
    );
  }
);
SelectValue.displayName = "SelectValue";

const SelectTrigger = forwardRef<HTMLButtonElement, any>(
  ({ children, className }, _ref) => (
    <button
      type="button"
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-default-300 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
      <svg className="h-4 w-4 opacity-50 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
);
SelectTrigger.displayName = "SelectTrigger";

function SelectContent(_props: any) {
  return null;
}

function SelectItem(_props: any) {
  return null;
}

function SelectSeparator({ className, ...props }: any) {
  return <div className={cn("-mx-1 my-1 h-px bg-default-200", className)} {...props} />;
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
};
