"use client";

import { forwardRef } from "react";
import { Checkbox as HeroCheckbox } from "@heroui/react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
    return (
      <HeroCheckbox
        ref={ref as any}
        isSelected={checked}
        onValueChange={onCheckedChange}
        isDisabled={disabled}
        id={id}
        color="primary"
        radius="md"
        className={cn("w-min", className)}
        {...(props as any)}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
