"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  PenLine
} from "lucide-react"

interface FeedbackItem {
  id: string
  text: string
  completed?: boolean
}

interface FeedbackSectionProps {
  title: string
  icon: "checklist" | "strength" | "weakness" | "grammar"
  items: FeedbackItem[]
  defaultExpanded?: boolean
  isChecklist?: boolean
  onChecklistChange?: (id: string, checked: boolean) => void
}

const iconMap = {
  checklist: ClipboardList,
  strength: CheckCircle2,
  weakness: AlertTriangle,
  grammar: PenLine,
}

const iconColorMap = {
  checklist: "text-primary",
  strength: "text-success",
  weakness: "text-warning",
  grammar: "text-muted-foreground",
}

export function FeedbackSection({
  title,
  icon,
  items,
  defaultExpanded = false,
  isChecklist = false,
  onChecklistChange,
}: FeedbackSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const Icon = iconMap[icon]

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md">
      <CardHeader
        className="cursor-pointer select-none py-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-lg bg-muted p-2", iconColorMap[icon])}>
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {isChecklist && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {items.filter((i) => i.completed).length}/{items.length}
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </div>
      </CardHeader>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="space-y-3 pb-4 pt-0">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3 transition-all",
                  isChecklist && "hover:bg-muted/50",
                  item.completed && "bg-success/5"
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {isChecklist ? (
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={(checked) => {
                      onChecklistChange?.(item.id, checked as boolean)
                    }}
                    className="mt-0.5"
                  />
                ) : icon === "strength" ? (
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                )}
                <label
                  htmlFor={isChecklist ? item.id : undefined}
                  className={cn(
                    "text-sm leading-relaxed text-foreground/90",
                    isChecklist && "cursor-pointer",
                    item.completed && "text-muted-foreground line-through"
                  )}
                >
                  {item.text}
                </label>
              </div>
            ))}
          </CardContent>
        </div>
      </div>
    </Card>
  )
}
