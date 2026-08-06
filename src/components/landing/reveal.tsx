"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal wrapper.
 *
 * Content is visible by default (in the server-rendered HTML and with JS off).
 * After mount, elements confirmed to be below the fold are hidden and animate
 * in via IntersectionObserver when scrolled into view. See the `.reveal` rules
 * in globals.css — hiding is instant, only the reveal toward visible animates,
 * and `prefers-reduced-motion` disables it entirely.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
}: {
  children: ReactNode;
  className?: string;
  /** Transition delay in ms — use ~80–120ms increments to stagger a grid. */
  delay?: number;
  /** Entry direction for the reveal. */
  from?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "pending" | "visible">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setState("visible");
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setState("visible");
      return;
    }
    setState("pending");
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setState("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-pending={state === "pending" ? "true" : undefined}
      className={cn("reveal", from !== "up" && `from-${from}`, state === "visible" && "is-visible", className)}
      style={state === "pending" ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
