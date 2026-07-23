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
        className={cn("shrink-0", className)}
        classNames={{
          base: "bg-default-300",
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
