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
    return (
      <HeroInput
        ref={ref}
        label={label}
        helperText={helperText}
        errorMessage={errorMessage}
        isInvalid={isInvalid}
        radius="lg"
        variant="flat"
        classNames={{
          input: "text-sm",
          inputWrapper: "bg-default-100",
        }}
        className={cn("w-full", className)}
        {...(props as any)}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
