"use client"

import { useEffect, useState } from "react"
import { localiseNumber } from "@/lib/i18n"

interface CountUpProps {
  value: number
  /** Round to this many decimals (default 0). */
  decimals?: number
  /** Duration in ms. */
  duration?: number
  className?: string
  /** Kept out of the DOM when true — used to reserve exact text width. */
  tabular?: boolean
  /** Pass "ar-EG" to render Arabic-Indic numerals, any other value renders Western digits. */
  locale?: string
}

/**
 * Formats a fixed-decimal number for display. Arabic digits are produced via
 * the same manual substitution `num()` uses everywhere else in the app,
 * NOT `toLocaleString("ar-EG", …)` — that Intl path renders inconsistently
 * (missing/garbled digits) across mobile browsers' ICU data, especially
 * combined with fractional values and an animating (non-integer) input.
 */
function formatCount(n: number, decimals: number, locale: string): string {
  const fixed = n.toFixed(decimals)
  if (locale.startsWith("ar")) return localiseNumber(fixed, "ar")
  return Number(fixed).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Animates a number from 0 to `value` on mount using requestAnimationFrame.
 * Respects prefers-reduced-motion (jumps straight to the final value) and
 * never runs before hydration, so SSR/CSR text always agree.
 */
export function CountUp({
  value,
  decimals = 0,
  duration = 1100,
  className,
  tabular = true,
  locale = "en-US",
}: CountUpProps) {
  const [display, setDisplay] = useState(value)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) {
      setDisplay(value)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return (
    <span
      className={className}
      style={tabular ? { fontVariantNumeric: "tabular-nums" } : undefined}
    >
      {formatCount(mounted ? display : value, decimals, locale)}
    </span>
  )
}
