"use client";

import {
  Dropdown as HeroDropdown,
  DropdownTrigger as HeroDropdownTrigger,
  DropdownItem as HeroDropdownItem,
} from "@heroui/react";
import { cn } from "@/lib/utils";
import { useId } from "react";

const DropdownMenu = HeroDropdown;

function DropdownMenuTrigger({ children, ...props }: any) {
  return (
    <HeroDropdownTrigger {...props}>
      <span className="contents">{children}</span>
    </HeroDropdownTrigger>
  );
}

function DropdownMenuContent({ children, ...props }: any) {
  return <div {...props}>{children}</div>;
}

function DropdownMenuItem({ children, className, destructive }: any) {
  const id = useId();
  return (
    <HeroDropdownItem
      key={id}
      className={cn(destructive && "text-danger", className)}
    >
      {children}
    </HeroDropdownItem>
  );
}

function DropdownMenuCheckboxItem({ children }: any) {
  const id = useId();
  return <HeroDropdownItem key={id}>{children}</HeroDropdownItem>;
}

function DropdownMenuRadioItem({ children }: any) {
  const id = useId();
  return <HeroDropdownItem key={id}>{children}</HeroDropdownItem>;
}

function DropdownMenuLabel({ children, className, ...props }: any) {
  return (
    <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props}>
      {children}
    </div>
  );
}

function DropdownMenuSeparator({ className, ...props }: any) {
  return <div className={cn("-mx-1 my-1 h-px bg-default-200", className)} {...props} />;
}

function DropdownMenuShortcut({ className, ...props }: any) {
  return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />;
}

function DropdownMenuGroup({ children, ...props }: any) {
  return <div {...props}>{children}</div>;
}

function DropdownMenuPortal({ children }: any) {
  return <>{children}</>;
}

function DropdownMenuSub({ children, ...props }: any) {
  return <div {...props}>{children}</div>;
}

function DropdownMenuSubContent({ children, ...props }: any) {
  return <div {...props}>{children}</div>;
}

function DropdownMenuSubTrigger({ children, ...props }: any) {
  return <div {...props}>{children}</div>;
}

function DropdownMenuRadioGroup({ children, ...props }: any) {
  return <div {...props}>{children}</div>;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
