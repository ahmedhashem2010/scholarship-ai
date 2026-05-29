"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImprovementChecklistProps {
  improvements: string[]
}

export function ImprovementChecklist({ improvements }: ImprovementChecklistProps) {
  const [completed, setCompleted] = useState<boolean[]>(new Array(improvements.length).fill(false))

  const toggleTask = (index: number) => {
    setCompleted((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  const doneCount = completed.filter(Boolean).length
  const pct = improvements.length > 0 ? Math.round((doneCount / improvements.length) * 100) : 0
  const allDone = pct === 100 && improvements.length > 0

  return (
    <div className="rounded-lg border bg-card text-foreground">
      <div className="border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Improvement Checklist</h3>
          </div>
          <span className="text-sm tabular-nums text-muted-foreground">{pct}%</span>
        </div>

        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="divide-y">
        {improvements.map((improvement, i) => (
          <li
            key={i}
            onClick={() => toggleTask(i)}
            className={cn(
              "flex cursor-pointer items-start gap-3 px-4 py-3 text-sm transition-colors duration-150",
              completed[i] && "bg-muted/40",
              "hover:bg-muted/60",
            )}
          >
            {completed[i] ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <span
              className={cn(
                "transition-colors duration-150",
                completed[i] && "text-muted-foreground line-through",
              )}
            >
              {improvement}
            </span>
          </li>
        ))}
      </ul>

      {allDone && (
        <div className="border-l-4 border-green-500 bg-green-500/10 px-4 py-3">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
            <div>
              <p className="font-semibold text-foreground">All improvements completed!</p>
              <p className="text-sm text-muted-foreground">
                Ready to upload your improved version.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
