"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Magnetic hover wrapper.
 *
 * The child nudges toward the cursor and springs back when it leaves — the
 * small physical pull that makes CTAs feel alive rather than clickable.
 * Transform-only, and it self-disables under `prefers-reduced-motion`.
 */
export function Magnetic({
  children,
  className,
  strength = 0.28,
}: {
  children: ReactNode;
  className?: string;
  /** How far the child follows the cursor, as a fraction of the offset. */
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const disabled = useRef(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    disabled.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  function onMove(e: React.MouseEvent) {
    if (disabled.current) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    setOffset({ x: dx, y: dy });
  }

  function onLeave() {
    setOffset({ x: 0, y: 0 });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("magnetic", className)}
      style={{
        transform: offset.x || offset.y ? `translate(${offset.x}px, ${offset.y}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
}
