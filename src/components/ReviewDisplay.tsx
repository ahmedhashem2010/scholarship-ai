"use client"

import { CheckCircle, AlertCircle, Lightbulb, Zap, MessageSquare } from "lucide-react"

interface WeakSentence {
  quote: string
  issue: string
}

interface ReviewDisplayProps {
  review: {
    score: number
    reasoning: string
    strongPoints: string[]
    weakSentences: WeakSentence[]
    improvements: string[]
    quickWins: string[]
    assessment: string
  }
}

export function ReviewDisplay({ review }: ReviewDisplayProps) {
  return (
    <div className="space-y-6">
      {/* SCORE */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-white shadow-lg">
        <div className="flex flex-col items-center text-center">
          <span className="text-5xl font-bold">{review.score}</span>
          <span className="mt-1 text-sm font-medium text-white/80">out of 10</span>
          <p className="mt-3 text-sm leading-relaxed text-white/90">{review.reasoning}</p>
        </div>
      </div>

      {/* STRONG POINTS */}
      <div className="rounded-xl border border-success/20 bg-success/5 p-5">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success" />
          <h3 className="font-semibold text-foreground">Strong Points</h3>
        </div>
        <ul className="space-y-2">
          {review.strongPoints.map((point, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-lg bg-success/10 p-3 text-sm text-foreground"
            >
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* WEAK SENTENCES */}
      {review.weakSentences.length > 0 && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <h3 className="font-semibold text-foreground">Sentences to Improve</h3>
          </div>
          <ul className="space-y-3">
            {review.weakSentences.map((item, i) => (
              <li key={i} className="border-l-4 border-warning/50 pl-4">
                <p className="text-sm italic text-foreground/80">&ldquo;{item.quote}&rdquo;</p>
                <p className="mt-1 text-sm text-warning">{item.issue}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* TOP 5 IMPROVEMENTS */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 dark:border-indigo-400/20 dark:bg-indigo-400/5">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          <h3 className="font-semibold text-foreground">Top 5 Improvements</h3>
        </div>
        <ol className="space-y-2">
          {review.improvements.map((imp, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400">
                {i + 1}
              </span>
              <span className="pt-0.5">{imp}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* QUICK WINS */}
      {review.quickWins.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5 dark:border-yellow-400/20 dark:bg-yellow-400/5">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            <h3 className="font-semibold text-foreground">Quick Wins</h3>
          </div>
          <ul className="space-y-2">
            {review.quickWins.map((win, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg bg-yellow-500/10 p-3 text-sm text-foreground dark:bg-yellow-400/10"
              >
                <span className="mt-0.5 text-yellow-500 dark:text-yellow-400">•</span>
                <span>{win}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* OVERALL ASSESSMENT */}
      <div className="rounded-xl border-l-4 border-primary bg-card p-5">
        <div className="mb-2 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Overall Assessment</h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{review.assessment}</p>
      </div>
    </div>
  )
}
