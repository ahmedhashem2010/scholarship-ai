"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Input as HeroInput } from "@heroui/react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isInvalid?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, errorMessage, isInvalid, ...props }, ref) => {
    if (label || helperText || errorMessage) {
      return (
        <HeroInput
          ref={ref}
          label={label}
          helperText={helperText}
          errorMessage={errorMessage}
          isInvalid={isInvalid}
          className={cn("w-full", className)}
          {...(props as any)}
        />
      );
    }

    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-default-300 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-default-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
