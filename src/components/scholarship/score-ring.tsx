"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ScoreRingProps {
  score: number
  maxScore?: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function ScoreRing({
  score,
  maxScore = 10,
  size = 160,
  strokeWidth = 12,
  className,
}: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [mounted, setMounted] = useState(false)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / maxScore) * 100
  const offset = circumference - (progress / 100) * circumference

  const getScoreColor = (s: number) => {
    if (s <= 4) return "stroke-score-low"
    if (s <= 6) return "stroke-score-medium"
    if (s <= 8) return "stroke-score-high"
    return "stroke-score-excellent"
  }

  const getScoreTextColor = (s: number) => {
    if (s <= 4) return "text-score-low"
    if (s <= 6) return "text-score-medium"
    if (s <= 8) return "text-score-high"
    return "text-score-excellent"
  }

  const getScoreLabel = (s: number) => {
    if (s <= 4) return "Needs Work"
    if (s <= 6) return "Getting There"
    if (s <= 8) return "Great Progress"
    return "Excellent!"
  }

  useEffect(() => {
    setMounted(true)
    const duration = 1500
    const steps = 60
    const increment = score / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setAnimatedScore(score)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.round(current * 10) / 10)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score])

  if (!mounted) {
    return (
      <div
        className={cn("flex flex-col items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <div className="h-full w-full animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  return (
    <div
      className={cn("relative flex flex-col items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-out", getScoreColor(score))}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={cn("text-4xl font-bold animate-count-up", getScoreTextColor(score))}>
          {Math.round(animatedScore)}
          <span className="text-xl text-muted-foreground">/{maxScore}</span>
        </div>
        <span className={cn("mt-1 text-sm font-medium", getScoreTextColor(score))}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  )
}
