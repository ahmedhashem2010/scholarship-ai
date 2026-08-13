"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, MapPin, ArrowUpRight, Trophy } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface AppDocument {
  documentType: string;
  status: string;
}

interface Application {
  id: string;
  scholarshipId: string;
  status: string;
  progress: number;
  updatedAt: string;
  scholarship: {
    nameEn: string;
    nameAr: string;
    country: string;
  } | null;
  documents: AppDocument[];
}

function SkeletonRow() {
  return <div className="h-[104px] animate-pulse rounded-2xl bg-muted/80" />;
}

export default function ApplicationsPage() {
  const { pick, num } = useLanguage();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/applications");
        const json = await res.json();
        if (json.success && !cancelled) setApps(json.data ?? []);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalReady = apps.reduce(
    (sum, app) => sum + app.documents.filter((d) => d.status === "READY").length,
    0
  );
  const totalDocs = apps.reduce((sum, app) => sum + app.documents.length, 0);

  return (
    <div className="space-y-8">
      <header className="dash-in">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary-700 dark:text-secondary-400">
          {pick("الطلبات", "Applications")}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {pick("طلباتي", "My applications")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading
            ? pick("جارٍ تحميل طلباتك…", "Loading your applications…")
            : apps.length === 0
              ? pick("ابدأ أول طلب لك من أي منحة متطابقة.", "Start your first application from any match.")
              : pick(`${num(apps.length)} طلب نشط · ${num(totalReady)}/${num(totalDocs)} مستند جاهز`, `${apps.length} active application${apps.length === 1 ? "" : "s"} · ${totalReady}/${totalDocs} documents ready`)}
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="dash-scale-in rounded-3xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
          <Trophy className="mx-auto h-10 w-10 text-secondary-500" />
          <h2 className="mt-4 text-lg font-bold text-foreground">{pick("لا توجد طلبات بعد", "No applications yet")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {pick(
              "اختر إحدى المنح المطابقة وابدأ بتتبّع المستندات والمواعيد وتقدمك في مكان واحد.",
              "Pick one of your matched scholarships and start tracking documents, deadlines and progress in one place."
            )}
          </p>
          <Link
            href="/scholarships"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-700"
          >
            {pick("تصفّح المنح", "Browse scholarships")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {apps.map((app) => {
            const pct = Math.min(Math.max(app.progress || 0, 0), 100);
            const ready = app.documents.filter((d) => d.status === "READY").length;

            // The scholarship this application referenced no longer exists
            // (removed during the MVP database freeze). Never crash the page —
            // render a safe "no longer available" card instead.
            if (!app.scholarship) {
              return (
                <div
                  key={app.id}
                  className="dash-scale-in rounded-2xl border border-dashed border-border bg-muted/30 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <FolderKanban className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-muted-foreground">
                          {pick("المنحة لم تعد متاحة", "Scholarship no longer available")}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {pick(
                            "أُزيلت هذه المنحة من القائمة، لذا لا يمكن فتح هذا الطلب.",
                            "This scholarship was removed from the catalog, so this application can't be opened."
                          )}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={app.id}
                href={`/dashboard/applications/${app.scholarshipId}`}
                className="dash-scale-in group rounded-2xl border border-border bg-card p-5 shadow-[0_14px_34px_-18px_rgb(22_44_76_/_0.35)] transition hover:-translate-y-0.5 hover:border-secondary-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-500/12 text-secondary-700 dark:text-secondary-400">
                      <FolderKanban className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary-700">
                        {pick(app.scholarship.nameAr, app.scholarship.nameEn)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {app.scholarship.country}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {pick(`${num(ready)}/${num(app.documents.length)} مستند جاهز`, `${ready}/${app.documents.length} documents ready`)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-secondary-700 dark:text-secondary-400">
                    {pick("فتح", "Open")} <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs font-medium text-foreground">{pick(`${num(pct)}% مكتمل`, `${pct}% complete`)}</p>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {pick(
          "تتحدّث الحالة تلقائياً عند رفع مستنداتك ومراجعتها.",
          "Status updates automatically as you upload and review your documents."
        )}
      </p>
    </div>
  );
}
