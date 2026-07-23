"use client";

import {
  Accordion as HeroAccordion,
  AccordionItem as HeroAccordionItem,
} from "@heroui/react";
import { cn } from "@/lib/utils";

function Accordion({
  children,
  className,
  ...props
}: React.ComponentProps<typeof HeroAccordion>) {
  return (
    <HeroAccordion
      variant="light"
      className={cn("", className)}
      {...(props as any)}
    >
      {children}
    </HeroAccordion>
  );
}

function AccordionItem({
  children,
  className,
  ...props
}: React.ComponentProps<typeof HeroAccordionItem>) {
  return (
    <HeroAccordionItem
      className={cn("border-b border-divider", className)}
      {...(props as any)}
    >
      {children}
    </HeroAccordionItem>
  );
}

function AccordionTrigger(_props: React.ComponentProps<"div">) {
  return null;
}

function AccordionContent(_props: React.ComponentProps<"div">) {
  return null;
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
