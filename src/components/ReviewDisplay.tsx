"use client"

import { Lightbulb, Zap, MessageSquare } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { calculateAverageScore, type ReviewScore } from "@/lib/ai-review"

export function ReviewDisplay({ review }: { review: ReviewScore }) {
  const mainScore = calculateAverageScore(review)

  return (
    <div className="space-y-6">
      {/* Main Score - Average of all 3 */}
      <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="text-center">
            <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
              {mainScore}
            </div>
            <div className="mt-2 text-lg text-muted-foreground dark:text-gray-400">
              Overall Score (Average)
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Three Detailed Scores */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              💡 Overall Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {review.overallQuality.score}
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-green-600 dark:text-green-400">
              Strengths: {review.overallQuality.strengthsSummary}
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Weaknesses: {review.overallQuality.weaknessesSummary}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              🔍 ATS Compatibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {review.atsCompatibility.score}
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground dark:text-gray-400">
              <span className="font-semibold">Missing Keywords:</span>
              {review.atsCompatibility.missingKeywords.length > 0
                ? ` ${review.atsCompatibility.missingKeywords.join(", ")}`
                : " None!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              🚀 Competitiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {review.competitiveness.score}
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground dark:text-gray-400">
              {review.competitiveness.uniqueStrengths}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TOP IMPROVEMENTS */}
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
