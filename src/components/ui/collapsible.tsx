"use client";

function Collapsible({ children, ...props }: any) {
  return <div data-slot="collapsible" {...props}>{children}</div>;
}

function CollapsibleTrigger({ children, ...props }: any) {
  return <div data-slot="collapsible-trigger" {...props}>{children}</div>;
}

function CollapsibleContent({ children, ...props }: any) {
  return <div data-slot="collapsible-content" {...props}>{children}</div>;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
