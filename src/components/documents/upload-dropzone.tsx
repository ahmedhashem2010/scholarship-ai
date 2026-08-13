"use client";

import { useState, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const DOCUMENT_TYPES = [
  { value: "PERSONAL_STATEMENT", labelAr: "البيان الشخصي", labelEn: "Personal Statement" },
  { value: "CV", labelAr: "السيرة الذاتية", labelEn: "CV / Resume" },
  { value: "MOTIVATION_LETTER", labelAr: "خطاب الدوافع", labelEn: "Motivation Letter" },
  { value: "OTHER", labelAr: "أخرى", labelEn: "Other" },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDropzone({
  onUploadComplete,
}: {
  onUploadComplete: () => void;
}) {
  const { pick } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("PERSONAL_STATEMENT");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) validateAndSet(f);
  }

  function validateAndSet(f: File) {
    setError(null);
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowed.includes(f.type)) {
      setError(pick("يُسمح فقط بملفات PDF و DOCX و TXT", "Only PDF, DOCX, and TXT files are allowed"));
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError(pick("الملف يتجاوز حد 10MB", "File exceeds 10MB limit"));
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", type);

    try {
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? pick("فشل الرفع", "Upload failed"));
      } else {
        setFile(null);
        setType("PERSONAL_STATEMENT");
        onUploadComplete();
      }
    } catch {
      setError(pick("فشل الرفع. حاول مرة أخرى.", "Upload failed. Please try again."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">{pick("نوع المستند", "Document Type")}</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {DOCUMENT_TYPES.map((dt) => (
            <option key={dt.value} value={dt.value}>{pick(dt.labelAr, dt.labelEn)}</option>
          ))}
        </select>
      </div>

      <div
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {file ? (
          <div className="space-y-1">
            <p className="font-medium text-foreground">{file.name}</p>
            <p className="text-sm text-muted-foreground">{formatSize(file.size)}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="text-sm text-red-600 hover:underline"
            >
              {pick("إزالة", "Remove")}
            </button>
          </div>
        ) : (
          <>
            <p className="font-medium text-foreground">{pick("أفلت ملفك هنا", "Drop your file here")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{pick("أو انقر للتصفح (PDF، DOCX، TXT بحد أقصى 10MB)", "or click to browse (PDF, DOCX, TXT · max 10MB)")}</p>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" disabled={!file || uploading} className="w-full">
        {uploading ? pick("جارٍ الرفع…", "Uploading...") : pick("رفع المستند", "Upload Document")}
      </Button>
    </form>
  );
}
