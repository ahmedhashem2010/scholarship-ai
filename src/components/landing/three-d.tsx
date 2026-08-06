"use client";

import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Landing 3D object library.
 *
 * Real 3D assets would cost the bundle three fetch-heavy renderers and a
 * scene graph. Instead these are hand-drawn 2.5D illustrations: layered
 * gradient fills, a consistent top-left light, and a soft drop shadow give
 * each one the volume of a studio render at a fraction of the weight. They
 * are the landing page's substitute for generic iconography — the objects
 * that make a scholarship feel tangible (caps, letters, globes, medals).
 *
 * Every gradient id is suffixed with a `useId()` so multiple instances of the
 * same object on one page never collide in the SVG id namespace.
 */

const NAVY = {
  900: "#0b1f3a",
  800: "#12294b",
  700: "#1b3a5f",
  500: "#24406b",
  300: "#4b6a99",
  100: "#8aa3c2",
} as const;

const GOLD = {
  200: "#f0d88e",
  300: "#e3c171",
  400: "#d5b45c",
  500: "#c6a14b",
  700: "#a3762e",
} as const;

export type ThreeDVariant =
  | "cap"
  | "letter"
  | "uni"
  | "globe"
  | "plane"
  | "passport"
  | "books"
  | "diploma"
  | "suitcase"
  | "star"
  | "pin"
  | "medal"
  | "sparkle";

const SHADOW_FILTER = (
  id: string
) => `<filter id="${id}" x="-40%" y="-40%" width="180%" height="200%">
  <feDropShadow dx="0" dy="7" stdDeviation="6" flood-color="${NAVY["900"]}" flood-opacity="0.26"/>
</filter>`;

const STAR = (id: string, cx: number, cy: number, r: number) => {
  const s = (n: number) => `${cx},${cy - n}`;
  const p = (x: number, y: number) => `${cx + x},${cy + y}`;
  const r1 = r;
  const r2 = r * 0.42;
  return (
    <path
      d={`${s(r1)} ${p(r1 * 0.588, -r1 * 0.809)} ${p(r1 * 0.951, -r1 * 0.309)} ${p(r1 * 0.309, -r1 * 0.309)} ${p(r2, -r2)} ${p(-r1 * 0.309, -r1 * 0.309)} ${p(-r1 * 0.951, -r1 * 0.309)} ${p(-r1 * 0.588, -r1 * 0.809)} ${s(-r1)} ${p(-r1 * 0.588, r1 * 0.809)} ${p(-r1 * 0.951, r1 * 0.309)} ${p(-r1 * 0.309, r1 * 0.309)} ${p(-r2, r2)} ${p(r1 * 0.309, r1 * 0.309)} ${p(r1 * 0.951, r1 * 0.309)} ${p(r1 * 0.588, r1 * 0.809)} Z`}
      fill={`url(#${id})`}
    />
  );
};

/** Renders a single 3D illustration. The SVG fills its parent — size with the wrapper. */
export function ThreeDObject({ variant, className }: { variant: ThreeDVariant; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const grad = (name: string) => `g-${uid}-${name}`;
  const filter = `f-${uid}`;

  const svg = (viewBox: string, children: React.ReactNode) => (
    <svg viewBox={viewBox} className={cn("h-full w-full", className)} aria-hidden="true">
      <defs dangerouslySetInnerHTML={{ __html: SHADOW_FILTER(filter) }} />
      <g filter={`url(#${filter})`}>{children}</g>
    </svg>
  );

  switch (variant) {
    case "cap":
      return svg(
        "0 0 120 104",
        <>
          <defs>
            <linearGradient id={grad("top")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2c4a75" />
              <stop offset="1" stopColor={NAVY["800"]} />
            </linearGradient>
            <linearGradient id={grad("side")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1e3a63" />
              <stop offset="1" stopColor={NAVY["900"]} />
            </linearGradient>
            <linearGradient id={grad("gold")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["500"]} />
            </linearGradient>
          </defs>
          <path d="M34 64 Q60 82 86 64 L86 76 Q60 92 34 76 Z" fill={`url(#${grad("side")})`} />
          <path d="M16 44 L60 66 L60 80 L16 58 Z" fill={NAVY["900"]} />
          <path d="M60 66 L104 44 L104 58 L60 80 Z" fill={`url(#${grad("side")})`} />
          <path d="M16 44 L60 22 L104 44 L60 66 Z" fill={`url(#${grad("top")})`} />
          <circle cx="60" cy="44" r="5" fill={`url(#${grad("gold")})`} />
          <circle cx="57.5" cy="41.5" r="1.7" fill="#ffffff" opacity="0.75" />
          <path d="M60 44 Q80 48 90 66 L90 88" stroke={`url(#${grad("gold")})`} strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="90" cy="88" r="5" fill={`url(#${grad("gold")})`} />
        </>
      );

    case "letter":
      return svg(
        "0 0 120 104",
        <>
          <defs>
            <linearGradient id={grad("flap")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2c4a75" />
              <stop offset="1" stopColor={NAVY["800"]} />
            </linearGradient>
            <radialGradient id={grad("seal")} cx="35%" cy="30%" r="85%">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["700"]} />
            </radialGradient>
          </defs>
          <rect x="22" y="30" width="76" height="58" rx="10" fill="#faf8f3" stroke="#e6e0d3" strokeWidth="1.5" />
          <path d="M22 36 L60 62 L98 36 L98 30 L22 30 Z" fill={`url(#${grad("flap")})`} />
          <path d="M22 36 L60 62 L98 36" fill="none" stroke="#e6e0d3" strokeWidth="1.5" />
          <path d="M36 76 L84 76" stroke={GOLD["500"]} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M46 82 L74 82" stroke={GOLD["400"]} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
          <circle cx="60" cy="62" r="13" fill={`url(#${grad("seal")})`} />
          {STAR(grad("sealStar"), 60, 62, 6)}
        </>
      );

    case "uni":
      return svg(
        "0 0 120 104",
        <>
          <defs>
            <linearGradient id={grad("body")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2c4a75" />
              <stop offset="1" stopColor={NAVY["800"]} />
            </linearGradient>
            <linearGradient id={grad("roof")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1b3a5f" />
              <stop offset="1" stopColor={NAVY["900"]} />
            </linearGradient>
            <linearGradient id={grad("gold")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["500"]} />
            </linearGradient>
          </defs>
          <path d="M57 8 L63 8 L60 2 Z" fill={`url(#${grad("gold")})`} />
          <path d="M14 38 L60 10 L106 38 L106 48 L14 48 Z" fill={`url(#${grad("roof")})`} />
          <path d="M14 38 L60 10 L106 38 Z" fill="none" stroke={GOLD["500"]} strokeWidth="2" opacity="0.6" />
          <rect x="20" y="48" width="80" height="34" rx="2" fill={`url(#${grad("body")})`} />
          <rect x="26" y="48" width="9" height="34" fill={NAVY["300"]} opacity="0.85" />
          <rect x="42" y="48" width="9" height="34" fill={NAVY["300"]} opacity="0.85" />
          <rect x="69" y="48" width="9" height="34" fill={NAVY["300"]} opacity="0.85" />
          <rect x="85" y="48" width="9" height="34" fill={NAVY["300"]} opacity="0.85" />
          <rect x="54" y="62" width="12" height="20" rx="6" fill={`url(#${grad("gold")})`} />
          <rect x="46" y="82" width="28" height="4" rx="2" fill={NAVY["900"]} />
        </>
      );

    case "globe":
      return svg(
        "0 0 120 104",
        <>
          <defs>
            <radialGradient id={grad("sphere")} cx="32%" cy="26%" r="90%">
              <stop offset="0" stopColor="#6f97c8" />
              <stop offset="55%" stopColor={NAVY["500"]} />
              <stop offset="100%" stopColor={NAVY["800"]} />
            </radialGradient>
            <linearGradient id={grad("gold")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["500"]} />
            </linearGradient>
          </defs>
          <ellipse cx="60" cy="58" rx="47" ry="17" fill="none" stroke={`url(#${grad("gold")})`} strokeWidth="3.5" transform="rotate(-16 60 58)" />
          <circle cx="60" cy="60" r="38" fill={`url(#${grad("sphere")})`} />
          <ellipse cx="60" cy="60" rx="38" ry="14" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.5" />
          <ellipse cx="60" cy="60" rx="14" ry="38" fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.5" />
          <path d="M44 48 Q50 44 56 46 Q62 44 64 48 Q66 54 62 58 Q58 64 50 62 Q44 58 44 48 Z" fill={`url(#${grad("gold")})`} opacity="0.85" />
          <circle cx="72" cy="70" r="6" fill={`url(#${grad("gold")})`} opacity="0.85" />
          <circle cx="79" cy="60" r="4" fill={`url(#${grad("gold")})`} opacity="0.7" />
          <ellipse cx="46" cy="45" rx="13" ry="8" fill="#ffffff" opacity="0.22" transform="rotate(-30 46 45)" />
        </>
      );

    case "plane":
      return svg(
        "0 0 120 96",
        <>
          <defs>
            <linearGradient id={grad("body")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={NAVY["300"]} />
              <stop offset="1" stopColor={NAVY["800"]} />
            </linearGradient>
            <linearGradient id={grad("gold")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["500"]} />
            </linearGradient>
          </defs>
          <path
            d="M6 64 Q34 62 52 53 L58 48"
            stroke={`url(#${grad("gold")})`}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="0.5 9"
            opacity="0.95"
          />
          <g transform="translate(26 28) scale(2.6)">
            <path
              d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
              fill={`url(#${grad("body")})`}
            />
            <path d="M4.8 6.2 13 8l-4.8 6.5z" fill={GOLD["500"]} />
          </g>
        </>
      );

    case "passport":
      return svg(
        "0 0 120 100",
        <>
          <defs>
            <linearGradient id={grad("cover")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2c4a75" />
              <stop offset="1" stopColor={NAVY["800"]} />
            </linearGradient>
            <linearGradient id={grad("gold")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["500"]} />
            </linearGradient>
          </defs>
          <rect x="12" y="12" width="96" height="76" rx="11" fill={`url(#${grad("cover")})`} />
          <circle cx="88" cy="26" r="11" fill="none" stroke={`url(#${grad("gold")})`} strokeWidth="2.5" />
          {STAR(grad("emblem"), 88, 26, 5.5)}
          <rect x="24" y="34" width="32" height="48" rx="3" fill="#faf8f3" />
          <rect x="64" y="34" width="32" height="48" rx="3" fill="#faf8f3" />
          <rect x="56" y="34" width="8" height="48" rx="2" fill={GOLD["500"]} />
          <rect x="30" y="44" width="20" height="2.5" rx="1.25" fill="#d9d2c2" />
          <rect x="30" y="52" width="20" height="2.5" rx="1.25" fill="#d9d2c2" />
          <rect x="30" y="60" width="13" height="2.5" rx="1.25" fill="#d9d2c2" />
          <rect x="70" y="44" width="20" height="2.5" rx="1.25" fill="#d9d2c2" />
          <rect x="70" y="52" width="20" height="2.5" rx="1.25" fill="#d9d2c2" />
          <rect x="70" y="60" width="13" height="2.5" rx="1.25" fill="#d9d2c2" />
        </>
      );

    case "books":
      return svg(
        "0 0 120 100",
        <>
          <defs>
            <linearGradient id={grad("navy")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2c4a75" />
              <stop offset="1" stopColor={NAVY["800"]} />
            </linearGradient>
            <linearGradient id={grad("gold")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["500"]} />
            </linearGradient>
            <linearGradient id={grad("paper")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#faf8f3" />
              <stop offset="1" stopColor="#efe9db" />
            </linearGradient>
          </defs>
          <rect x="22" y="68" width="76" height="18" rx="4" fill={`url(#${grad("navy")})`} />
          <rect x="22" y="68" width="11" height="18" rx="4" fill={NAVY["900"]} />
          <rect x="26" y="50" width="70" height="18" rx="4" fill={`url(#${grad("gold")})`} />
          <rect x="26" y="50" width="10" height="18" rx="4" fill={GOLD["700"]} />
          <rect x="42" y="57" width="40" height="3" rx="1.5" fill="#ffffff" opacity="0.5" />
          <rect x="30" y="32" width="64" height="18" rx="4" fill={`url(#${grad("paper")})`} />
          <rect x="30" y="32" width="9" height="18" rx="4" fill="#d9d2c2" />
          <rect x="30" y="34" width="64" height="1.5" fill="#ffffff" opacity="0.9" />
          <rect x="46" y="39" width="36" height="3" rx="1.5" fill={GOLD["500"]} />
          <path d="M78 32 L84 32 L84 48 L81 44 L78 48 Z" fill={`url(#${grad("gold")})`} />
        </>
      );

    case "diploma":
      return svg(
        "0 0 120 104",
        <>
          <defs>
            <linearGradient id={grad("parch")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f6efdd" />
              <stop offset="1" stopColor="#e8dcc0" />
            </linearGradient>
            <linearGradient id={grad("roll")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#e8dcc0" />
              <stop offset="1" stopColor="#cfbd92" />
            </linearGradient>
            <linearGradient id={grad("gold")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["500"]} />
            </linearGradient>
          </defs>
          <g transform="rotate(-18 60 52)">
            <rect x="34" y="24" width="52" height="56" rx="26" fill={`url(#${grad("parch")})`} />
            <rect x="34" y="24" width="52" height="26" rx="13" fill={`url(#${grad("roll")})`} />
            <ellipse cx="86" cy="52" rx="9" ry="28" fill={`url(#${grad("roll")})`} />
            <ellipse cx="86" cy="52" rx="5" ry="26" fill="#f6efdd" />
            <rect x="50" y="24" width="17" height="56" fill={`url(#${grad("gold")})`} />
            <rect x="50" y="24" width="17" height="56" fill={GOLD["500"]} opacity="0.35" />
          </g>
          <circle cx="60" cy="52" r="8.5" fill={`url(#${grad("gold")})`} />
        </>
      );

    case "suitcase":
      return svg(
        "0 0 120 104",
        <>
          <defs>
            <linearGradient id={grad("navy")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2c4a75" />
              <stop offset="1" stopColor={NAVY["800"]} />
            </linearGradient>
            <linearGradient id={grad("gold")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["500"]} />
            </linearGradient>
          </defs>
          <path d="M50 28 Q60 16 70 28" fill="none" stroke={`url(#${grad("navy")})`} strokeWidth="7" strokeLinecap="round" />
          <rect x="22" y="28" width="76" height="52" rx="12" fill={`url(#${grad("navy")})`} />
          <rect x="34" y="28" width="9" height="52" fill={GOLD["500"]} opacity="0.85" />
          <rect x="77" y="28" width="9" height="52" fill={GOLD["500"]} opacity="0.85" />
          <rect x="52" y="28" width="16" height="9" rx="4" fill={`url(#${grad("gold")})`} />
          <circle cx="36" cy="84" r="5" fill={NAVY["900"]} />
          <circle cx="84" cy="84" r="5" fill={NAVY["900"]} />
          <path d="M32 34 Q60 40 88 34 L88 40 Q60 46 32 40 Z" fill="#ffffff" opacity="0.14" />
        </>
      );

    case "star":
      return svg(
        "0 0 120 104",
        <>
          <defs>
            <radialGradient id={grad("gold")} cx="35%" cy="28%" r="90%">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="60%" stopColor={GOLD["400"]} />
              <stop offset="100%" stopColor={GOLD["700"]} />
            </radialGradient>
          </defs>
          <path
            d="M60 10 L70 38 L100 38 L75 57 L84 88 L60 69 L36 88 L45 57 L20 38 L50 38 Z"
            fill={`url(#${grad("gold")})`}
          />
          <ellipse cx="48" cy="34" rx="11" ry="5.5" fill="#ffffff" opacity="0.55" transform="rotate(-22 48 34)" />
          <circle cx="96" cy="24" r="2.2" fill={GOLD["400"]} />
          <circle cx="28" cy="82" r="1.8" fill={GOLD["500"]} />
        </>
      );

    case "pin":
      return svg(
        "0 0 120 110",
        <>
          <defs>
            <linearGradient id={grad("navy")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2c4a75" />
              <stop offset="1" stopColor={NAVY["800"]} />
            </linearGradient>
            <linearGradient id={grad("gold")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["500"]} />
            </linearGradient>
          </defs>
          <path d="M60 8 C80 8 94 24 94 44 C94 66 60 100 60 100 C60 100 26 66 26 44 C26 24 40 8 60 8 Z" fill={`url(#${grad("navy")})`} />
          <circle cx="60" cy="43" r="18" fill="#ffffff" />
          <circle cx="60" cy="43" r="9" fill={`url(#${grad("gold")})`} />
          <path d="M40 24 Q52 18 58 22" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.35" fill="none" />
          <path d="M98 12 L101 19 L108 22 L101 25 L98 32 L95 25 L88 22 L95 19 Z" fill={`url(#${grad("gold")})`} />
        </>
      );

    case "medal":
      return svg(
        "0 0 120 112",
        <>
          <defs>
            <radialGradient id={grad("gold")} cx="35%" cy="30%" r="85%">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="55%" stopColor={GOLD["400"]} />
              <stop offset="100%" stopColor={GOLD["700"]} />
            </radialGradient>
            <linearGradient id={grad("ribbon")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#24406b" />
              <stop offset="1" stopColor={NAVY["800"]} />
            </linearGradient>
          </defs>
          <path d="M48 6 L52 40 L41 46 Z" fill={`url(#${grad("ribbon")})`} />
          <path d="M72 6 L68 40 L79 46 Z" fill={NAVY["700"]} />
          <circle cx="60" cy="68" r="35" fill={`url(#${grad("gold")})`} />
          <circle cx="60" cy="68" r="27" fill="none" stroke={GOLD["700"]} strokeWidth="2" opacity="0.7" />
          {STAR(grad("inner"), 60, 68, 13)}
          <ellipse cx="47" cy="54" rx="10" ry="5.5" fill="#ffffff" opacity="0.5" transform="rotate(-25 47 54)" />
        </>
      );

    case "sparkle":
      return svg(
        "0 0 120 104",
        <>
          <defs>
            <linearGradient id={grad("gold")} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={GOLD["200"]} />
              <stop offset="1" stopColor={GOLD["500"]} />
            </linearGradient>
          </defs>
          <path
            d="M60 24 L64.5 36 L76.5 40 L64.5 44 L60 56 L55.5 44 L43.5 40 L55.5 36 Z"
            fill={`url(#${grad("gold")})`}
          />
          <circle cx="92" cy="52" r="2.5" fill={GOLD["400"]} />
          <circle cx="30" cy="30" r="1.8" fill={GOLD["500"]} />
          <circle cx="26" cy="72" r="1.4" fill={GOLD["400"]} />
        </>
      );
  }
}

/**
 * A 3D object with its own ground shadow and a slow float.
 *
 * The shadow is a sibling that stays put while the SVG translates up and
 * down — that single detail is what sells the "hovering in mid-air" feel.
 * Size the whole thing with `className` (e.g. `h-24 w-28`).
 */
export function Float3D({
  variant,
  className,
  delay = 0,
  duration = 6,
  tilt = 0,
  float = true,
  shadow = true,
}: {
  variant: ThreeDVariant;
  className?: string;
  /** Animation delay in seconds — shift the phase so objects don't bob in sync. */
  delay?: number;
  /** Full float cycle in seconds. */
  duration?: number;
  /** Degrees of rotation at the float midpoint (soft objects only). */
  tilt?: number;
  float?: boolean;
  shadow?: boolean;
}) {
  return (
    <div className={cn("relative", className)} aria-hidden="true">
      {shadow && (
        <span className="absolute inset-x-0 -bottom-2 flex justify-center">
          <span className="block h-3 w-3/5 rounded-[50%] bg-[#0b1f3a]/25 blur-[6px]" />
        </span>
      )}
      <div
        className={float ? (tilt ? "obj-float-soft" : "obj-float") : undefined}
        style={
          {
            "--float-dur": `${duration}s`,
            "--tilt": `${tilt}deg`,
            animationDelay: `${delay}s`,
          } as CSSProperties
        }
      >
        <ThreeDObject variant={variant} />
      </div>
    </div>
  );
}
