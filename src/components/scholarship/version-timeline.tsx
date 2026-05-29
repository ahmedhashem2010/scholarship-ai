"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, Upload } from "lucide-react"

interface Version {
  id: string
  version: number
  date: string
  score: number
  isCurrent?: boolean
}

interface VersionTimelineProps {
  versions: Version[]
  className?: string
}

export function VersionTimeline({ versions, className }: VersionTimelineProps) {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-2", className)}>
      {versions.map((version, index) => (
        <div key={version.id} className="flex items-center">
          <button
            className={cn(
              "group flex flex-col items-center gap-1.5 rounded-lg px-4 py-3 transition-all hover:bg-muted/50",
              version.isCurrent && "bg-primary/5 ring-2 ring-primary/20"
            )}
            aria-label={`View version ${version.version}`}
          >
            <div className="relative">
              {version.isCurrent ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground group-hover:text-foreground" />
              )}
            </div>
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "text-sm font-medium",
                  version.isCurrent ? "text-primary" : "text-foreground"
                )}
              >
                v{version.version}
              </span>
              <span className="text-xs text-muted-foreground">{version.date}</span>
              <span
                className={cn(
                  "mt-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  version.score <= 4 && "bg-score-low/10 text-score-low",
                  version.score > 4 && version.score <= 6 && "bg-score-medium/10 text-score-medium",
                  version.score > 6 && version.score <= 8 && "bg-score-high/10 text-score-high",
                  version.score > 8 && "bg-score-excellent/10 text-score-excellent"
                )}
              >
                {version.score}/10
              </span>
            </div>
          </button>
          {index < versions.length - 1 && (
            <div className="h-px w-8 bg-border" />
          )}
        </div>
      ))}
      <div className="flex items-center">
        <div className="h-px w-8 bg-border" />
        <button
          className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/30 px-4 py-3 transition-all hover:border-primary hover:bg-primary/5"
          aria-label="Upload new version"
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">New</span>
        </button>
      </div>
    </div>
  )
}
