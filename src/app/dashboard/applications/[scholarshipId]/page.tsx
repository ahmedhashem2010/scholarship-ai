"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  ArrowLeft,
  CalendarDays,
  Lightbulb,
  ChevronRight,
  BookOpen,
  ListChecks,
  Flag,
} from "lucide-react";
import {
  getNextAction,
  getDeadlineUrgency,
  DOC_TYPE_LABELS,
} from "@/lib/application-progress";

interface ApplicationDoc {
  id: string;
  documentType: string;
  status: string;
  aiScore: number | null;
  uploadedDocumentId: string | null;
  feedback: string | null;
  uploadedDocument?: { id: string; fileName: string; fileUrl: string } | null;
}

interface Scholarship {
  id: string;
  nameEn: string;
  nameAr: string;
  country: string;
  university: string | null;
  degree: string;
  deadline: string | null;
  requirements: string | null;
}

interface Application {
  id: string;
  userId: string;
  scholarshipId: string;
  status: string;
  progress: number;
  startedAt: string;
  submittedAt: string | null;
  scholarship: Scholarship;
  documents: ApplicationDoc[];
}

const docTypeLabels = DOC_TYPE_LABELS;

const docStatusMap: Record<string, string> = {
  NOT_STARTED: "NOT_STARTED",
  DRAFT: "DRAFT",
  IN_REVIEW: "PENDING",
  NEEDS_IMPROVEMENT: "FAILED",
  READY: "READY",
};

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    Japan: "\u{1F1EF}\u{1F1F5}",
    Hungary: "\u{1F1ED}\u{1F1FA}",
    "United Kingdom": "\u{1F1EC}\u{1F1E7}",
    "United States": "\u{1F1FA}\u{1F1F8}",
    Canada: "\u{1F1E8}\u{1F1E6}",
    Germany: "\u{1F1E9}\u{1F1EA}",
    Netherlands: "\u{1F1F3}\u{1F1F1}",
    Poland: "\u{1F1F5}\u{1F1F1}",
  };
  return flags[country] ?? "\u{1F30D}";
}

function getDocumentIcon(type: string) {
  const size = 18;
  switch (type) {
    case "RESEARCH_PROPOSAL":
      return <BookOpen size={size} className="text-violet-500" />;
    case "CV":
      return <FileText size={size} className="text-blue-500" />;
    case "PERSONAL_STATEMENT":
      return <Lightbulb size={size} className="text-amber-500" />;
    case "RECOMMENDATION_LETTER":
      return <FileText size={size} className="text-purple-500" />;
    case "TRANSCRIPT":
      return <BookOpen size={size} className="text-emerald-500" />;
    default:
      return <FileText size={size} className="text-slate-500" />;
  }
}

function daysRemaining(d: string | null): number | null {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function parseRequirements(req: string | null): string[] {
  if (!req) return [];
  try {
    const parsed = JSON.parse(req);
    return parsed.documents ?? [];
  } catch {
    return [];
  }
}

const phases = [
  { num: 1, label: "Research", icon: BookOpen },
  { num: 2, label: "Documents", icon: FileText },
  { num: 3, label: "Review", icon: CheckCircle2 },
  { num: 4, label: "Submit", icon: Upload },
];

export default function ApplicationJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const scholarshipId = params.scholarshipId as string;
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scholarshipId }),
        });
        const json = await res.json();
        if (json.success) {
          setApp(json.data);
        } else {
          setError(json.error);
        }
      } catch {
        setError("Failed to load application");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [scholarshipId]);

  function getPhase(): { current: number; label: string } {
    const p = app?.progress ?? 0;
    if (p < 10) return { current: 1, label: "Research" };
    if (p < 70) return { current: 2, label: "Documents" };
    if (p < 90) return { current: 3, label: "Review" };
    return { current: 4, label: "Submit" };
  }

  async function recalcProgress(_docs: ApplicationDoc[]) {
    const res = await fetch(`/api/applications/${app!.id}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (json.success) setApp(json.data);
  }

  async function handleUpload(docId: string, docType: string) {
    setUploadingDoc(docId);
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.doc,.docx,.txt";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          setUploadingDoc(null);
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", docType);
        // If there's an existing uploaded document, pass it as parent for versioning
        const existingDoc = app!.documents.find(d => d.id === docId);
        if (existingDoc?.uploadedDocumentId) {
          formData.append("parentDocumentId", existingDoc.uploadedDocumentId);
        }

        const uploadRes = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadJson.success) {
          alert(uploadJson.error ?? "Upload failed");
          setUploadingDoc(null);
          return;
        }

        const doc = uploadJson.data;

        // Try AI review
        let aiScore: number | null = null;
        try {
          const reviewRes = await fetch(`/api/documents/${doc.id}/review`, {
            method: "POST",
          });
          const reviewJson = await reviewRes.json();
          if (reviewJson.success && reviewJson.data) {
            aiScore = reviewJson.data.score;
          } else if (reviewJson.error) {
            console.warn("AI Review warning:", reviewJson.error);
          }
        } catch (e) {
          console.warn("AI Review network error:", e);
        }

        // PATCH will auto-calculate status from aiScore
        await fetch(`/api/applications/${app!.id}/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aiScore,
            uploadedDocumentId: doc.id,
          }),
        });

        const refreshed = await fetch(`/api/applications/${app!.id}`);
        const refreshedJson = await refreshed.json();
        if (refreshedJson.success) {
          setApp(refreshedJson.data);
          recalcProgress(refreshedJson.data.documents);
        }
      };
      input.click();
    } finally {
      setUploadingDoc(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            Loading your application...
          </p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <p className="mb-2 text-lg font-semibold text-slate-900">
            Something went wrong
          </p>
          <p className="mb-6 text-sm text-slate-500">
            {error ?? "Application not found"}
          </p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const phase = getPhase();
  const sch = app.scholarship;
  const daysLeft = daysRemaining(sch.deadline);
  const reqList = parseRequirements(sch.requirements);
  const nextAction = getNextAction(app.documents);
  const deadlineUrgency = getDeadlineUrgency(sch.deadline);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ─── Hero Section ─── */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-indigo-200 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{getCountryFlag(sch.country)}</span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {sch.nameEn}
                </h1>
                <p className="mt-1 text-sm text-indigo-200">
                  {sch.country}
                  {sch.university ? <>, {sch.university}</> : ""}
                  {" \u00B7 "}
                  {sch.degree}
                </p>
              </div>
            </div>
            <Badge className="border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
              {app.status.replace(/_/g, " ")}
            </Badge>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-indigo-200">Overall Progress</span>
              <span className="font-semibold text-white">{app.progress}%</span>
            </div>
            <ProgressBar
              value={app.progress}
              size="lg"
              animated
              className="[&>div]:bg-white/20 [&>div>div]:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ─── Phase Tracker ─── */}
        <div className="relative z-10 -mt-7">
          <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center">
                {phases.map((p, i) => {
                  const done = phase.current > p.num;
                  const active = phase.current === p.num;
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.num}
                      className="flex flex-1 items-center last:flex-none"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 sm:h-11 sm:w-11 ${
                            done
                              ? "bg-green-500 text-white shadow-md shadow-green-200"
                              : active
                                ? "border-2 border-indigo-600 bg-indigo-50 text-indigo-600 shadow-md shadow-indigo-200 ring-2 ring-indigo-200"
                                : "border-2 border-slate-200 bg-white text-slate-400"
                          }`}
                        >
                          {done ? (
                            <CheckCircle2 size={20} />
                          ) : active ? (
                            <Icon size={20} />
                          ) : (
                            p.num
                          )}
                        </div>
                        <span
                          className={`mt-1.5 text-[11px] font-medium leading-tight sm:text-xs ${
                            done
                              ? "text-green-700"
                              : active
                                ? "font-semibold text-indigo-700"
                                : "text-slate-400"
                          }`}
                        >
                          {p.label}
                        </span>
                      </div>
                      {i < phases.length - 1 && (
                        <div
                          className={`mx-2 mt-0.5 h-0.5 flex-1 self-start sm:mx-4 ${
                            phase.current > p.num
                              ? "bg-green-500"
                              : "bg-slate-200"
                          }`}
                          style={{ marginTop: "19px" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid gap-8 py-8 lg:grid-cols-[1fr_320px]">
          {/* ─── Left Column: Document Checklist ─── */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                  <ListChecks size={16} className="text-indigo-600" />
                </div>
                <CardTitle className="text-lg">Required Documents</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {app.documents.filter((d) => d.status === "READY").length}/
                  {app.documents.length} ready
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {app.documents.map((doc) => {
                  const isReady = doc.status === "READY";
                  const needsWork = doc.status === "NEEDS_IMPROVEMENT";
                  const hasReview = doc.status === "IN_REVIEW";
                  const notStarted = doc.status === "NOT_STARTED";
                  const isDraft = doc.status === "DRAFT";

                  return (
                    <div
                      key={doc.id}
                      className={`group rounded-xl border p-4 transition-all hover:shadow-md ${
                        isReady
                          ? "border-green-200 bg-green-50/60"
                          : needsWork
                            ? "border-red-200 bg-red-50/60"
                            : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              isReady
                                ? "bg-green-100"
                                : needsWork
                                  ? "bg-red-100"
                                  : "bg-slate-100"
                            }`}
                          >
                            {getDocumentIcon(doc.documentType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-medium text-slate-900">
                                {docTypeLabels[doc.documentType] ??
                                  doc.documentType}
                              </span>
                              <StatusBadge
                                status={
                                  docStatusMap[doc.status] ?? doc.status
                                }
                                size="sm"
                              />
                            </div>

                            {doc.aiScore !== null && (
                              <div className="mt-2 flex items-center gap-2">
                                <ProgressBar
                                  value={doc.aiScore * 10}
                                  size="sm"
                                  className="max-w-[120px]"
                                />
                                <span className="text-xs font-medium text-slate-500">
                                  AI Score: {doc.aiScore}/10
                                </span>
                              </div>
                            )}

                            {needsWork && doc.feedback && (
                              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle size={12} />
                                {doc.feedback}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {notStarted && (
                            <Button
                              size="sm"
                              className="gap-1.5"
                              onClick={() =>
                                handleUpload(doc.id, doc.documentType)
                              }
                              disabled={uploadingDoc === doc.id}
                            >
                              <Upload size={14} />
                              {uploadingDoc === doc.id
                                ? "Uploading..."
                                : "Upload First Draft"}
                            </Button>
                          )}
                          {(hasReview || isDraft) && (
                            <div className="flex gap-2">
                              {doc.uploadedDocument && (
                                <a
                                  href={doc.uploadedDocument.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                  >
                                    <FileText size={14} />
                                    View
                                  </Button>
                                </a>
                              )}
                              <Button
                                size="sm"
                                variant={isDraft ? "default" : "outline"}
                                className="gap-1.5"
                                onClick={() =>
                                  handleUpload(doc.id, doc.documentType)
                                }
                                disabled={uploadingDoc === doc.id}
                              >
                                <Upload size={14} />
                                {uploadingDoc === doc.id
                                  ? "Uploading..."
                                  : "Upload New Version"}
                              </Button>
                            </div>
                          )}
                          {needsWork && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="gap-1.5"
                                onClick={() =>
                                  handleUpload(doc.id, doc.documentType)
                                }
                                disabled={uploadingDoc === doc.id}
                              >
                                <Upload size={14} />
                                {uploadingDoc === doc.id
                                  ? "Uploading..."
                                  : "Upload Improved"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                                onClick={async () => {
                                  await fetch(`/api/applications/${app!.id}/documents/${doc.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ markFinal: true, aiScore: doc.aiScore }),
                                  });
                                  const refreshed = await fetch(`/api/applications/${app!.id}`);
                                  const refreshedJson = await refreshed.json();
                                  if (refreshedJson.success) {
                                    setApp(refreshedJson.data);
                                    recalcProgress(refreshedJson.data.documents);
                                  }
                                }}
                              >
                                <CheckCircle2 size={14} />
                                Mark as Final
                              </Button>
                            </div>
                          )}
                          {isReady && (
                            <div className="flex items-center gap-2">
                              {doc.uploadedDocument && (
                                <a
                                  href={doc.uploadedDocument.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                  >
                                    <FileText size={14} />
                                    View
                                  </Button>
                                </a>
                              )}
                              <Badge
                                variant="default"
                                className="gap-1 bg-green-100 text-green-700 hover:bg-green-100"
                              >
                                <CheckCircle2 size={14} />
                                Ready
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* ─── Right Sidebar ─── */}
          <div className="space-y-6">
            {/* Next Action */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flag size={16} className="text-indigo-500" />
                  Next Action
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                  <p className="text-sm font-medium text-indigo-800">
                    {nextAction}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Deadline Countdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays size={16} className="text-indigo-500" />
                  Deadline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={`rounded-lg p-4 text-center ${
                    deadlineUrgency.color === "red"
                      ? "bg-red-50 border border-red-200"
                      : deadlineUrgency.color === "yellow"
                        ? "bg-amber-50 border border-amber-200"
                        : deadlineUrgency.color === "green"
                          ? "bg-green-50 border border-green-200"
                          : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <p
                    className={`text-3xl font-bold ${
                      deadlineUrgency.color === "red"
                        ? "text-red-600"
                        : deadlineUrgency.color === "yellow"
                          ? "text-amber-600"
                          : deadlineUrgency.color === "green"
                            ? "text-green-600"
                            : "text-slate-600"
                    }`}
                  >
                    {deadlineUrgency.daysLeft !== null
                      ? deadlineUrgency.daysLeft
                      : "—"}
                  </p>
                  <p
                    className={`text-xs font-medium mt-1 ${
                      deadlineUrgency.color === "red"
                        ? "text-red-500"
                        : deadlineUrgency.color === "yellow"
                          ? "text-amber-500"
                          : deadlineUrgency.color === "green"
                            ? "text-green-500"
                            : "text-slate-400"
                    }`}
                  >
                    {deadlineUrgency.daysLeft !== null
                      ? "days remaining"
                      : "No deadline set"}
                  </p>
                  {sch.deadline && (
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(sch.deadline).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target size={16} className="text-indigo-500" />
                  Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-50">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      app.progress >= 70
                        ? "bg-green-100 text-green-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {app.progress >= 70 ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        app.progress >= 70
                          ? "text-green-700"
                          : "text-slate-600"
                      }`}
                    >
                      Complete all documents
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {app.documents.filter((d) => d.status === "READY").length}
                      /{app.documents.length} ready
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-50">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      app.progress >= 90
                        ? "bg-green-100 text-green-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {app.progress >= 90 ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Clock size={14} />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-xs font-medium ${
                        app.progress >= 90
                          ? "text-green-700"
                          : "text-slate-600"
                      }`}
                    >
                      Submit application
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {daysLeft !== null
                        ? `${daysLeft} days to submit`
                        : "No deadline"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-50">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <ChevronRight size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      Prepare for interview
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      After submission
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb size={16} className="text-amber-500" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {app.documents.filter((d) => d.status === "NOT_STARTED")
                  .length > 0 && (
                  <div className="flex gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                    <Lightbulb
                      size={16}
                      className="mt-0.5 shrink-0 text-indigo-500"
                    />
                    <p className="text-xs leading-relaxed text-indigo-800">
                      Start with your{" "}
                      <strong>
                        {docTypeLabels[
                          app.documents.find(
                            (d) => d.status === "NOT_STARTED",
                          )?.documentType ?? "PERSONAL_STATEMENT"
                        ] ?? "Personal Statement"}
                      </strong>
                      &mdash; it&apos;s the most important document and needs
                      the most time.
                    </p>
                  </div>
                )}

                {app.documents.some(
                  (d) => d.status === "NEEDS_IMPROVEMENT",
                ) && (
                  <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0 text-amber-500"
                    />
                    <p className="text-xs leading-relaxed text-amber-800">
                      Review the feedback on your{" "}
                      <strong>
                        {app.documents
                          .filter((d) => d.status === "NEEDS_IMPROVEMENT")
                          .map((d) => docTypeLabels[d.documentType])
                          .join(", ")}
                      </strong>{" "}
                      and upload an improved version.
                    </p>
                  </div>
                )}

                {daysLeft !== null && daysLeft <= 30 && (
                  <div className="flex gap-3 rounded-lg border border-red-100 bg-red-50/50 p-3">
                    <Clock
                      size={16}
                      className="mt-0.5 shrink-0 text-red-500"
                    />
                    <p className="text-xs leading-relaxed text-red-800">
                      Only <strong>{daysLeft} days</strong> until the deadline.
                      Prioritize this application!
                    </p>
                  </div>
                )}

                {app.documents.every((d) => d.status === "READY") &&
                  app.documents.length > 0 && (
                    <div className="flex gap-3 rounded-lg border border-green-100 bg-green-50/50 p-3">
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-green-500"
                      />
                      <p className="text-xs leading-relaxed text-green-800">
                        All documents are ready! You can now submit your
                        application.
                      </p>
                    </div>
                  )}

                {app.documents.every(
                  (d) =>
                    d.status === "NOT_STARTED" || d.status === "DRAFT",
                ) &&
                  app.documents.filter((d) => d.status === "NOT_STARTED")
                    .length === 0 &&
                  app.documents.filter((d) => d.status === "NEEDS_IMPROVEMENT")
                    .length === 0 &&
                  !(
                    daysLeft !== null && daysLeft <= 30
                  ) &&
                  !app.documents.every((d) => d.status === "READY") && (
                    <p className="text-xs text-slate-400">
                      Continue working on your documents to get personalized
                      recommendations.
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* Requirements */}
            {reqList.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen size={16} className="text-indigo-500" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {reqList.map((req, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-slate-600"
                      >
                        <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-medium text-indigo-600">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
