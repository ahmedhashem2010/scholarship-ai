"use client"

import { Lightbulb, Zap, MessageSquare, Award, FileSearch, TrendingUp } from "lucide-react"

interface ReviewDisplayProps {
  review: {
    overallQuality: {
      score: number
      strengthsSummary: string
      weaknesseSummary: string
    }
    atsCompatibility: {
      score: number
      missingKeywords: string[]
      improvements: string[]
    }
    competitiveness: {
      score: number
      uniqueStrengths: string
      differentiation: string
    }
    topImprovements: string[]
    quickWins: string[]
    overallAssessment: string
  }
}

function ScoreCard({
  icon: Icon,
  label,
  score,
  children,
}: {
  icon: React.ElementType
  label: string
  score: number
  children: React.ReactNode
}) {
  const color =
    score >= 8 ? "text-green-600 dark:text-green-400" :
    score >= 6 ? "text-yellow-600 dark:text-yellow-400" :
    "text-red-600 dark:text-red-400"

  const bg =
    score >= 8 ? "from-green-500/10 to-green-600/5 border-green-500/20" :
    score >= 6 ? "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20" :
    "from-red-500/10 to-red-600/5 border-red-500/20"

  return (
    <div className={`rounded-xl border bg-gradient-to-br ${bg} p-5`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <h3 className="font-semibold text-foreground">{label}</h3>
      </div>
      <div className="mb-3 flex items-baseline gap-1">
        <span className={`text-4xl font-bold ${color}`}>{score}</span>
        <span className="text-sm text-muted-foreground">/ 10</span>
      </div>
      {children}
    </div>
  )
}

export function ReviewDisplay({ review }: ReviewDisplayProps) {
  return (
    <div className="space-y-6">
      {/* THREE SCORE CARDS */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreCard icon={Award} label="Overall Quality" score={review.overallQuality.score}>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-green-600 dark:text-green-400">Strengths:</span>
              <p className="text-muted-foreground">{review.overallQuality.strengthsSummary}</p>
            </div>
            <div>
              <span className="font-medium text-red-600 dark:text-red-400">Weaknesses:</span>
              <p className="text-muted-foreground">{review.overallQuality.weaknesseSummary}</p>
            </div>
          </div>
        </ScoreCard>

        <ScoreCard icon={FileSearch} label="ATS Compatibility" score={review.atsCompatibility.score}>
          <div className="space-y-2 text-sm">
            {review.atsCompatibility.missingKeywords.length > 0 && (
              <div>
                <span className="font-medium text-foreground">Missing Keywords:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {review.atsCompatibility.missingKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs text-orange-600 dark:text-orange-400"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {review.atsCompatibility.improvements.length > 0 && (
              <div>
                <span className="font-medium text-foreground">Improvements:</span>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-muted-foreground">
                  {review.atsCompatibility.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScoreCard>

        <ScoreCard icon={TrendingUp} label="Competitiveness" score={review.competitiveness.score}>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-green-600 dark:text-green-400">Unique Strengths:</span>
              <p className="text-muted-foreground">{review.competitiveness.uniqueStrengths}</p>
            </div>
            <div>
              <span className="font-medium text-blue-600 dark:text-blue-400">Differentiation:</span>
              <p className="text-muted-foreground">{review.competitiveness.differentiation}</p>
            </div>
          </div>
        </ScoreCard>
      </div>

      {/* TOP 5 IMPROVEMENTS */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5 dark:border-indigo-400/20 dark:bg-indigo-400/5">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          <h3 className="font-semibold text-foreground">Top Improvements</h3>
        </div>
        <ol className="space-y-2">
          {review.topImprovements.map((imp, i) => (
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
        <p className="text-sm leading-relaxed text-muted-foreground">{review.overallAssessment}</p>
      </div>
    </div>
  )
}
