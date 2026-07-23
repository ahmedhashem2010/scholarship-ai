"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Button as HeroButton, type ButtonProps as HeroButtonProps } from "@heroui/react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
type Size = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variantMap: Record<Variant, HeroButtonProps["variant"]> = {
  default: "solid",
  outline: "bordered",
  secondary: "flat",
  ghost: "light",
  destructive: "solid",
  link: "light",
};

const colorMap: Record<Variant, HeroButtonProps["color"]> = {
  default: "primary",
  outline: "default",
  secondary: "default",
  ghost: "default",
  destructive: "danger",
  link: "primary",
};

const sizeMap: Record<Size, HeroButtonProps["size"]> = {
  default: "md",
  xs: "sm",
  sm: "sm",
  lg: "lg",
  icon: "md",
  "icon-xs": "sm",
  "icon-sm": "sm",
  "icon-lg": "lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    const isIcon = size.startsWith("icon");
    const isLink = variant === "link";

    return (
      <HeroButton
        ref={ref}
        variant={variantMap[variant]}
        color={colorMap[variant]}
        size={sizeMap[size]}
        isIconOnly={isIcon}
        className={cn(
          isLink && "p-0 h-auto min-h-0 text-primary underline underline-offset-4 hover:opacity-80",
          variant === "destructive" && "bg-danger text-white",
          className
        )}
        {...(props as any)}
      >
        {children}
      </HeroButton>
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
