"use client";

import { forwardRef } from "react";
import { Avatar as HeroAvatar } from "@heroui/react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  className?: string;
  src?: string;
  alt?: string;
  fallback?: string;
  children?: React.ReactNode;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, children }, ref) => {
    return (
      <HeroAvatar
        ref={ref as any}
        src={src}
        alt={alt}
        name={fallback}
        radius="full"
        className={cn("shrink-0", className)}
        classNames={{
          base: "bg-primary/15 text-primary",
          img: "object-cover",
        }}
      >
        {children}
      </HeroAvatar>
    );
  }
);
Avatar.displayName = "Avatar";

function AvatarImage(_props: React.ComponentProps<"img">) {
  return null;
}

function AvatarFallback(_props: React.ComponentProps<"div">) {
  return null;
}

export { Avatar, AvatarImage, AvatarFallback };
