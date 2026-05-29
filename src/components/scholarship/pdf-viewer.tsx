"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from "react"
import { Worker, Viewer } from "@react-pdf-viewer/core"
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout"
import "@react-pdf-viewer/core/lib/styles/index.css"
import "@react-pdf-viewer/default-layout/lib/styles/index.css"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, FileWarning } from "lucide-react"

interface PDFViewerProps {
  documentUrl?: string
  fileType?: string
  isLoading?: boolean
  isEmpty?: boolean
}

export function PDFViewer({
  documentUrl,
  fileType,
  isLoading = false,
  isEmpty = false,
}: PDFViewerProps) {
  const [docxHtml, setDocxHtml] = useState<string | null>(null)
  const [docxLoading, setDocxLoading] = useState(false)
  const [docxError, setDocxError] = useState(false)
  const docxContainerRef = useRef<HTMLDivElement>(null)

  const isWord =
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"

  useEffect(() => {
    if (!documentUrl || !isWord) {
      setDocxHtml(null)
      setDocxError(false)
      return
    }

    let cancelled = false
    setDocxLoading(true)
    setDocxError(false)

    fetch(documentUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.arrayBuffer()
      })
      .then(async (buffer) => {
        if (cancelled) return
        const mammoth = await import("mammoth")
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
        if (cancelled) return
        setDocxHtml(result.value)
        setDocxLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setDocxError(true)
        setDocxLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [documentUrl, isWord])

  const defaultLayoutPluginInstance = defaultLayoutPlugin()

  if (isLoading) {
    return (
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/30 p-3">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          <Skeleton className="h-[500px] w-full" />
        </div>
      </Card>
    )
  }

  if (isEmpty || !documentUrl) {
    return (
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/30 p-3">
          <span className="text-sm font-medium text-muted-foreground">No Document</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <div className="rounded-full bg-muted p-6">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground">No document uploaded</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a document to see the preview here
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (isWord) {
    if (docxLoading) {
      return (
        <Card className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/30 p-3">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex flex-1 items-center justify-center p-8">
            <Skeleton className="h-[500px] w-full" />
          </div>
        </Card>
      )
    }

    if (docxError) {
      return (
        <Card className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/30 p-3">
            <span className="text-sm font-medium text-muted-foreground">Document</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div className="rounded-full bg-muted p-6">
              <FileWarning className="h-12 w-12 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">Failed to load document</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Could not fetch or render this file
              </p>
            </div>
          </div>
        </Card>
      )
    }

    return (
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-2">
          <span className="text-sm font-medium text-foreground">Document Preview</span>
        </div>
        {docxHtml && (
          <div
            ref={docxContainerRef}
            className="flex-1 overflow-auto bg-card p-8"
            style={{ height: "calc(100vh - 12rem)" }}
            dangerouslySetInnerHTML={{ __html: docxHtml }}
          />
        )}
      </Card>
    )
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="relative flex-1" style={{ height: "calc(100vh - 12rem)" }}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={documentUrl}
            plugins={[defaultLayoutPluginInstance]}
          />
        </Worker>
      </div>
    </Card>
  )
}
