"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/scholarship/header"
import { useLanguage } from "@/contexts/LanguageContext"
import { ImprovementChecklist } from "@/components/ImprovementChecklist"
import { ConfettiTrigger } from "@/components/scholarship/confetti-trigger"
import { EmptyDocuments } from "@/components/scholarship/empty-states"
import dynamic from "next/dynamic"

const ReviewDisplay = dynamic(() => import("@/components/ReviewDisplay").then(m => ({ default: m.ReviewDisplay })), {
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-muted" />,
})
// PDF viewer disabled for competition submission
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Upload, FileText, Clock, Target } from "lucide-react"

export default function DocumentReviewPage() {
  const params = useParams()
  const documentId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const { isRTL } = useLanguage()
  const [reviewData, setReviewData] = useState<any>(null)
  const [documentData, setDocumentData] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    fetchReviewData()
  }, [documentId])

  const fetchReviewData = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/documents/${documentId}/review`)
      const result = await response.json()

      if (result.success && result.data) {
        setReviewData(result.data)

        if (result.data.overallQuality?.score > 8) {
          setTimeout(() => setShowConfetti(true), 500)
        }
      }

      if (result.document) {
        setDocumentData(result.document)
      }

    } catch (error) {
      console.error('Failed to fetch review:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadNewVersion = () => {
    window.location.href = '/dashboard/documents'
  }

  if (!reviewData && !isLoading) {
    return (
      <div className={cn("min-h-screen bg-background", isRTL && "rtl")}>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-6">
          <EmptyDocuments onUploadClick={() => window.location.href = '/dashboard/documents'} />
        </main>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-background", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
      <ConfettiTrigger trigger={showConfetti} />
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                Your AI Review
              </h1>
              {documentData?.documentType && (
                <Badge variant="secondary" className="gap-1">
                  <Target className="h-3 w-3" />
                  {documentData.documentType}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-powered feedback to strengthen your application
            </p>
          </div>
          <Button className="gap-2" onClick={handleUploadNewVersion}>
            <Upload className="h-4 w-4" />
            Upload Improved Version
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            {isLoading ? (
              <>
                <Card>
                  <CardContent className="flex items-center gap-6 p-6">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="mt-2 h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <ReviewDisplay review={reviewData} />
                <ImprovementChecklist improvements={reviewData.topImprovements} />
                <div className="rounded-lg bg-primary/5 p-4 text-center">
                  <p className="mb-3 font-semibold text-foreground">Ready to improve?</p>
                  <Button onClick={handleUploadNewVersion}>
                    Upload Improved Version
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{documentData?.documentType || "Document"}</span>
                <span className="mx-1">·</span>
                <Clock className="h-4 w-4" />
                <span>Version {documentData?.version || 1}</span>
              </div>
              <div className="flex h-96 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">PDF viewer temporarily disabled</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
