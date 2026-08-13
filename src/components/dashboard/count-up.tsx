"use client"

import { useEffect, useState } from "react"

interface CountUpProps {
  value: number
  /** Round to this many decimals (default 0). */
  decimals?: number
  /** Duration in ms. */
  duration?: number
  className?: string
  /** Kept out of the DOM when true — used to reserve exact text width. */
  tabular?: boolean
  /** Intl locale for digit formatting — pass "ar-EG" to render Arabic-Indic numerals. */
  locale?: string
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

  const formatted = display.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span
      className={className}
      style={tabular ? { fontVariantNumeric: "tabular-nums" } : undefined}
    >
      {mounted ? formatted : value.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  )
}
