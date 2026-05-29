"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Upload, Sparkles, ArrowRight } from "lucide-react"

interface EmptyDocumentsProps {
  onUploadClick?: () => void
}

export function EmptyDocuments({ onUploadClick }: EmptyDocumentsProps) {
  return (
    <Card className="border-dashed border-2 border-border">
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <FileText className="h-12 w-12 text-primary" />
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
          No documents yet
        </h2>

        <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
          Upload your first document to get AI-powered feedback and improve your scholarship applications.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onUploadClick} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Start from Template
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border w-full max-w-md">
          <p className="text-sm text-muted-foreground mb-4">
            We support these document types:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Personal Statement", "CV / Resume", "Research Proposal", "Cover Letter", "SOP"].map((type) => (
              <span
                key={type}
                className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface EmptyScholarshipsProps {
  onBrowseClick?: () => void
}

export function EmptyScholarships({ onBrowseClick }: EmptyScholarshipsProps) {
  return (
    <Card className="border-dashed border-2 border-border">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="rounded-full bg-success/10 p-4 mb-4">
          <Sparkles className="h-8 w-8 text-success" />
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          Complete your profile
        </h3>

        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          Add your academic background and interests to get personalized scholarship matches.
        </p>

        <Button variant="outline" onClick={onBrowseClick} className="gap-2">
          Complete Profile
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
