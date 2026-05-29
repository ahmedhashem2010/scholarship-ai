"use client"

import { useEffect, useRef } from "react"
import confetti from "canvas-confetti"

interface ConfettiTriggerProps {
  trigger: boolean
}

export function ConfettiTrigger({ trigger }: ConfettiTriggerProps) {
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true
      
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#2563EB", "#10B981", "#F59E0B", "#3B82F6", "#22C55E"],
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#2563EB", "#10B981", "#F59E0B", "#3B82F6", "#22C55E"],
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [trigger])

  return null
}
