import type { Config } from "tailwindcss";

/**
 * Builds a full 50–900 scale plus DEFAULT and foreground from CSS variables.
 *
 * WHY THIS EXISTS
 *
 * Roughly 106 places in the codebase already used classes like
 * `bg-primary-50`, `text-success-700` and `border-danger-200`. None of those
 * stops were defined, so Tailwind emitted nothing for them and the elements
 * silently inherited whatever was around them — which is why the auth error
 * boxes looked unstyled and several "coloured" panels were plain white.
 *
 * Generating the scale fixes every one of them without touching a component,
 * and it means the next person who reaches for `-300` gets a real colour
 * instead of a no-op.
 */
const scale = (name: string, withForeground = true) => ({
  DEFAULT: `rgb(var(--${name}) / <alpha-value>)`,
  ...(withForeground
    ? { foreground: `rgb(var(--${name}-foreground) / <alpha-value>)` }
    : {}),
  ...Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((stop) => [
      String(stop),
      `rgb(var(--${name}-${stop}) / <alpha-value>)`,
    ])
  ),
});

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        // Small phones. Tailwind's smallest default is `sm` at 640px, which is
        // a tablet — so anything "responsive" was really desktop-vs-tablet and
        // 360-390px handsets got the tightest layout. Most MENA traffic is on
        // exactly those devices.
        xs: "400px",
      },
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        primary: scale("primary"),
        secondary: scale("secondary"),
        success: scale("success"),
        warning: scale("warning"),
        danger: scale("danger"),
        // "The source didn't say." Its own colour, never amber — amber sits
        // beside gold, and gold means arrival.
        unknown: scale("unknown"),
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        // Match-score bands. Re-pointed at the brand ramps: the old values
        // were stock Tailwind red/amber/green and were the loudest thing on
        // the page next to a navy-and-gold interface.
        "score-low": "rgb(var(--danger-500))",
        "score-medium": "rgb(var(--warning-500))",
        "score-high": "rgb(var(--success-500))",
        "score-excellent": "rgb(var(--secondary-500))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Arabic first in the stack, Latin behind it. IBM Plex Sans Arabic is
        // unicode-range scoped, so Latin glyphs fall through to IBM Plex Sans
        // — one superfamily, two scripts, no mismatch at the boundary.
        //
        // The self-hosted "RB" display face is gone. Display faces have no
        // real Latin glyphs and no presentation forms for shaping, which is
        // why Arabic rendered unjoined wherever it took over.
        sans: ["var(--font-arabic)", "var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-arabic)", "var(--font-sans)", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
        latin: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "h1": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h2": ["2rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
        "h3": ["1.5rem", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        "h4": ["1.25rem", { lineHeight: "1.5", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "body": ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        "caption": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.01em" }],
      },
      spacing: {
        "4.5": "1.125rem",
        "18": "4.5rem",
        "76": "19rem",
      },
      boxShadow: {
        "soft": "0 2px 8px 0 rgb(0 0 0 / 0.04)",
        "card": "0 2px 10px 0 rgb(0 0 0 / 0.06)",
        "elevated": "0 8px 24px -4px rgb(0 0 0 / 0.08)",
        "float": "0 12px 32px -4px rgb(0 0 0 / 0.12)",
        "modal": "0 24px 48px -12px rgb(0 0 0 / 0.18)",
        "primary-glow": "0 8px 24px -4px rgb(var(--primary) / 0.25)",
        "success-glow": "0 8px 16px -4px rgb(var(--success) / 0.25)",
        "warning-glow": "0 8px 16px -4px rgb(var(--warning) / 0.25)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
        "score-fill": {
          "from": { strokeDashoffset: "283" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "check-mark": {
          "0%": { transform: "scale(0)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "slide-down": {
          "from": { opacity: "0", maxHeight: "0" },
          "to": { opacity: "1", maxHeight: "500px" },
        },
        "progress-fill": {
          "0%": { width: "0%" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "fade-in-down": "fade-in-down 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
        "progress-fill": "progress-fill 1s ease-out forwards",
        "shimmer": "shimmer 2s infinite linear",
        "score-fill": "score-fill 1.5s ease-out forwards",
        "count-up": "count-up 0.5s ease-out forwards",
        "check-mark": "check-mark 0.3s ease-out forwards",
        "slide-down": "slide-down 0.3s ease-out forwards",
        "float": "float 3s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
