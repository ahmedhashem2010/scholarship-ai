"use client"

import { useEffect, useState } from "react"
import { FileText, Plus, ChevronRight, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DocumentWithScore {
  id: string
  documentType: string
  fileName: string
  score: number | null
  lastUpdated: string
}

export function DocumentProgress() {
  const [documents, setDocuments] = useState<DocumentWithScore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await fetch("/api/documents")
        const json = await res.json()
        if (!json.success) { setLoading(false); return }

        const docs = await Promise.all(
          (json.data || []).map(async (doc: any) => {
            let score: number | null = doc.reviews?.[0]?.score ?? null
            if (score === null) {
              try {
                const reviewRes = await fetch(`/api/documents/${doc.id}/latest-review`)
                const reviewJson = await reviewRes.json()
                if (reviewJson.success && reviewJson.data) score = reviewJson.data.score
              } catch {}
            }
            return {
              id: doc.id,
              documentType: doc.documentType || "Document",
              fileName: doc.fileName,
              score,
              lastUpdated: doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "Recently",
            }
          })
        )
        setDocuments(docs)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
  }, [])

  const doneCount = documents.filter((d) => d.score !== null && d.score >= 6).length

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Document Progress</h2>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{documents.length} done
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-3">
          {documents.slice(0, 3).map((doc) => (
            <Link
              key={doc.id}
              href={`/dashboard/documents/${doc.id}`}
              className="group block"
            >
              <div className="rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <FileText className="h-4 w-4 text-primary" />
                  {doc.score !== null ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        doc.score >= 8 && "text-emerald-500",
                        doc.score >= 6 && doc.score < 8 && "text-amber-500",
                        doc.score < 6 && "text-red-500"
                      )}
                    >
                      {doc.score}/10
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      No review
                    </Badge>
                  )}
                </div>
                <p className="mb-1 text-sm font-medium text-foreground group-hover:text-primary">
                  {doc.documentType}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{doc.lastUpdated}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">No documents yet</p>
          <Link
            href="/dashboard/documents"
            className="mt-2 inline-flex h-7 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium whitespace-nowrap text-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Upload
          </Link>
        </div>
      )}
    </div>
  )
}
