"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface HelpTooltipProps {
  text: string;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function HelpTooltip({ text, side = "top", className = "" }: HelpTooltipProps) {
  const { pick, isRTL } = useLanguage();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // "left"/"right" are visual sides, not text-flow start/end — flip them in
  // RTL so a tooltip anchored to one physical side of the trigger stays there.
  const resolvedSide = isRTL ? (side === "left" ? "right" : side === "right" ? "left" : side) : side;

  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible]);

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="-m-2.5 inline-flex items-center justify-center p-2.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={pick("مساعدة", "Help")}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {visible && (
        <div
          className={`absolute z-50 w-56 max-w-[calc(100vw-2rem)] rounded-lg border bg-card p-2.5 shadow-lg ring-1 ring-black/5 text-xs text-foreground animate-scale-in ${sideClasses[resolvedSide]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
}
